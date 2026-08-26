'use client';

import { useTheme } from 'next-themes';
import { THEMES } from '@readmesh/shared';
import { useProfile } from '@/hooks/use-profile';
import { THEME_LABELS } from '@/lib/theme';

export function ThemeSelect() {
  // Reads straight from next-themes rather than seeding local state from a prop:
  // the old copy never resynced, so changing the theme from the reader's menu left
  // this select showing the previous value.
  const { theme, setTheme } = useTheme();
  const { updatePreferences } = useProfile();

  const onChange = (event) => {
    const next = event.target.value;
    setTheme(next);
    updatePreferences.mutate({ theme: next });
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor="theme" className="text-sm font-medium">
        Theme
      </label>
      <select
        id="theme"
        value={theme ?? 'system'}
        onChange={onChange}
        className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {THEMES.map((t) => (
          <option key={t} value={t}>
            {THEME_LABELS[t] ?? t}
          </option>
        ))}
      </select>
      {updatePreferences.isPending && <p className="text-xs text-muted-foreground">Saving…</p>}
    </div>
  );
}
