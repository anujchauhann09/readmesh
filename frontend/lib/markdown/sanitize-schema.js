import { defaultSchema } from 'rehype-sanitize';

const attr = defaultSchema.attributes ?? {};
const dedupe = (...lists) => [...new Set(lists.flat())];

export const sanitizeSchema = {
  ...defaultSchema,
  tagNames: dedupe(defaultSchema.tagNames ?? [], ['details', 'summary']),
  attributes: {
    ...attr,
    '*': dedupe(attr['*'] ?? [], ['className']),
    img: dedupe(attr.img ?? [], ['width', 'height', 'align', 'loading']),
    div: dedupe(attr.div ?? [], ['align']),
    ol: dedupe(attr.ol ?? [], ['start']),
  },
};
