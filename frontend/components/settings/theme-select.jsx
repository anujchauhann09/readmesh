'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { THEMES } from '@readmesh/shared';
import { useProfile } from '@/hooks/use-profile';

const LABELS = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
  github: 'GitHub',
  dracula: 'Dracula',
  nord: 'Nord',
  vscode: 'VS Code',
};

export function ThemeSelect({ current = 'system' }) {
  const { setTheme } = useTheme();
  const { updatePreferences } = useProfile();
  const [value, setValue] = useState(current);

  const onChange = (event) => {
    const theme = event.target.value;
    setValue(theme);
    setTheme(theme);
    updatePreferences.mutate({ theme });
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor="theme" className="text-sm font-medium">
        Theme
      </label>
      <select
        id="theme"
        value={value}
        onChange={onChange}
        className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {THEMES.map((theme) => (
          <option key={theme} value={theme}>
            {LABELS[theme] ?? theme}
          </option>
        ))}
      </select>
      {updatePreferences.isPending && <p className="text-xs text-muted-foreground">Saving…</p>}
    </div>
  );
}
