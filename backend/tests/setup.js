/**
 * Loaded via `node --test --import ./tests/setup.js`.
 *
 * `config/env.js` validates the environment at import time and exits the process
 * when anything is missing, so the test environment has to exist before any
 * module under test is loaded. Values are only filled in when absent, so a real
 * `.env` still wins locally.
 */
const defaults = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/readmesh_test?schema=public',
  JWT_ACCESS_SECRET: 'test-access-secret-that-is-long-enough-000000',
  JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-long-enough-00000',
  CORS_ORIGIN: 'http://localhost:3000,https://app.readmesh.test',
  TRUST_PROXY: 'false',
  MAIL_DRIVER: 'log',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}
