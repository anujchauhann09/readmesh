import { clearMarks } from './decorations.js';

const HL_ATTR = 'data-rm-hl';
const HL_CLASS = 'rm-hl';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'PRE', 'TEXTAREA', 'CODE']);
const SKIP_CLASSES = ['katex', 'katex-display'];

const isSkipped = (node, root) => {
  let el = node.parentElement;
  while (el && el !== root) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (SKIP_CLASSES.some((c) => el.classList?.contains(c))) return true;
    el = el.parentElement;
  }
  return false;
};

/** Removes search marks only — annotation marks nested inside them survive. */
export function clearHighlights(root) {
  clearMarks(root, HL_ATTR);
}

export function applyHighlights(root, query) {
  clearHighlights(root);
  const needle = (query || '').toLowerCase();
  if (!root || needle.length === 0) return [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (isSkipped(node, root)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.toLowerCase().includes(needle)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const textNodes = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current);
    current = walker.nextNode();
  }

  const marks = [];
  for (const textNode of textNodes) {
    const text = textNode.nodeValue;
    const lower = text.toLowerCase();
    const fragment = document.createDocumentFragment();
    let last = 0;
    let pos = lower.indexOf(needle);
    while (pos !== -1) {
      if (pos > last) fragment.appendChild(document.createTextNode(text.slice(last, pos)));
      const mark = document.createElement('mark');
      mark.setAttribute(HL_ATTR, '');
      mark.className = HL_CLASS;
      mark.textContent = text.slice(pos, pos + needle.length);
      fragment.appendChild(mark);
      marks.push(mark);
      last = pos + needle.length;
      pos = lower.indexOf(needle, last);
    }
    if (last < text.length) fragment.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return marks;
}
