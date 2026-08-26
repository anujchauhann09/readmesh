import crypto from 'node:crypto';
import { ApiError } from '../../common/ApiError.js';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { loadRepo, getFileContent } from '../github/github.service.js';
import { parseGithubUrl } from '../github/github.url.js';
import { embedTexts, generateContent, generateContentStream } from '../../lib/gemini.js';
import { upsertVectors, queryVectors, fetchVectors, deleteNamespace } from '../../lib/pinecone.js';
import { createTtlCache } from '../../utils/ttlCache.js';
import { chunkFiles } from './rag.chunker.js';
import { rerank } from './rag.reranker.js';
import { buildAnswerPrompt } from './rag.prompts.js';

const MAX_FILES = 12;
const MAX_CHUNKS = 400;
const EMBED_CONCURRENCY = 5;
const UPSERT_BATCH = 100;
// Retrieve wide, then let the reranker narrow it: MMR needs candidates to choose
// between, and over-fetching from Pinecone is far cheaper than a second LLM call.
const RETRIEVE_CANDIDATES = 24;
const CONTEXT_CHUNKS = 8;

/**
 * Sentinel vector carrying the fingerprint of the content currently indexed in a
 * namespace. It is what makes re-ingestion correct rather than "once, forever":
 * Pinecone's stats only report a count, so without something durable to compare
 * against, an index built from last month's docs looks exactly like a fresh one.
 * Its metadata deliberately has no `text` field, so retrieval filters it out.
 */
const FINGERPRINT_ID = '__readmesh_fingerprint__';

// Namespace fingerprint, memoized to skip the sentinel read on repeat questions.
const indexed = createTtlCache({ ttlMs: 6 * 60 * 60 * 1000, max: 1000 });

export const namespaceFor = (owner, repo, ref) =>
  `${owner}/${repo}@${crypto.createHash('sha1').update(ref).digest('hex').slice(0, 12)}`;

/** A unit vector, so the sentinel is valid under a cosine metric. */
const sentinelValues = () => {
  const values = new Array(config.ai.embedDimension).fill(0);
  values[0] = 1;
  return values;
};

const readFingerprint = async (namespace) => {
  const vectors = await fetchVectors(namespace, [FINGERPRINT_ID]).catch(() => ({}));
  return vectors?.[FINGERPRINT_ID]?.metadata?.fingerprint ?? null;
};

/**
 * Identifies the exact content behind a ref. The git tree SHA changes whenever any
 * file in the repo changes, which is precisely the invalidation signal needed;
 * `pushedAt` is the fallback for the rare tree response without one.
 */
const fingerprintOf = ({ treeSha, repo }) => treeSha ?? repo?.pushedAt ?? 'unknown';

/** Picks the README plus the highest-ranked docs, then fetches their contents. */
const fetchDocumentation = async (owner, repo, ref, repoData) => {
  const files = [];
  if (repoData.readme) {
    files.push({ path: repoData.readme.path, content: repoData.readme.content });
  }

  const rest = repoData.docs
    .map((doc) => doc.path)
    .filter((path) => path !== repoData.readme?.path)
    .slice(0, MAX_FILES - files.length);

  const fetched = await Promise.all(
    rest.map((path) => getFileContent(owner, repo, ref, path).catch(() => null)),
  );
  for (const file of fetched) if (file) files.push({ path: file.path, content: file.content });

  return files;
};

export const ingestRepo = async (url, refOverride, { force = false } = {}) => {
  const { owner, repo } = parseGithubUrl(url);
  const repoData = await loadRepo(`${owner}/${repo}`, refOverride);
  const { ref, repo: meta } = repoData;

  const namespace = namespaceFor(owner, repo, ref);
  const fingerprint = fingerprintOf(repoData);

  if (!force) {
    // Cheap path first: this process already verified this exact content.
    if (indexed.get(namespace) === fingerprint) {
      return { namespace, ref, repo: meta, chunks: 0, skipped: true, fingerprint };
    }
    const stored = await readFingerprint(namespace);
    if (stored && stored === fingerprint) {
      indexed.set(namespace, fingerprint);
      return { namespace, ref, repo: meta, chunks: 0, skipped: true, fingerprint };
    }
    if (stored) {
      logger.info({ namespace, stored, fingerprint }, 'Repo docs changed — reindexing');
    }
  }

  // Either forced, never indexed, or indexed from different content. In the last
  // two cases the namespace is cleared first so stale chunks cannot be retrieved
  // alongside fresh ones (file renames would otherwise linger indefinitely).
  await deleteNamespace(namespace);

  const files = await fetchDocumentation(owner, repo, ref, repoData);
  const chunks = chunkFiles(files).slice(0, MAX_CHUNKS);
  if (chunks.length === 0) {
    throw ApiError.badRequest('No documentation found to index for this repo');
  }

  const vectors = await embedTexts(
    chunks.map((c) => c.text),
    { taskType: 'RETRIEVAL_DOCUMENT', concurrency: EMBED_CONCURRENCY },
  );

  const records = vectors.map((values, i) => ({
    id: `${namespace}#${i}`,
    values,
    metadata: {
      path: chunks[i].path,
      heading: chunks[i].heading ?? '',
      text: chunks[i].text,
    },
  }));

  for (let i = 0; i < records.length; i += UPSERT_BATCH) {
    await upsertVectors(namespace, records.slice(i, i + UPSERT_BATCH));
  }

  // Written last, so an ingestion that dies partway leaves no fingerprint and the
  // next attempt rebuilds instead of trusting a half-filled namespace.
  await upsertVectors(namespace, [
    { id: FINGERPRINT_ID, values: sentinelValues(), metadata: { fingerprint } },
  ]);

  indexed.set(namespace, fingerprint);
  return { namespace, ref, repo: meta, chunks: records.length, skipped: false, fingerprint };
};

const buildCitations = (contexts) => {
  const numberByPath = new Map();
  const sources = [];
  const labeled = contexts.map((c) => {
    if (!numberByPath.has(c.path)) {
      numberByPath.set(c.path, sources.length + 1);
      sources.push({
        number: sources.length + 1,
        path: c.path,
        heading: c.heading,
        score: c.score,
      });
    }
    return { ...c, sourceNum: numberByPath.get(c.path) };
  });
  return { sources, labeled };
};

const retrieve = async (url, question, refOverride) => {
  const { namespace, ref } = await ingestRepo(url, refOverride);

  const [queryVector] = await embedTexts([question], { taskType: 'RETRIEVAL_QUERY' });
  const matches = await queryVectors(namespace, queryVector, { topK: RETRIEVE_CANDIDATES });

  const candidates = matches
    .filter((m) => m.id !== FINGERPRINT_ID && m.metadata?.text)
    .map((m) => ({
      path: m.metadata.path,
      heading: m.metadata.heading,
      text: m.metadata.text,
      score: m.score,
    }));

  return { ref, contexts: rerank(question, candidates, { topN: CONTEXT_CHUNKS }) };
};

const NO_CONTEXT_ANSWER = "I could not find anything relevant in this repository's documentation.";

export const askRepo = async (url, question, refOverride, { history = [] } = {}) => {
  const { ref, contexts } = await retrieve(url, question, refOverride);

  if (contexts.length === 0) {
    return { answer: NO_CONTEXT_ANSWER, sources: [], ref };
  }

  const { sources, labeled } = buildCitations(contexts);
  const answer = await generateContent(buildAnswerPrompt(question, labeled, history));
  return { answer, sources, ref };
};

export async function* askRepoStream(url, question, refOverride, { signal, history = [] } = {}) {
  const { ref, contexts } = await retrieve(url, question, refOverride);
  const { sources, labeled } = buildCitations(contexts);

  yield { type: 'sources', sources, ref };

  if (contexts.length === 0) {
    yield { type: 'delta', text: NO_CONTEXT_ANSWER };
    yield { type: 'done' };
    return;
  }

  for await (const text of generateContentStream({
    ...buildAnswerPrompt(question, labeled, history),
    signal,
  })) {
    yield { type: 'delta', text };
  }
  yield { type: 'done' };
}
