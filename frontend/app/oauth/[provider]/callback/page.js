'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_ME_KEY } from '@/hooks/use-auth';
import { oauthCallbackRequest } from '@/lib/api/oauth';
import { claimGuestDraft } from '@/lib/documents/claim-draft';
import { LogoMark } from '@/components/brand/logo';

let exchangedCode = null;

function OAuthCallback() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  useEffect(() => {
    const provider = params?.provider;
    const code = search.get('code');
    const state = search.get('state');
    const providerError = search.get('error');

    if (providerError || !code || !state) {
      setError('Sign-in was cancelled or didn’t complete. Please try again.');
      return;
    }
    if (exchangedCode === code) return;
    exchangedCode = code;

    (async () => {
      try {
        const user = await oauthCallbackRequest({ provider, code, state });
        queryClient.setQueryData(AUTH_ME_KEY, user);
        await claimGuestDraft().catch(() => null);
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        router.replace('/dashboard');
      } catch (e) {
        setError(e?.message || 'We couldn’t complete sign-in. Please try again.');
      }
    })();
  }, [params, search, queryClient, router]);

  if (error) {
    return (
      <main className="grid app-min-h place-items-center px-6">
        <div className="rm-panel rm-rise w-full max-w-sm p-8 text-center">
          <LogoMark size={34} />
          <h1 className="mt-4 font-display text-lg font-semibold">Sign-in failed</h1>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to readmesh
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="grid app-min-h place-items-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <span className="rm-float">
          <LogoMark size={38} />
        </span>
        <span className="text-sm">Completing sign-in…</span>
      </div>
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <OAuthCallback />
    </Suspense>
  );
}
