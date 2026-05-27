import { ApiError } from '../../common/ApiError.js';

const NAME = /^[A-Za-z0-9._-]+$/;
const stripGit = (s) => s.replace(/\.git$/i, '');


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
    const parts = raw.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
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
    const seg = url.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    owner = seg[0];
    repo = seg[1] ? stripGit(seg[1]) : undefined;
    if (seg[2] === 'tree' || seg[2] === 'blob') {
      rest = seg.slice(3);
      ref = rest[0] ?? null;
      path = rest.slice(1).join('/') || null;
    }
  }

  if (!owner || !repo || !NAME.test(owner) || !NAME.test(repo)) {
    throw ApiError.badRequest('Could not parse "owner/repo" from the input');
  }

  return { owner, repo, ref, path: path ? decodeURIComponent(path) : null, rest };
};
