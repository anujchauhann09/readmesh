'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { CredentialsForm } from '@/components/auth/credentials-form';
import { SocialAuth } from '@/components/auth/social-auth';
import { Logo } from '@/components/brand/logo';
import { claimGuestDraft } from '@/lib/documents/claim-draft';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  return (
    <main className="flex app-min-h flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8">
        <Logo markSize={32} nameClassName="text-lg" />
      </Link>

      <div className="rm-panel rm-rise w-full max-w-sm p-7">
        <div className="mb-6 space-y-1.5 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your readmesh workspace.</p>
        </div>

        <SocialAuth />

        <CredentialsForm
          mode="login"
          isLoading={login.isPending}
          error={login.error}
          onSubmit={(payload) =>
            login.mutate(payload, {
              onSuccess: async () => {
                await claimGuestDraft().catch(() => null);
                router.push('/dashboard');
              },
            })
          }
        />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/register" className="font-medium text-brand-violet hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
