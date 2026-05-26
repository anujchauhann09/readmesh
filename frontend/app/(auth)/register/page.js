'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { CredentialsForm } from '@/components/auth/credentials-form';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start reading docs the better way.</p>
      </div>

      <CredentialsForm
        mode="register"
        isLoading={register.isPending}
        error={register.error}
        onSubmit={(payload) =>
          register.mutate(payload, { onSuccess: () => router.push('/dashboard') })
        }
      />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
