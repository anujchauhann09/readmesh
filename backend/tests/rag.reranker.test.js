import test from 'node:test';
import assert from 'node:assert/strict';
import { rerank, tokenize } from '../src/modules/rag/rag.reranker.js';

test('tokenize drops stop words and single characters', () => {
  assert.deepEqual(tokenize('How do I run the dev server?'), ['run', 'dev', 'server']);
});

test('tokenize keeps identifiers intact', () => {
  assert.deepEqual(tokenize('set DATABASE_URL in .env.local'), [
    'set',
    'database_url',
    '.env.local',
  ]);
});

test('passes through a single candidate untouched', () => {
  const one = [{ path: 'a.md', heading: '', text: 'x', score: 0.5 }];
  assert.deepEqual(rerank('anything', one), one);
});

test('lexical overlap promotes the chunk that names the question terms', () => {
  const candidates = [
    // Higher vector score, but never mentions the env vars themselves.
    {
      path: 'intro.md',
      heading: 'Getting started',
      text: 'Set up your machine first.',
      score: 0.82,
    },
    {
      path: 'config.md',
      heading: 'Environment variables',
      text: 'DATABASE_URL and GEMINI_API_KEY are required environment variables.',
      score: 0.74,
    },
  ];

  const [top] = rerank('which environment variables are required', candidates, { topN: 2 });
  assert.equal(top.path, 'config.md');
});

test('diversifies away from near-duplicate chunks', () => {
  const duplicate = 'Run npm install to install dependencies before starting.';
  const candidates = [
    { path: 'README.md', heading: 'Install', text: duplicate, score: 0.9 },
    { path: 'docs/install.md', heading: 'Install', text: duplicate, score: 0.89 },
    {
      path: 'docs/deploy.md',
      heading: 'Deploy',
      text: 'Deploy by pushing to main; Render builds and restarts the service.',
      score: 0.6,
    },
  ];

  const paths = rerank('how do I install and deploy', candidates, { topN: 2 }).map((c) => c.path);
  assert.ok(paths.includes('docs/deploy.md'), `expected the distinct chunk, got ${paths}`);
});

test('never returns more than topN, and never invents candidates', () => {
  const candidates = Array.from({ length: 12 }, (_, i) => ({
    path: `f${i}.md`,
    heading: `H${i}`,
    text: `Distinct content number ${i} about topic ${i}.`,
    score: 1 - i / 100,
  }));

  const picked = rerank('topic 3', candidates, { topN: 5 });
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked.map((c) => c.path)).size, 5);
});

test('tolerates a missing vector score', () => {
  const candidates = [
    { path: 'a.md', heading: '', text: 'install dependencies', score: undefined },
    { path: 'b.md', heading: '', text: 'unrelated prose', score: undefined },
  ];
  assert.equal(rerank('install dependencies', candidates, { topN: 1 })[0].path, 'a.md');
});
