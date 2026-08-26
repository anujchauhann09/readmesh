const FENCE_RE = /^\s{0,3}(`{3,}|~{3,})/;

/**
 * Truncates Markdown to a character budget without leaving a code fence open.
 *
 * A blind slice can cut in the middle of a fenced block, and the model then reads
 * the rest of the prompt (including our own delimiters and instructions) as code.
 * Backing up to the last fence boundary keeps the excerpt well-formed; if that
 * would throw away most of the budget, the fence is closed instead.
 */
export const truncateMarkdown = (input, limit) => {
  const text = input.trim();
  if (text.length <= limit) return { text, truncated: false };

  const sliced = text.slice(0, limit);
  const lines = sliced.split('\n');

  // Drop the final line: the slice almost certainly cut it mid-way.
  if (lines.length > 1) lines.pop();

  let open = null;
  let lastSafeLine = 0;
  lines.forEach((line, i) => {
    const match = FENCE_RE.exec(line);
    if (match) {
      if (open && match[1][0] === open[0] && match[1].length >= open.length) open = null;
      else if (!open) open = match[1];
    }
    if (!open) lastSafeLine = i + 1;
  });

  if (!open) return { text: lines.join('\n').trimEnd(), truncated: true };

  // Prefer cutting back to the last closed block, but only when that keeps most
  // of the budget; otherwise keep the content and close the fence ourselves.
  const trimmed = lines.slice(0, lastSafeLine).join('\n').trimEnd();
  if (trimmed.length >= limit * 0.6) return { text: trimmed, truncated: true };

  return { text: `${lines.join('\n').trimEnd()}\n${open}`, truncated: true };
};
