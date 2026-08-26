import { defaultSchema } from 'rehype-sanitize';

const attr = defaultSchema.attributes ?? {};
const dedupe = (...lists) => [...new Set(lists.flat())];

/**
 * Sanitizer policy for rendered Markdown.
 *
 * Starts from the GitHub-derived default (which already excludes `script`,
 * `style`, `iframe`, `video`, `audio`, `object` and `embed`) and makes three
 * deliberate adjustments.
 */
export const sanitizeSchema = {
  ...defaultSchema,

  /**
   * The default prefixes every `id` with `user-content-` to guard against DOM
   * clobbering. remark-rehype *already* namespaces footnote ids and their hrefs
   * with the same prefix, so the second pass produced `user-content-user-content-fn-1`
   * on the target while the link still pointed at `#user-content-fn-1` — every
   * footnote link in every document led nowhere. The same rewrite silently broke
   * heading anchors, since `[jump](#install)` is never rewritten to match.
   *
   * Turning the extra prefixing off is safe here: no tag that can execute or
   * navigate on its own survives sanitization, and nothing in the app resolves
   * globals by element name.
   */
  clobberPrefix: '',

  tagNames: dedupe(defaultSchema.tagNames ?? [], ['details', 'summary']),

  protocols: {
    ...(defaultSchema.protocols ?? {}),
    /**
     * `data:` is permitted for `src` so images pasted into the editor survive
     * rendering — previously they were stripped and the paste silently produced
     * an empty paragraph. `img` is the only sanctioned tag that carries `src`
     * (iframe/video/audio/embed are all absent from `tagNames`), so this cannot
     * become a `data:text/html` navigation vector.
     */
    src: dedupe(defaultSchema.protocols?.src ?? [], ['data']),
  },

  attributes: {
    ...attr,
    '*': dedupe(attr['*'] ?? [], ['className']),
    img: dedupe(attr.img ?? [], ['width', 'height', 'align', 'loading', 'title', 'alt']),
    div: dedupe(attr.div ?? [], ['align']),
    ol: dedupe(attr.ol ?? [], ['start']),
    // Emitted by remark-gfm's footnote handling.
    section: dedupe(attr.section ?? [], ['dataFootnotes', 'className']),
    li: dedupe(attr.li ?? [], ['id']),
    sup: dedupe(attr.sup ?? [], ['id']),
    // Carries the code fence's info string (e.g. `{2,4-6}`) to the renderer.
    code: dedupe(attr.code ?? [], ['className', 'dataMeta']),
  },
};
