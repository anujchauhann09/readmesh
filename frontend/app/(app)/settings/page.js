'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { useDialog } from '@/providers/dialog-provider';
import { ThemeSelect } from '@/components/settings/theme-select';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { deleteAccount } = useProfile();
  const dialog = useDialog();
  if (!user) return null;

  const handleDelete = async () => {
    const ok = await dialog.confirm({
      title: 'Delete account?',
      description: 'This deactivates your account and signs you out everywhere. This cannot be undone.',
      confirmLabel: 'Delete account',
      destructive: true,
    });
    if (!ok) return;
    deleteAccount.mutate(undefined, { onSuccess: () => router.replace('/') });
  };

  return (
    <main className="mx-auto max-w-lg space-y-10 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Appearance</h2>
        <ThemeSelect current={user.preferences?.theme ?? 'system'} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Deleting your account deactivates it and signs you out everywhere.
        </p>
        <Button variant="destructive" onClick={handleDelete} disabled={deleteAccount.isPending}>
          {deleteAccount.isPending ? 'Deleting…' : 'Delete account'}
        </Button>
      </section>
    </main>
  );
}
