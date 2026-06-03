'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { CredentialsForm } from '@/components/auth/credentials-form';
import { SocialAuth } from '@/components/auth/social-auth';
import { Logo } from '@/components/brand/logo';
import { claimGuestDraft } from '@/lib/documents/claim-draft';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  return (
    <main className="flex app-min-h flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8">
        <Logo markSize={32} nameClassName="text-lg" />
      </Link>

      <div className="rm-panel rm-rise w-full max-w-sm p-7">
        <div className="mb-6 space-y-1.5 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">Start reading docs the better way.</p>
        </div>

        <SocialAuth />

        <CredentialsForm
          mode="register"
          isLoading={register.isPending}
          error={register.error}
          onSubmit={(payload) =>
            register.mutate(payload, {
              onSuccess: async () => {
                await claimGuestDraft().catch(() => null);
                router.push('/dashboard');
              },
            })
          }
        />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-violet hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
