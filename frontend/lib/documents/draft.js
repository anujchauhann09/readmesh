import { APP_NAME } from '@readmesh/shared';

export const DRAFT_KEY = 'readmesh:home-draft';

export const HOME_SAMPLE = `# Welcome to ${APP_NAME}

Start writing **Markdown** on the left — the preview updates live on the right.
No account needed.

## What you can do here

- Paste or write Markdown instantly
- See a beautiful live preview
- Use the toolbar for **bold**, lists, links, and more

\`\`\`js
function hello(name) {
  return \`Hi, \${name}!\`;
}
\`\`\`

> [!TIP]
> Sign in to unlock AI summaries, highlights, notes, and saving.

| Feature      | Free | Account |
| ------------ | :--: | :-----: |
| Edit & preview | ✅ | ✅ |
| AI & notes     | —  | ✅ |
`;

export const readGuestDraft = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(DRAFT_KEY);
};

export const clearGuestDraft = () => {
  if (typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_KEY);
};

export const hasMeaningfulGuestDraft = () => {
  const draft = readGuestDraft();
  return Boolean(draft && draft.trim() && draft.trim() !== HOME_SAMPLE.trim());
};
