/**
 * Shared plumbing for the two layers that decorate rendered Markdown after the
 * fact: search matches (`data-rm-hl`) and annotations (`data-annot-id`).
 *
 * Both wrap text in `<mark>` elements, and both can be active at once — searching
 * inside an annotated document nests one layer within the other. The rule that
 * keeps them from destroying each other is here: removing a mark must preserve
 * whatever is inside it.
 */

/**
 * Replaces an element with its own children.
 *
 * The previous implementation did `replaceChild(createTextNode(mark.textContent))`,
 * which flattens the subtree — so clearing search highlights also deleted every
 * annotation mark nested inside one, and vice versa. Moving the children out keeps
 * the other layer intact.
 */
export const unwrapElement = (el) => {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
  // Merges the text nodes left on either side so offsets stay contiguous for the
  // next pass. Element children are untouched by normalize().
  parent.normalize();
};

/** Removes every mark carrying `attribute`, leaving other layers in place. */
export const clearMarks = (root, attribute) => {
  if (!root) return;
  root.querySelectorAll(`mark[${attribute}]`).forEach(unwrapElement);
};

/**
 * Collects the root's text nodes with their absolute offsets, so a character range
 * measured against `root.textContent` can be mapped back onto the DOM.
 */
export const textSegments = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.nodeValue ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });

  const segments = [];
  let pos = 0;
  let node = walker.nextNode();
  while (node) {
    const len = node.nodeValue.length;
    segments.push({ node, start: pos, end: pos + len });
    pos += len;
    node = walker.nextNode();
  }
  return segments;
};
