export const APP_NAME = 'readmesh';

export const APP_TAGLINE =
  "Read, navigate, search, and understand any GitHub repo's docs — beautifully, with AI.";

export const API_VERSION = 'v1';

export const API_PREFIX = `/api/${API_VERSION}`;

export const ROUTES = Object.freeze({
  HEALTH: '/health',
  AUTH: Object.freeze({
    BASE: '/auth',
    REGISTER: '/register',
    LOGIN: '/login',
    LOGOUT: '/logout',
    REFRESH: '/refresh',
    ME: '/me',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  }),
  USERS: Object.freeze({
    BASE: '/users',
    ME: '/me',
    PREFERENCES: '/me/preferences',
  }),
  SAVED_REPOS: Object.freeze({
    BASE: '/saved-repos',
    ROOT: '/',
    BY_ID: '/:id',
  }),
  GITHUB: Object.freeze({
    BASE: '/github',
    RESOLVE: '/resolve',
    REPO: '/repo',
    CONTENT: '/content',
  }),
  SUMMARY: Object.freeze({
    BASE: '/summary',
    TLDR: '/tldr',
    COMMANDS: '/commands',
    BEGINNER: '/beginner',
    TRANSLATE: '/translate',
  }),
  RAG: Object.freeze({
    BASE: '/rag',
    INGEST: '/ingest',
    ASK: '/ask',
    ASK_STREAM: '/ask/stream',
  }),
  CHAT: Object.freeze({
    BASE: '/chat',
    CONVERSATIONS: '/conversations',
    // Messages come back with the conversation itself; there is no separate
    // endpoint, and declaring one the backend does not serve is a 404 waiting
    // to be wired up.
    CONVERSATION_BY_ID: '/conversations/:id',
  }),
  ANNOTATIONS: Object.freeze({
    BASE: '/annotations',
    ROOT: '/',
    BY_ID: '/:id',
  }),
  DOCUMENTS: Object.freeze({
    BASE: '/documents',
    ROOT: '/',
    BY_ID: '/:id',
  }),
  ANALYTICS: Object.freeze({
    BASE: '/analytics',
    EVENTS: '/events',
    SUMMARY: '/summary',
  }),
  OAUTH: Object.freeze({
    BASE: '/oauth',
    START: '/:provider',
    CALLBACK: '/:provider/callback',
  }),
});

export const OAUTH_PROVIDERS = Object.freeze(['google', 'github']);

export const DOCUMENT_LIMITS = Object.freeze({
  TITLE_MAX: 200,
  CONTENT_MAX: 1_000_000,
});

export const DEFAULT_DOCUMENT_TITLE = 'Untitled document';

/**
 * Derives a document title from its Markdown: the first level-1 heading, or a
 * placeholder. Shared so the title shown while typing in the editor is always the
 * same string the server stores — three separate copies of this regex had already
 * started to drift.
 */
export const deriveDocumentTitle = (content = '') => {
  const match = String(content).match(/^#\s+(.+)$/m);
  const title = match ? match[1].trim() : '';
  return (title || DEFAULT_DOCUMENT_TITLE).slice(0, DOCUMENT_LIMITS.TITLE_MAX);
};

/**
 * Shared list-endpoint bounds. Every collection endpoint accepts `limit` and a
 * `cursor` (the `id` of the last item from the previous page) and always returns
 * a plain array plus a `meta` block, so callers that ignore paging still work.
 */
export const PAGINATION = Object.freeze({
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 200,
});

/** How long a password-reset link stays valid. */
export const PASSWORD_RESET_TTL_MINUTES = 30;

export const THEMES = Object.freeze([
  'system',
  'light',
  'dark',
  'github',
  'dracula',
  'nord',
  'vscode',
]);

export const DEFAULT_THEME = 'system';

export const SUMMARY_LANGUAGES = Object.freeze([
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'ja', label: 'Japanese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ko', label: 'Korean' },
]);

export const SUMMARY_LANGUAGE_CODES = SUMMARY_LANGUAGES.map((l) => l.code);

export const summaryLanguageLabel = (code) =>
  SUMMARY_LANGUAGES.find((l) => l.code === code)?.label ?? code;

export const ANNOTATION_TYPES = Object.freeze(['HIGHLIGHT', 'NOTE', 'COMMENT']);

export const HIGHLIGHT_COLORS = Object.freeze(['yellow', 'green', 'blue', 'pink', 'purple']);
export const DEFAULT_HIGHLIGHT_COLOR = 'yellow';

export const CHAT_ROLES = Object.freeze(['USER', 'ASSISTANT']);

export const ANALYTICS_EVENTS = Object.freeze([
  'REPO_OPENED',
  'FILE_OPENED',
  'SUMMARY_GENERATED',
  'QUESTION_ASKED',
  'ANNOTATION_CREATED',
  'DOCUMENT_EXPORTED',
]);
