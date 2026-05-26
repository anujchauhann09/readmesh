'use client';

import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-10">
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
        <dt className="text-muted-foreground">Theme</dt>
        <dd className="col-span-2 capitalize text-foreground">{user.preferences?.theme}</dd>
      </dl>
    </main>
  );
}
