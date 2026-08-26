import { Suspense } from 'react';
import ReadClient from './read-client';

export const metadata = {
  title: 'Repository reader',
  description: "Render any public GitHub repository's docs and ask AI about them.",
};

/**
 * The reader restores its state from the query string, and `useSearchParams`
 * requires a Suspense boundary so the rest of the route can still be prerendered.
 */
export default function ReadPage() {
  return (
    <Suspense fallback={null}>
      <ReadClient />
    </Suspense>
  );
}
