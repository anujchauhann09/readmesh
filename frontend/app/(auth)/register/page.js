'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CredentialsForm } from '@/components/auth/credentials-form';
import { SocialAuth } from '@/components/auth/social-auth';
import { Logo } from '@/components/brand/logo';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [registered, setRegistered] = useState(false);

  return (
    <main className="flex app-min-h flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8">
        <Logo markSize={32} nameClassName="text-lg" />
      </Link>

      <div className="rm-panel rm-rise w-full max-w-sm p-7">
        {registered ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Successfully registered
            </h1>
            <p className="text-sm text-muted-foreground">
              Your account is ready. Redirecting you to sign in…
            </p>
            <Link
              href="/login"
              className="inline-block text-sm font-medium text-brand-violet hover:underline"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-1.5 text-center">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground">Start reading docs the better way.</p>
            </div>

            <SocialAuth />

            <CredentialsForm
              mode="register"
              isLoading={register.isPending}
              error={register.error}
              onSubmit={(payload) =>
                register.mutate(payload, {
                  onSuccess: () => {
                    setRegistered(true);
                    setTimeout(() => router.push('/login'), 1500);
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
          </>
        )}
      </div>
    </main>
  );
}
