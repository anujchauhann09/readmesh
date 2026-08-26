import { ApiError } from '../../common/ApiError.js';

/** GitHub's own character set for account and repository names. */
export const REPO_NAME_RE = /^[A-Za-z0-9._-]+$/;

/** Characters git forbids in a ref name, plus whitespace. */
const REF_FORBIDDEN = new Set(['~', '^', ':', '?', '*', '[', '\\']);

const stripGit = (s) => s.replace(/\.git$/i, '');

const hasControlChars = (value) => {
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
};

/**
 * True for an owner/repo segment that is safe to interpolate into an upstream URL.
 *
 * This is the load-bearing check against path traversal: `owner` and `repo` end up
 * in `raw.githubusercontent.com/{owner}/{repo}/...`, and percent-encoding helpers
 * do not escape `.` or `/`, so a value like `../../other-org` would be normalized
 * by the URL parser into a request for a completely different repository — one the
 * server's PAT might well be able to read.
 */
export const isValidRepoName = (value) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > 100) return false;
  // `.` and `..` are built entirely from allowed characters, so the character
  // class alone lets them through — and either one is a traversal step once it
  // lands in a URL path. GitHub does not permit them as names anyway.
  if (value === '.' || value === '..') return false;
  return REPO_NAME_RE.test(value);
};

/**
 * True for a repository-relative file path with no way out of the repository:
 * no absolute paths, no `.` or `..` segments, no backslashes, no empty segments.
 */
export const isSafeRepoPath = (value) => {
  if (typeof value !== 'string' || !value || value.length > 1024) return false;
  if (value.startsWith('/') || value.includes('\\') || hasControlChars(value)) return false;
  return value.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
};

/** True for a branch/tag name that cannot escape its position in an upstream URL. */
export const isSafeRef = (value) => {
  if (typeof value !== 'string' || !value || value.length > 255) return false;
  if (value.startsWith('/') || value.endsWith('/') || value.includes('..')) return false;
  if (/\s/.test(value) || hasControlChars(value)) return false;
  return ![...value].some((char) => REF_FORBIDDEN.has(char));
};

export const parseGithubUrl = (input) => {
  if (typeof input !== 'string' || !input.trim()) {
    throw ApiError.badRequest('A GitHub repository URL is required');
  }
  const raw = input.trim();

  let owner;
  let repo;
  let ref = null;
  let path = null;
  let rest = [];

  const looksLikeUrl = /^https?:\/\//i.test(raw) || raw.includes('github.com');

  if (!looksLikeUrl) {
    const parts = raw
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean);
    owner = parts[0];
    repo = parts[1] ? stripGit(parts[1]) : undefined;
  } else {
    let url;
    try {
      url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    } catch {
      throw ApiError.badRequest('Invalid URL');
    }
    if (!/(^|\.)github\.com$/i.test(url.hostname)) {
      throw ApiError.badRequest('Only github.com repositories are supported');
    }
    const seg = url.pathname
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean);
    owner = seg[0];
    repo = seg[1] ? stripGit(seg[1]) : undefined;
    if (seg[2] === 'tree' || seg[2] === 'blob') {
      rest = seg.slice(3).map((s) => {
        try {
          return decodeURIComponent(s);
        } catch {
          return s;
        }
      });
      ref = rest[0] ?? null;
      path = rest.slice(1).join('/') || null;
    }
  }

  if (!isValidRepoName(owner) || !isValidRepoName(repo)) {
    throw ApiError.badRequest('Could not parse "owner/repo" from the input');
  }
  if (ref !== null && !isSafeRef(ref)) throw ApiError.badRequest('Invalid branch or tag name');
  if (path !== null && !isSafeRepoPath(path)) throw ApiError.badRequest('Invalid file path');

  return { owner, repo, ref, path, rest };
};
