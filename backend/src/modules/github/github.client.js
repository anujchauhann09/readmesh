import { ApiError } from '../../common/ApiError.js';
import { config } from '../../config/env.js';

const API_BASE = 'https://api.github.com';
const RAW_BASE = 'https://raw.githubusercontent.com';


const authHeader = () => (config.github.pat ? { Authorization: `Bearer ${config.github.pat}` } : {});

const apiHeaders = () => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'readmesh',
  ...authHeader(),
});

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

export const apiGet = async (path, context) => {
  const res = await fetch(`${API_BASE}${path}`, { headers: apiHeaders() });
  assertOk(res, context);
  return res.json();
};

export const getRawFile = async (owner, repo, ref, filePath, context) => {
  const url = `${RAW_BASE}/${owner}/${repo}/${encodeURIComponent(ref)}/${encodeURI(filePath)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'readmesh', ...authHeader() } });
  assertOk(res, context);
  return res.text();
};
