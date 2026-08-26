import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMarkdown } from '../src/modules/github/github.normalizer.js';

const ctx = { owner: 'acme', repo: 'app', ref: 'main', filePath: 'docs/guide.md' };
const RAW = 'https://raw.githubusercontent.com/acme/app/main';

test('normalizes newlines and guarantees a trailing newline', () => {
  const out = normalizeMarkdown('a\r\nb\r\n\r\n', ctx);
  assert.equal(out, 'a\nb\n');
});

test('rewrites a relative image to a raw URL, resolved against the file directory', () => {
  const out = normalizeMarkdown('![x](img/logo.png)', ctx);
  assert.ok(out.includes(`${RAW}/docs/img/logo.png`), out);
});

test('resolves parent-directory references in image paths', () => {
  const out = normalizeMarkdown('![x](../assets/logo.png)', ctx);
  assert.ok(out.includes(`${RAW}/assets/logo.png`), out);
});

test('treats a root-relative path as repository-root relative', () => {
  const out = normalizeMarkdown('![x](/banner.png)', ctx);
  assert.ok(out.includes(`${RAW}/banner.png`), out);
});

test('leaves absolute and data URLs alone', () => {
  for (const url of ['https://cdn.example.com/a.png', 'data:image/png;base64,AAA']) {
    assert.ok(normalizeMarkdown(`![x](${url})`, ctx).includes(url));
  }
});

test('rewrites html img src too', () => {
  const out = normalizeMarkdown('<img src="img/logo.png" width="20">', ctx);
  assert.ok(out.includes(`src="${RAW}/docs/img/logo.png"`), out);
});

test('strips a BOM and trailing whitespace', () => {
  const out = normalizeMarkdown('\uFEFF# Title   \ntext\t\n', ctx);
  assert.equal(out, '# Title\ntext\n');
});
