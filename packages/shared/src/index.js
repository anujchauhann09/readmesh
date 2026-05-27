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
