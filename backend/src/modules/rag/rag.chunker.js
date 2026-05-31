const TARGET_CHARS = 1200;
const OVERLAP_CHARS = 150;
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*$/;

const splitOversized = (text, max) => {
  const parts = [];
  for (let i = 0; i < text.length; i += max) parts.push(text.slice(i, i + max));
  return parts;
};

const toSections = (markdown) => {
  const lines = markdown.split('\n');
  const sections = [];
  let trail = [];
  let buffer = [];

  const flush = () => {
    const text = buffer.join('\n').trim();
    if (text) sections.push({ heading: trail.join(' > '), text });
    buffer = [];
  };

  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    const match = !inFence && line.match(HEADING_RE);
    if (match) {
      flush();
      const depth = match[1].length;
      trail = trail.slice(0, depth - 1);
      trail[depth - 1] = match[2].trim();
      trail = trail.filter(Boolean);
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections;
};

export const chunkMarkdown = (markdown, { target = TARGET_CHARS, overlap = OVERLAP_CHARS } = {}) => {
  const chunks = [];
  if (!markdown || !markdown.trim()) return chunks;

  for (const section of toSections(markdown)) {
    const blocks = section.text.split(/\n{2,}/).flatMap((b) => {
      const t = b.trim();
      if (!t) return [];
      return t.length > target ? splitOversized(t, target) : [t];
    });

    let current = '';
    const push = (body) => {
      const text = body.trim();
      if (text) chunks.push({ text, heading: section.heading, index: chunks.length });
    };

    for (const block of blocks) {
      if (current && current.length + block.length + 2 > target) {
        push(current);
        current = overlap > 0 ? `${current.slice(-overlap)}\n\n${block}` : block;
      } else {
        current = current ? `${current}\n\n${block}` : block;
      }
    }
    push(current);
  }

  return chunks.map((c, index) => ({ ...c, index }));
};

export const chunkFiles = (files) =>
  files.flatMap((file) =>
    chunkMarkdown(file.content).map((chunk) => ({
      path: file.path,
      heading: chunk.heading,
      text: chunk.text,
    })),
  );
