import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkMarkdown, chunkFiles } from '../src/modules/rag/rag.chunker.js';

test('returns nothing for empty input', () => {
  assert.deepEqual(chunkMarkdown(''), []);
  assert.deepEqual(chunkMarkdown('   \n  '), []);
});

test('tracks the heading trail for each chunk', () => {
  const doc = ['# Project', 'Intro text.', '## Install', 'Run npm install.'].join('\n');
  const chunks = chunkMarkdown(doc);

  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].heading, 'Project');
  assert.equal(chunks[1].heading, 'Project > Install');
});

test('does not treat a # inside a fenced block as a heading', () => {
  const doc = ['# Real', '```sh', '# this is a shell comment', 'ls', '```'].join('\n');
  const chunks = chunkMarkdown(doc);

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].heading, 'Real');
  assert.ok(chunks[0].text.includes('# this is a shell comment'));
});

test('splits oversized sections and indexes them sequentially', () => {
  const body = Array.from({ length: 30 }, (_, i) => `Paragraph number ${i} with filler text.`).join(
    '\n\n',
  );
  const chunks = chunkMarkdown(`# Big\n\n${body}`, { target: 200, overlap: 20 });

  assert.ok(chunks.length > 1);
  chunks.forEach((chunk, i) => assert.equal(chunk.index, i));
  chunks.forEach((chunk) => assert.ok(chunk.text.trim().length > 0));
});

test('a single block longer than the target is hard-split rather than dropped', () => {
  const chunks = chunkMarkdown(`# H\n\n${'x'.repeat(1000)}`, { target: 100, overlap: 0 });
  assert.ok(chunks.length >= 10);
});

test('chunkFiles carries the source path onto every chunk', () => {
  const chunks = chunkFiles([
    { path: 'README.md', content: '# A\ntext a' },
    { path: 'docs/b.md', content: '# B\ntext b' },
  ]);

  assert.deepEqual([...new Set(chunks.map((c) => c.path))], ['README.md', 'docs/b.md']);
  chunks.forEach((chunk) => assert.ok('heading' in chunk && 'text' in chunk));
});
