const HEADING_DEPTH = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };
const MIN_COLLAPSE_DEPTH = 2;

const headingDepth = (node) =>
  node && node.type === 'element' ? HEADING_DEPTH[node.tagName] : undefined;

const group = (nodes) => {
  const out = [];
  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];
    const depth = headingDepth(node);

    if (depth && depth >= MIN_COLLAPSE_DEPTH) {
      let j = i + 1;
      const body = [];
      while (j < nodes.length) {
        const next = headingDepth(nodes[j]);
        if (next && next <= depth) break;
        body.push(nodes[j]);
        j += 1;
      }
      out.push({
        type: 'element',
        tagName: 'section',
        properties: { className: ['md-section'], dataDepth: depth },
        children: [node, ...group(body)],
      });
      i = j;
    } else {
      out.push(node);
      i += 1;
    }
  }
  return out;
};

export function rehypeCollapsibleSections() {
  return (tree) => {
    if (tree && Array.isArray(tree.children)) {
      tree.children = group(tree.children);
    }
  };
}
