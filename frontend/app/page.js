import { APP_TAGLINE } from '@readmesh/shared';
import HomeClient from './home-client';

/**
 * Server shell for the home canvas.
 *
 * The canvas itself has to be a client component, but keeping the route entry on
 * the server is what allows a per-page `metadata` export — a `'use client'` page
 * cannot have one, so the landing page was inheriting only the root title.
 */
export const metadata = {
  title: 'readmesh — read the mesh of any codebase',
  description: APP_TAGLINE,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <HomeClient />;
}
