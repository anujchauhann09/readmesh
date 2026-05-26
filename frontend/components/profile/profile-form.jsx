'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ProfileForm({ user, onSubmit, isLoading = false, error = null, saved = false }) {
  const [form, setForm] = useState({
    displayName: user.displayName ?? '',
    bio: user.bio ?? '',
  });

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      displayName: form.displayName.trim() || null,
      bio: form.bio.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" value={form.displayName} onChange={update('displayName')} maxLength={80} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={form.bio} onChange={update('bio')} maxLength={500} rows={4} />
      </div>

      {error?.message && <p className="text-sm text-destructive">{error.message}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Save changes'}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
      </div>
    </form>
  );
}
