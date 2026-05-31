import crypto from 'node:crypto';
import { ApiError } from '../../common/ApiError.js';
import { loadRepo, getFileContent } from '../github/github.service.js';
import { parseGithubUrl } from '../github/github.url.js';
import { embedTexts, generateContent, generateContentStream } from '../../lib/gemini.js';
import {
  upsertVectors,
  queryVectors,
  deleteNamespace,
  namespaceStats,
} from '../../lib/pinecone.js';
import { createTtlCache } from '../../utils/ttlCache.js';
import { chunkFiles } from './rag.chunker.js';
import { buildAnswerPrompt } from './rag.prompts.js';

const MAX_FILES = 12;
const MAX_CHUNKS = 400;
const EMBED_CONCURRENCY = 5; 
const RETRIEVE_TOP_K = 8;

const indexed = createTtlCache({ ttlMs: 6 * 60 * 60 * 1000, max: 1000 });

export const namespaceFor = (owner, repo, ref) =>
  `${owner}/${repo}@${crypto.createHash('sha1').update(ref).digest('hex').slice(0, 12)}`;

const collectFiles = async (owner, repo, ref) => {
  const repoData = await loadRepo(`${owner}/${repo}`, ref);
  const paths = [];
  if (repoData.readme?.path) paths.push(repoData.readme.path);
  for (const doc of repoData.docs) {
    if (paths.length >= MAX_FILES) break;
    if (!paths.includes(doc.path)) paths.push(doc.path);
  }

  const files = [];
  if (repoData.readme) {
    files.push({ path: repoData.readme.path, content: repoData.readme.content });
  }
  const rest = paths.filter((p) => p !== repoData.readme?.path);
  const fetched = await Promise.all(
    rest.map((p) =>
      getFileContent(owner, repo, repoData.ref, p).catch(() => null),
    ),
  );
  for (const f of fetched) if (f) files.push({ path: f.path, content: f.content });

  return { ref: repoData.ref, repo: repoData.repo, files };
};

export const ingestRepo = async (url, refOverride, { force = false } = {}) => {
  const { owner, repo } = parseGithubUrl(url);
  const { ref, repo: meta, files } = await collectFiles(owner, repo, refOverride);
  const namespace = namespaceFor(owner, repo, ref);

  if (!force) {
    if (indexed.get(namespace)) return { namespace, ref, repo: meta, chunks: 0, skipped: true };
    const stats = await namespaceStats(namespace).catch(() => null);
    if (stats?.vectorCount > 0) {
      indexed.set(namespace, true);
      return { namespace, ref, repo: meta, chunks: stats.vectorCount, skipped: true };
    }
  } else {
    await deleteNamespace(namespace);
  }

  const chunks = chunkFiles(files).slice(0, MAX_CHUNKS);
  if (chunks.length === 0) throw ApiError.badRequest('No documentation found to index for this repo');

  const vectors = await embedTexts(chunks.map((c) => c.text), {
    taskType: 'RETRIEVAL_DOCUMENT',
    concurrency: EMBED_CONCURRENCY,
  });

  const records = vectors.map((values, i) => ({
    id: `${namespace}#${i}`,
    values,
    metadata: {
      path: chunks[i].path,
      heading: chunks[i].heading ?? '',
      text: chunks[i].text,
    },
  }));

  for (let i = 0; i < records.length; i += 100) {
    await upsertVectors(namespace, records.slice(i, i + 100));
  }

  indexed.set(namespace, true);
  return { namespace, ref, repo: meta, chunks: records.length, skipped: false };
};

const buildCitations = (contexts) => {
  const numberByPath = new Map();
  const sources = [];
  const labeled = contexts.map((c) => {
    if (!numberByPath.has(c.path)) {
      numberByPath.set(c.path, sources.length + 1);
      sources.push({ number: sources.length + 1, path: c.path, heading: c.heading, score: c.score });
    }
    return { ...c, sourceNum: numberByPath.get(c.path) };
  });
  return { sources, labeled };
};

const retrieve = async (url, question, refOverride) => {
  const ingestResult = await ingestRepo(url, refOverride);
  const { namespace, ref } = ingestResult;

  const [queryVector] = await embedTexts([question], { taskType: 'RETRIEVAL_QUERY' });
  const matches = await queryVectors(namespace, queryVector, { topK: RETRIEVE_TOP_K });

  const contexts = matches
    .filter((m) => m.metadata?.text)
    .map((m) => ({
      path: m.metadata.path,
      heading: m.metadata.heading,
      text: m.metadata.text,
      score: m.score,
    }));

  return { ref, contexts };
};

export const askRepo = async (url, question, refOverride) => {
  const { ref, contexts } = await retrieve(url, question, refOverride);

  if (contexts.length === 0) {
    return {
      answer: "I could not find anything relevant in this repository's documentation.",
      sources: [],
      ref,
    };
  }

  const { sources, labeled } = buildCitations(contexts);
  const answer = await generateContent(buildAnswerPrompt(question, labeled));
  return { answer, sources, ref };
};

export async function* askRepoStream(url, question, refOverride, { signal } = {}) {
  const { ref, contexts } = await retrieve(url, question, refOverride);
  const { sources, labeled } = buildCitations(contexts);

  yield { type: 'sources', sources, ref };

  if (contexts.length === 0) {
    yield {
      type: 'delta',
      text: "I could not find anything relevant in this repository's documentation.",
    };
    yield { type: 'done' };
    return;
  }

  for await (const text of generateContentStream({ ...buildAnswerPrompt(question, labeled), signal })) {
    yield { type: 'delta', text };
  }
  yield { type: 'done' };
}
