import { visit } from 'unist-util-visit';

const ALERT = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;

export function remarkCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node) => {
      const para = node.children?.[0];
      if (!para || para.type !== 'paragraph') return;
      const lead = para.children?.[0];
      if (!lead || lead.type !== 'text') return;

      const match = ALERT.exec(lead.value);
      if (!match) return;
      const type = match[1].toLowerCase();

      lead.value = lead.value.slice(match[0].length).replace(/^\r?\n/, '');
      if (lead.value.trim() === '') {
        para.children.shift();
        if (para.children[0]?.type === 'break') para.children.shift();
      }
      if (para.children.length === 0) node.children.shift();

      node.data = node.data ?? {};
      node.data.hProperties = {
        ...(node.data.hProperties ?? {}),
        className: ['callout', `callout-${type}`],
      };
    });
  };
}
