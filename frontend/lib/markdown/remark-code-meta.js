import { visit } from 'unist-util-visit';

/**
 * Carries a fenced block's info string into the rendered HTML.
 *
 * ```js {2,4-6}
 *
 * remark parses `js` as the language and `{2,4-6}` as the node's `meta`, but
 * mdast-to-hast drops `meta` entirely — only `language-js` survives as a class. The
 * highlight request therefore never reached the renderer. Re-attaching it as a data
 * attribute is the least invasive way to get it across the boundary.
 */
export function remarkCodeMeta() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (!node.meta) return;
      node.data = node.data ?? {};
      node.data.hProperties = { ...(node.data.hProperties ?? {}), 'data-meta': node.meta };
    });
  };
}
