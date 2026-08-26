const RAW_BASE = 'https://raw.githubusercontent.com';

const stripBom = (s) => s.replace(/^\uFEFF/, '');
const normalizeNewlines = (s) => s.replace(/\r\n?/g, '\n');

const dirname = (p) => {
  const i = p.lastIndexOf('/');
  return i === -1 ? '' : p.slice(0, i);
};

const resolveRelative = (baseDir, rel) => {
  const stack = baseDir ? baseDir.split('/') : [];
  for (const part of rel.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
};

const isExternal = (url) => /^(https?:)?\/\//i.test(url) || /^(data:|mailto:|tel:|#)/i.test(url);

export const normalizeMarkdown = (content, { owner, repo, ref, filePath = '' }) => {
  let text = normalizeNewlines(stripBom(content)).replace(/[ \t]+$/gm, '');
  text = `${text.replace(/\s+$/, '')}\n`;

  const baseDir = dirname(filePath);
  const toAbsolute = (url) => {
    if (isExternal(url)) return url;
    const clean = url.startsWith('/') ? url.slice(1) : resolveRelative(baseDir, url);
    return `${RAW_BASE}/${owner}/${repo}/${ref}/${clean}`;
  };

  text = text.replace(
    /(!\[[^\]]*\]\()(\s*<?)([^)\s>]+)(>?[^)]*\))/g,
    (_m, pre, lb, url, post) => `${pre}${lb}${toAbsolute(url)}${post}`,
  );
  text = text.replace(
    /(<img\b[^>]*?\bsrc=["'])([^"']+)(["'])/gi,
    (_m, pre, url, post) => `${pre}${toAbsolute(url)}${post}`,
  );

  return text;
};
