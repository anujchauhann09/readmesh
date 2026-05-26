'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center text-muted-foreground">Loading…</main>;
  }
  if (!user) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{user.displayName ? `, ${user.displayName}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">You&apos;re signed in.</p>
      </div>

      <dl className="grid grid-cols-3 gap-y-2 rounded-lg border border-border bg-card p-5 text-sm">
        <dt className="text-muted-foreground">Email</dt>
        <dd className="col-span-2 text-foreground">{user.email}</dd>
        <dt className="text-muted-foreground">Role</dt>
        <dd className="col-span-2 capitalize text-foreground">{user.role}</dd>
        <dt className="text-muted-foreground">Verified</dt>
        <dd className="col-span-2 text-foreground">{user.emailVerified ? 'Yes' : 'No'}</dd>
      </dl>

      <Button
        variant="outline"
        className="self-start"
        disabled={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace('/login') })}
      >
        {logout.isPending ? 'Signing out…' : 'Log out'}
      </Button>
    </main>
  );
}
