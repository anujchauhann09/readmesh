'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';

/**
 * Route-level error boundary.
 *
 * This app renders arbitrary third-party Markdown through Mermaid, KaTeX, Shiki and
 * several rehype plugins — a malformed README really can throw during render. Without
 * a boundary that took down the whole route with Next's default screen and no way back.
 */
export default function RouteError({ error, reset }) {
  useEffect(() => {
    console.error('[readmesh] route error', error);
  }, [error]);

  return (
    <main className="grid app-min-h place-items-center px-6">
      <div className="rm-panel rm-rise w-full max-w-md p-8 text-center">
        <LogoMark size={34} />
        <h1 className="mt-4 font-display text-lg font-semibold">Something went wrong</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This page hit an unexpected error. Trying again usually clears it.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-[0.7rem] text-muted-foreground/70">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
