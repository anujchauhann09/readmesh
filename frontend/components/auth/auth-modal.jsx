'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { APP_NAME } from '@readmesh/shared';
import { loginRequest, registerRequest } from '@/lib/api/auth';
import { AUTH_ME_KEY } from '@/hooks/use-auth';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { LogoMark } from '@/components/brand/logo';
import { SocialAuth } from '@/components/auth/social-auth';
import { claimGuestDraft } from '@/lib/documents/claim-draft';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEFAULT_TITLE = 'Sign in to continue';
const DEFAULT_DESCRIPTION =
  'Create an account to save notes, highlight text, and use AI-powered actions.';

export function AuthModal({ title, description, onClose, onAuthed }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const panelRef = useRef(null);

  useFocusTrap(panelRef, { onEscape: onClose });

  const mutation = useMutation({
    mutationFn: mode === 'register' ? registerRequest : loginRequest,
    onSuccess: async (data) => {
      if (mode === 'register') {
        setMode('login');
        setForm((f) => ({ ...f, password: '', displayName: '' }));
        setNotice('Successfully registered — please sign in to continue.');
        return;
      }
      queryClient.setQueryData(AUTH_ME_KEY, data.user ?? data);
      await claimGuestDraft().catch(() => null);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onAuthed();
    },
    onError: (err) => setError(err?.message ?? 'Something went wrong'),
  });

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const payload =
      mode === 'register' ? form : { email: form.email, password: form.password };
    mutation.mutate(payload);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm rm-fade-in"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || DEFAULT_TITLE}
        className="rm-modal-in rm-panel rm-panel-glow relative w-full max-w-md p-6 text-card-foreground"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-border/70 bg-card/60">
            <LogoMark size={30} />
          </div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {title || DEFAULT_TITLE}
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            {description || DEFAULT_DESCRIPTION}
          </p>
        </div>

        {notice && (
          <p className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-600 dark:text-emerald-400">
            {notice}
          </p>
        )}

        <SocialAuth />

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <Label htmlFor="am-name">Display name</Label>
              <Input
                id="am-name"
                value={form.displayName}
                onChange={set('displayName')}
                placeholder="Ada Lovelace"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="am-email">Email</Label>
            <Input
              id="am-email"
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="am-password">Password</Label>
            <Input
              id="am-password"
              type="password"
              required
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'register' ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === 'register' ? 'Already have an account?' : 'New to ' + APP_NAME + '?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'register' ? 'login' : 'register');
              setError(null);
              setNotice(null);
            }}
            className="font-medium text-foreground hover:underline"
          >
            {mode === 'register' ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  );
}
