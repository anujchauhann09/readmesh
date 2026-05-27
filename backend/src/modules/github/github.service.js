import { ApiError } from '../../common/ApiError.js';
import { parseGithubUrl } from './github.url.js';
import { apiGet, getRawFile } from './github.client.js';
import { normalizeMarkdown } from './github.normalizer.js';

const MD_RE = /\.(md|mdx|markdown)$/i;
const README_RE = /^readme\.(md|mdx|markdown)$/i;
const MAX_FILES = 300;

const toRepoMeta = (data) => ({
  owner: data.owner?.login,
  name: data.name,
  fullName: data.full_name,
  description: data.description ?? null,
  defaultBranch: data.default_branch,
  stars: data.stargazers_count,
  language: data.language ?? null,
  url: data.html_url,
  isPrivate: data.private,
  pushedAt: data.pushed_at,
});

const rank = (file) => {
  if (README_RE.test(file.path)) return 0;
  if (file.dir === 'docs' || file.dir.startsWith('docs/')) return 1;
  return 2;
};

/**
 * Resolves URL segments after `tree`/`blob` into a real branch name, handling
 * refs that contain slashes (e.g. `builds/facebook-www`). Picks the longest
 * prefix of the segments that matches a known branch; remaining segments are
 * the file path. Returns null when no prefix is a branch (caller falls back).
 */
const matchBranchRef = (segments, branchNames) => {
  const set = new Set(branchNames);
  for (let i = segments.length; i > 0; i -= 1) {
    const candidate = segments.slice(0, i).join('/');
    if (set.has(candidate)) return candidate;
  }
  return null;
};

export const resolve = (url) => parseGithubUrl(url);

export const getRepoMeta = async (owner, repo) => {
  const data = await apiGet(`/repos/${owner}/${repo}`, 'Repository');
  return toRepoMeta(data);
};

export const listBranches = async (owner, repo) => {
  const data = await apiGet(`/repos/${owner}/${repo}/branches?per_page=100`, 'Repository');
  return data.map((b) => b.name);
};

/** Lists all markdown files (README, docs/**, anywhere) via the git tree. */
export const listMarkdownFiles = async (owner, repo, ref) => {
  const data = await apiGet(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
    'Branch',
  );
  const all = (data.tree ?? []).filter((n) => n.type === 'blob' && MD_RE.test(n.path));
  const files = all
    .map((n) => ({
      path: n.path,
      name: n.path.split('/').pop(),
      dir: n.path.includes('/') ? n.path.slice(0, n.path.lastIndexOf('/')) : '',
      size: n.size ?? null,
    }))
    .sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path))
    .slice(0, MAX_FILES);

  return { files, truncated: Boolean(data.truncated) || all.length > MAX_FILES };
};

export const getReadme = async (owner, repo, ref) => {
  let data;
  try {
    data = await apiGet(`/repos/${owner}/${repo}/readme?ref=${encodeURIComponent(ref)}`, 'README');
  } catch (error) {
    if (error.statusCode === 404) return null; // repo has no README
    throw error;
  }
  const decoded = Buffer.from(
    data.content ?? '',
    data.encoding === 'base64' ? 'base64' : 'utf8',
  ).toString('utf8');
  return {
    path: data.path,
    name: data.name,
    content: normalizeMarkdown(decoded, { owner, repo, ref, filePath: data.path }),
  };
};

export const getFileContent = async (owner, repo, ref, filePath) => {
  if (!MD_RE.test(filePath)) throw ApiError.badRequest('Only markdown files can be fetched');
  const raw = await getRawFile(owner, repo, ref, filePath, 'File');
  return {
    path: filePath,
    name: filePath.split('/').pop(),
    content: normalizeMarkdown(raw, { owner, repo, ref, filePath }),
  };
};

/**
 * Loads everything needed to open a repo: metadata, branches, the resolved ref,
 * the README content, and the markdown file index (contents fetched on demand).
 */
export const loadRepo = async (url, refOverride) => {
  const { owner, repo, ref: parsedRef, rest } = parseGithubUrl(url);

  // Branches are needed both for the response and to disambiguate a slashed ref
  // from a tree/blob URL, so fetch them (with metadata) before the ref-scoped calls.
  const [meta, branches] = await Promise.all([
    getRepoMeta(owner, repo),
    listBranches(owner, repo),
  ]);

  const ref =
    refOverride ||
    (rest.length > 1 ? matchBranchRef(rest, branches) : null) ||
    parsedRef ||
    meta.defaultBranch;

  const [docs, readme] = await Promise.all([
    listMarkdownFiles(owner, repo, ref),
    getReadme(owner, repo, ref),
  ]);

  return { repo: meta, ref, branches, readme, docs: docs.files, docsTruncated: docs.truncated };
};
