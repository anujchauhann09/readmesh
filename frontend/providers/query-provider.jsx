'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Devtools are loaded through a dynamic import behind a build-time flag.
 *
 * A static import made the package a hard build dependency, so `pnpm install --prod`
 * followed by `next build` — the usual deploy sequence — failed to resolve it. Behind
 * `process.env.NODE_ENV`, which Next inlines, the whole branch (and its chunk) is
 * dropped from a production build instead.
 */
const Devtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(
        () => import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools),
        { ssr: false },
      )
    : null;

export function QueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            // Retrying a 4xx just repeats a request the server already rejected;
            // only transient failures are worth a second attempt.
            retry: (failureCount, error) => {
              const status = error?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {Devtools && <Devtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
