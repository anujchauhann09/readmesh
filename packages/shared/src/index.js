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
  }),
  USERS: Object.freeze({
    BASE: '/users',
    ME: '/me',
    PREFERENCES: '/me/preferences',
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
});

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
