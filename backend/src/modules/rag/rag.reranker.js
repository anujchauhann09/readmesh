/**
 * Reranking stage between vector retrieval and answer generation.
 *
 * Pure cosine top-K has two well-known failure modes for documentation:
 *
 *  1. Semantic drift — a chunk about "environment setup" scores well on "what env
 *     variables are required" even when the chunk that actually lists them, being
 *     mostly a table of names, scores lower. A lexical signal recovers those:
 *     documentation answers usually contain the asker's literal nouns.
 *  2. Redundancy — the top matches are frequently near-duplicates (a README
 *     section and its copy under docs/), so a chunk of the budget is spent
 *     restating one fact while the fact that completes the answer never makes it
 *     into context.
 *
 * So candidates are over-fetched, rescored as a blend of the vector score and
 * lexical overlap with the question, then selected with MMR, which trades a
 * little relevance for coverage. Everything here is local arithmetic — no second
 * model call, which keeps the free-tier budget intact.
 */

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'use',
  'using',
  'what',
  'when',
  'where',
  'which',
  'why',
  'with',
  'you',
  'your',
]);

// How much of the final score comes from lexical overlap rather than the vector.
const LEXICAL_WEIGHT = 0.35;
// MMR trade-off: 1.0 is pure relevance, 0.0 is pure diversity.
const MMR_LAMBDA = 0.7;

export const tokenize = (text) =>
  String(text)
    .toLowerCase()
    .split(/[^a-z0-9_.-]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const jaccard = (a, b) => {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
};

/** Share of the question's distinct terms that appear in the candidate. */
const coverage = (questionTokens, candidateTokens) => {
  if (questionTokens.size === 0) return 0;
  let hits = 0;
  for (const token of questionTokens) if (candidateTokens.has(token)) hits += 1;
  return hits / questionTokens.size;
};

/**
 * Rescores candidates against the question and selects a diverse top-N.
 *
 * @param {string} question
 * @param {Array<{path:string, heading:string, text:string, score:number}>} candidates
 * @param {{ topN?: number }} options
 */
export const rerank = (question, candidates, { topN = 8 } = {}) => {
  if (candidates.length <= 1) return candidates;

  const questionTokens = new Set(tokenize(question));

  const scored = candidates.map((candidate) => {
    // The heading is weighted the same as the body: in docs it is often the only
    // place the question's noun appears verbatim ("## Environment variables").
    const tokens = new Set(tokenize(`${candidate.heading ?? ''} ${candidate.text}`));
    const vectorScore = Number.isFinite(candidate.score) ? candidate.score : 0;
    const lexical = coverage(questionTokens, tokens);
    return {
      ...candidate,
      tokens,
      relevance: (1 - LEXICAL_WEIGHT) * vectorScore + LEXICAL_WEIGHT * lexical,
    };
  });

  scored.sort((a, b) => b.relevance - a.relevance);

  // Maximal Marginal Relevance: repeatedly take the candidate with the best
  // relevance-minus-redundancy against what has already been chosen.
  const selected = [scored.shift()];
  while (selected.length < topN && scored.length > 0) {
    let bestIndex = 0;
    let bestValue = -Infinity;

    scored.forEach((candidate, index) => {
      const redundancy = Math.max(
        ...selected.map((chosen) => jaccard(candidate.tokens, chosen.tokens)),
      );
      const value = MMR_LAMBDA * candidate.relevance - (1 - MMR_LAMBDA) * redundancy;
      if (value > bestValue) {
        bestValue = value;
        bestIndex = index;
      }
    });

    selected.push(scored.splice(bestIndex, 1)[0]);
  }

  // `tokens` is scratch work for the ranking; only the chunk plus its blended
  // score is handed back.
  return selected.map(({ path, heading, text, score, relevance }) => ({
    path,
    heading,
    text,
    score,
    relevance,
  }));
};
