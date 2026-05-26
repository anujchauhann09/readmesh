'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { CredentialsForm } from '@/components/auth/credentials-form';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your readmesh account.</p>
      </div>

      <CredentialsForm
        mode="login"
        isLoading={login.isPending}
        error={login.error}
        onSubmit={(payload) =>
          login.mutate(payload, { onSuccess: () => router.push('/dashboard') })
        }
      />

      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
