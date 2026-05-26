'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


export function CredentialsForm({ mode, onSubmit, isLoading = false, error = null }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(
      isRegister
        ? { email: form.email, password: form.password, displayName: form.displayName || undefined }
        : { email: form.email, password: form.password },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {isRegister && (
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Name</Label>
          <Input
            id="displayName"
            value={form.displayName}
            onChange={update('displayName')}
            placeholder="Ada Lovelace"
            autoComplete="name"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={form.password}
          onChange={update('password')}
          placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
      </div>

      {error?.message && <p className="text-sm text-destructive">{error.message}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  );
}
