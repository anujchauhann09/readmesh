import { ApiError } from '../../common/ApiError.js';
import { config } from '../../config/env.js';
import { fetchWithTimeout, isAbortError } from '../../utils/http.js';
import { isValidRepoName, isSafeRepoPath, isSafeRef } from './github.url.js';

const API_BASE = 'https://api.github.com';
const RAW_BASE = 'https://raw.githubusercontent.com';
const TIMEOUT_MS = 15_000;

const authHeader = () =>
  config.github.pat ? { Authorization: `Bearer ${config.github.pat}` } : {};

const apiHeaders = () => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'readmesh',
  ...authHeader(),
});

/**
 * Last line of defense before an untrusted value reaches an upstream URL. The DTO
 * layer already rejects these, but the request token is the server's PAT — which
 * can usually read more than the caller — so the check is repeated here rather
 * than assumed. Callers reaching this with bad input have a bug, not a bad user.
 */
const assertSafeSegments = ({ owner, repo, ref, filePath }) => {
  const ok =
    isValidRepoName(owner) &&
    isValidRepoName(repo) &&
    (ref === undefined || isSafeRef(ref)) &&
    (filePath === undefined || isSafeRepoPath(filePath));
  if (!ok) throw ApiError.badRequest('Invalid repository coordinates');
};

/** Percent-encodes each path segment while keeping the separators intact. */
const encodePath = (filePath) => filePath.split('/').map(encodeURIComponent).join('/');

const assertOk = (res, context) => {
  if (res.ok) return;
  if (res.status === 404) throw ApiError.notFound(`${context} not found`);
  if (res.status === 401) throw ApiError.badGateway('GitHub rejected the configured token');
  if (res.status === 403 || res.status === 429) {
    if (res.headers.get('x-ratelimit-remaining') === '0') {
      throw ApiError.tooManyRequests(
        'GitHub API rate limit exceeded — configure GITHUB_PAT to raise it',
      );
    }
    throw ApiError.forbidden('GitHub denied the request');
  }
  throw ApiError.badGateway(`GitHub request failed (${res.status})`);
};

const request = async (url, { headers }) => {
  try {
    return await fetchWithTimeout(url, { headers, timeoutMs: TIMEOUT_MS });
  } catch (err) {
    throw ApiError.badGateway(
      isAbortError(err) ? 'GitHub took too long to respond' : 'Could not reach GitHub',
    );
  }
};

/**
 * Calls the GitHub REST API. `path` is built by this module from already-validated
 * coordinates — it is never caller-supplied text.
 */
export const apiGet = async (path, context) => {
  const res = await request(`${API_BASE}${path}`, { headers: apiHeaders() });
  assertOk(res, context);
  return res.json();
};

/** Follows `Link: rel="next"` so results are not silently capped at one page. */
export const apiGetAllPages = async (path, context, { maxPages = 10 } = {}) => {
  const items = [];
  let url = `${API_BASE}${path}`;

  for (let page = 0; page < maxPages && url; page += 1) {
    const res = await request(url, { headers: apiHeaders() });
    assertOk(res, context);
    const body = await res.json();
    if (!Array.isArray(body)) return body;
    items.push(...body);

    const next = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get('link') ?? '');
    url = next?.[1] ?? null;
  }

  return items;
};

export const getRawFile = async (owner, repo, ref, filePath, context) => {
  assertSafeSegments({ owner, repo, ref, filePath });
  const url = `${RAW_BASE}/${owner}/${repo}/${encodeURIComponent(ref)}/${encodePath(filePath)}`;
  const res = await request(url, { headers: { 'User-Agent': 'readmesh', ...authHeader() } });
  assertOk(res, context);
  return res.text();
};
