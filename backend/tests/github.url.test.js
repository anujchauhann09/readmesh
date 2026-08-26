import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGithubUrl,
  isValidRepoName,
  isSafeRepoPath,
  isSafeRef,
} from '../src/modules/github/github.url.js';

test('parses a plain owner/repo pair', () => {
  assert.deepEqual(parseGithubUrl('facebook/react'), {
    owner: 'facebook',
    repo: 'react',
    ref: null,
    path: null,
    rest: [],
  });
});

test('parses an https URL and strips the .git suffix', () => {
  const parsed = parseGithubUrl('https://github.com/vercel/next.js.git');
  assert.equal(parsed.owner, 'vercel');
  assert.equal(parsed.repo, 'next.js');
});

test('extracts ref and path from a blob URL', () => {
  const parsed = parseGithubUrl('https://github.com/vercel/next.js/blob/canary/docs/index.md');
  assert.equal(parsed.ref, 'canary');
  assert.equal(parsed.path, 'docs/index.md');
  assert.deepEqual(parsed.rest, ['canary', 'docs', 'index.md']);
});

test('rejects hosts other than github.com', () => {
  assert.throws(() => parseGithubUrl('https://gitlab.com/a/b'), /Only github\.com/);
  assert.throws(() => parseGithubUrl('https://github.com.evil.tld/a/b'), /Only github\.com/);
});

test('accepts a github.com subdomain', () => {
  assert.equal(parseGithubUrl('https://www.github.com/a/b').owner, 'a');
});

test('rejects traversal sequences in the owner segment', () => {
  assert.throws(() => parseGithubUrl('../../etc/passwd'), /owner\/repo/);
  assert.throws(() => parseGithubUrl('https://github.com/..%2f..%2fx/y'), /owner\/repo/);
});

test('rejects an encoded-slash traversal inside a blob URL', () => {
  // WHATWG URL normalization collapses `../` and `%2e%2e/` dot segments before we
  // ever see them. Encoded *slashes* do not form segments, so they survive parsing
  // and become a traversal only once each segment is decoded — this is the form
  // the path check has to catch.
  assert.throws(
    () => parseGithubUrl('https://github.com/a/b/blob/main/..%2f..%2fetc/passwd.md'),
    /Invalid file path/,
  );
});

test('the URL parser already collapses plain dot segments', () => {
  // Documents why the check above targets the encoded-slash form specifically.
  assert.equal(new URL('https://github.com/a/b/blob/main/../../x/R.md').pathname, '/a/b/x/R.md');

  const parsed = parseGithubUrl('https://github.com/a/b/blob/main/../../../x/README.md');
  assert.equal(parsed.owner, 'a');
  assert.equal(parsed.repo, 'x');
  assert.equal(parsed.ref, null, 'the collapsed path no longer contains a blob marker');
});

test('isValidRepoName follows GitHub naming rules', () => {
  for (const ok of ['react', 'next.js', 'my-repo', 'my_repo', 'a1']) {
    assert.equal(isValidRepoName(ok), true, ok);
  }
  for (const bad of ['.', '..', '../x', 'a/b', 'a b', '', 'x'.repeat(101), null]) {
    assert.equal(isValidRepoName(bad), false, String(bad));
  }
});

test('isSafeRepoPath refuses anything that can escape the repository', () => {
  assert.equal(isSafeRepoPath('docs/getting-started.md'), true);
  assert.equal(isSafeRepoPath('README.md'), true);

  for (const bad of [
    '../secrets.md',
    'docs/../../other/README.md',
    '/etc/passwd',
    'docs//x.md',
    'docs/./x.md',
    'docs\\x.md',
    '',
  ]) {
    assert.equal(isSafeRepoPath(bad), false, bad);
  }
});

test('isSafeRef refuses git-illegal and traversal refs', () => {
  assert.equal(isSafeRef('main'), true);
  assert.equal(isSafeRef('builds/facebook-www'), true);
  assert.equal(isSafeRef('v1.2.3'), true);

  for (const bad of ['../main', 'a..b', '/main', 'main/', 'ma in', 'ma:in', 'ma~in', 'ma^in']) {
    assert.equal(isSafeRef(bad), false, bad);
  }
});

test('the reported traversal payload no longer builds a foreign raw URL', () => {
  // Regression guard for the exact shape that reached raw.githubusercontent.com
  // with the server PAT attached.
  const owner = '../../facebook';
  const path = '../../../private-org/secret-repo/main/README.md';

  assert.equal(isValidRepoName(owner), false);
  assert.equal(isSafeRepoPath(path), false);

  // And confirm why it mattered: URL normalization silently rewrites the target.
  const normalized = new URL(`https://raw.githubusercontent.com/${owner}/react/main/${path}`)
    .pathname;
  assert.equal(normalized, '/private-org/secret-repo/main/README.md');
});
