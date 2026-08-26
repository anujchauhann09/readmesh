const FENCE_RE = /^\s{0,3}(`{3,}|~{3,})/;

/**
 * Rewrites `[1]` citation markers in an answer into links the UI can scroll from.
 *
 * Code is skipped deliberately. The naive whole-string replace also rewrote
 * bracket pairs inside fenced blocks and inline spans — array indexing, shell
 * globs, regex character classes — turning real code samples into broken Markdown
 * links. Only markers whose number matches a retrieved source are linked, so a
 * model that invents `[9]` leaves plain text behind.
 */
export const linkCitations = (content = '', sources = []) => {
  const valid = new Set(sources.map((s) => s.number));
  if (valid.size === 0) return content;

  const linkMarkers = (text) =>
    text.replace(/\[(\d+)\]/g, (match, n) =>
      valid.has(Number(n)) ? `[\\[${n}\\]](#cite-${n})` : match,
    );

  // Inline code spans are protected the same way, one line at a time.
  const linkOutsideInlineCode = (line) =>
    line
      .split(/(`+[^`]*`+)/g)
      .map((part) => (part.startsWith('`') ? part : linkMarkers(part)))
      .join('');

  let fence = null;

  return content
    .split('\n')
    .map((line) => {
      const match = FENCE_RE.exec(line);
      if (match) {
        if (fence && match[1][0] === fence[0] && match[1].length >= fence.length) fence = null;
        else if (!fence) fence = match[1];
        return line;
      }
      return fence ? line : linkOutsideInlineCode(line);
    })
    .join('\n');
};
