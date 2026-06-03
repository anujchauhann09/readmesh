'use client';

import { useState } from 'react';
import { Github } from 'lucide-react';
import { oauthStartUrl } from '@/lib/api/oauth';

const PROVIDERS = [
  { key: 'google', label: 'Google', Icon: GoogleIcon },
  { key: 'github', label: 'GitHub', Icon: GithubIcon },
];

export function SocialAuth({ showDivider = true }) {
  const [busy, setBusy] = useState(null);

  const start = (key) => {
    setBusy(key);
    window.location.assign(oauthStartUrl(key));
  };

  return (
    <div>
      <div className="space-y-2">
        {PROVIDERS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            disabled={Boolean(busy)}
            onClick={() => start(key)}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card/40 px-3 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors hover:border-brand-violet/40 hover:bg-accent disabled:opacity-60"
          >
            <Icon className="h-[1.1rem] w-[1.1rem]" />
            {busy === key ? `Redirecting to ${label}…` : `Continue with ${label}`}
          </button>
        ))}
      </div>

      {showDivider && (
        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}
    </div>
  );
}

function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function GithubIcon({ className }) {
  return <Github className={className} aria-hidden="true" />;
}
