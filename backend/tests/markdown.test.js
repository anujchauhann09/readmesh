import test from 'node:test';
import assert from 'node:assert/strict';
import { truncateMarkdown } from '../src/utils/markdown.js';

test('returns short content untouched', () => {
  const { text, truncated } = truncateMarkdown('# Hello\n\nWorld', 500);
  assert.equal(text, '# Hello\n\nWorld');
  assert.equal(truncated, false);
});

const fenceCount = (text) => (text.match(/^```/gm) ?? []).length;

test('never leaves a fenced block open', () => {
  const doc = ['# Setup', '', '```bash', 'npm install', 'npm run dev', '```', ''].join('\n');
  // Cut squarely inside the fenced block.
  const { text, truncated } = truncateMarkdown(doc, doc.indexOf('npm run dev'));

  assert.equal(truncated, true);
  assert.equal(fenceCount(text) % 2, 0, `unbalanced fences in:\n${text}`);
});

test('keeps content by closing the fence when backing off would cost too much', () => {
  const body = Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n');
  const doc = `\`\`\`js\n${body}\n\`\`\``;
  const { text } = truncateMarkdown(doc, 200);

  assert.equal(fenceCount(text) % 2, 0);
  assert.ok(text.includes('line 0'), 'should retain the start of the block');
});

test('prefers cutting back to the last closed block', () => {
  const doc = [
    '# One',
    '',
    '```sh',
    'echo one',
    '```',
    '',
    'Some prose that follows the first block and runs on for a while.',
    '',
    '```sh',
    'echo two',
  ].join('\n');
  const { text } = truncateMarkdown(doc, doc.length - 5);

  assert.equal(fenceCount(text) % 2, 0);
  assert.ok(text.includes('echo one'));
});

test('drops the partial trailing line', () => {
  const doc = 'alpha\nbravo\ncharlie';
  const { text } = truncateMarkdown(doc, 9); // lands mid-"bravo"
  assert.equal(text, 'alpha');
});
