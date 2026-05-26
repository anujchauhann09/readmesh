'use client';

import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { ProfileForm } from '@/components/profile/profile-form';

export default function ProfilePage() {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  if (!user) return null;

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">How you appear in readmesh.</p>
      </div>

      <ProfileForm
        user={user}
        isLoading={updateProfile.isPending}
        error={updateProfile.error}
        saved={updateProfile.isSuccess}
        onSubmit={(payload) => updateProfile.mutate(payload)}
      />
    </main>
  );
}
