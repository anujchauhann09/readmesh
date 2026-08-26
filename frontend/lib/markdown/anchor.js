import { clearMarks, textSegments } from './decorations.js';

const CONTEXT = 32;

const offsetWithin = (root, container, offset) => {
  const range = document.createRange();
  range.setStart(root, 0);
  range.setEnd(container, offset);
  return range.toString().length;
};

export const serializeRange = (root, range) => {
  const exact = range.toString();
  if (!exact.trim()) return null;
  const full = root.textContent || '';
  const start = offsetWithin(root, range.startContainer, range.startOffset);
  const end = start + exact.length;
  return {
    exact,
    prefix: full.slice(Math.max(0, start - CONTEXT), start),
    suffix: full.slice(end, end + CONTEXT),
    textPosition: start,
  };
};

export const sectionForRange = (root, range) => {
  const headings = [...root.querySelectorAll('h1[id], h2[id], h3[id], h4[id]')];
  const startPos = offsetWithin(root, range.startContainer, range.startOffset);
  let current = null;
  for (const h of headings) {
    if (offsetWithin(root, h, 0) <= startPos) current = h;
    else break;
  }
  return current ? { sectionId: current.id, sectionTitle: current.textContent || '' } : {};
};

const locate = (full, anchor) => {
  const { exact, prefix = '', suffix = '', textPosition } = anchor;
  if (!exact) return null;

  const withCtx = prefix + exact + suffix;
  const ctxIdx = full.indexOf(withCtx);
  if (ctxIdx !== -1) {
    const start = ctxIdx + prefix.length;
    return { start, end: start + exact.length };
  }

  let best = -1;
  let bestDist = Infinity;
  let from = full.indexOf(exact);
  while (from !== -1) {
    const dist = Math.abs(from - (textPosition ?? 0));
    if (dist < bestDist) {
      bestDist = dist;
      best = from;
    }
    from = full.indexOf(exact, from + 1);
  }
  return best === -1 ? null : { start: best, end: best + exact.length };
};

const ATTR = 'data-annot-id';

/** Removes annotation marks only — search marks nested inside them survive. */
export const clearAnnotations = (root) => {
  clearMarks(root, ATTR);
};

const typeClass = (type) => {
  if (type === 'NOTE') return ' rm-annot-note';
  if (type === 'COMMENT') return ' rm-annot-comment';
  return '';
};

const wrapSpan = (root, start, end, { id, type, color, body }) => {
  const segments = textSegments(root);
  const marks = [];
  for (const seg of segments) {
    if (seg.end <= start || seg.start >= end) continue;
    const s = Math.max(start, seg.start) - seg.start;
    const e = Math.min(end, seg.end) - seg.start;
    const text = seg.node.nodeValue;
    const frag = document.createDocumentFragment();
    if (s > 0) frag.appendChild(document.createTextNode(text.slice(0, s)));
    const mark = document.createElement('mark');
    mark.setAttribute(ATTR, id);
    mark.className = `rm-annot rm-annot-${color || 'yellow'}${typeClass(type)}`;
    if (body) mark.title = body;
    mark.textContent = text.slice(s, e);
    frag.appendChild(mark);
    marks.push(mark);
    if (e < text.length) frag.appendChild(document.createTextNode(text.slice(e)));
    seg.node.parentNode?.replaceChild(frag, seg.node);
  }
  return marks;
};

export const renderAnnotations = (root, annotations) => {
  clearAnnotations(root);
  if (!root) return [];
  const orphaned = [];
  for (const a of annotations) {
    if (!a.exact) continue;
    const span = locate(root.textContent || '', a);
    if (!span) {
      orphaned.push(a.id);
      continue;
    }
    wrapSpan(root, span.start, span.end, {
      id: a.id,
      type: a.type,
      color: a.color,
      body: a.body,
    });
  }
  return orphaned;
};
