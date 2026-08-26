import test from 'node:test';
import assert from 'node:assert/strict';
import { API_PREFIX, ROUTES } from '@readmesh/shared';
import { createApp } from '../src/app.js';

/**
 * Guards the seam between the two halves of the app.
 *
 * The frontend never types a URL: every request is assembled from `ROUTES` in the
 * shared package. So a backend route mounted at a path that is not expressible from
 * `ROUTES` is unreachable from the client, and a `ROUTES` entry with no route behind
 * it is a guaranteed 404 the moment someone wires it up. Neither shows up in a build,
 * a lint, or a unit test — they only surface as a broken feature. This test makes
 * both conditions fail loudly instead.
 */

/** Walks the Express router tree into `METHOD /full/path` strings. */
const mountedRoutes = (stack, prefix = '') =>
  stack.flatMap((layer) => {
    if (layer.route) {
      return Object.keys(layer.route.methods)
        .filter((method) => layer.route.methods[method])
        .map((method) => `${method.toUpperCase()} ${normalize(prefix + layer.route.path)}`);
    }
    if (layer.name === 'router' && layer.handle?.stack) {
      const segment = (layer.regexp?.source ?? '')
        .replace('^\\/', '/')
        .replace('\\/?(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace(/\$$/, '');
      return mountedRoutes(layer.handle.stack, prefix + (segment === '/(?:/)?' ? '' : segment));
    }
    return [];
  });

/** Collapses the trailing slash so `/documents/` and `/documents` compare equal. */
const normalize = (path) => (path.length > 1 ? path.replace(/\/$/, '') : path);

/** Every path the shared contract can express, as `base + suffix` combinations. */
const contractPaths = () => {
  const paths = new Set();

  for (const group of Object.values(ROUTES)) {
    if (typeof group === 'string') {
      paths.add(normalize(`${API_PREFIX}${group}`));
      continue;
    }
    const base = group.BASE ?? '';
    paths.add(normalize(`${API_PREFIX}${base}`));
    for (const [key, suffix] of Object.entries(group)) {
      if (key === 'BASE' || typeof suffix !== 'string') continue;
      paths.add(normalize(`${API_PREFIX}${base}${suffix}`));
    }
  }
  return paths;
};

const app = createApp();
const routes = mountedRoutes(app._router.stack);
const expressible = contractPaths();

test('the API mounts a non-trivial number of routes', () => {
  assert.ok(
    routes.length > 30,
    `only found ${routes.length} routes — the walker is probably wrong`,
  );
});

test('every mounted route is expressible from the shared ROUTES contract', () => {
  const unreachable = routes
    .map((route) => route.split(' ')[1])
    .filter((path) => !expressible.has(path));

  assert.deepEqual(
    [...new Set(unreachable)],
    [],
    'these routes cannot be built from @readmesh/shared, so the frontend cannot call them',
  );
});

test('every ROUTES entry is backed by a mounted route', () => {
  const mountedPaths = new Set(routes.map((route) => route.split(' ')[1]));

  // Bases are mount points rather than endpoints in their own right, so a base is
  // satisfied by anything mounted beneath it.
  const isSatisfied = (path) =>
    mountedPaths.has(path) || [...mountedPaths].some((mounted) => mounted.startsWith(`${path}/`));

  const dangling = [...expressible].filter((path) => !isSatisfied(path));

  assert.deepEqual([...dangling], [], 'these contract paths have no backend route behind them');
});

test('every route lives under the versioned API prefix', () => {
  const stray = routes.filter((route) => !route.split(' ')[1].startsWith(API_PREFIX));
  assert.deepEqual(stray, []);
});

test('route parameters are named consistently as :id', () => {
  // The frontend's `byId(id)` helpers assume a single positional identifier per
  // resource; a route taking `:documentId` would still work but breaks the pattern.
  const odd = routes
    .map((route) => route.split(' ')[1])
    .filter((path) => /:(?!id\b|provider\b)[A-Za-z]+/.test(path));

  assert.deepEqual(odd, []);
});
