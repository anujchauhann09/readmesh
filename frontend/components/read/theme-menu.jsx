'use client';

import { useTheme } from 'next-themes';
import { Check, Palette } from 'lucide-react';
import { THEMES } from '@readmesh/shared';
import { useProfile } from '@/hooks/use-profile';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const LABELS = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
  github: 'GitHub',
  dracula: 'Dracula',
  nord: 'Nord',
  vscode: 'VS Code',
};

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const { updatePreferences } = useProfile();

  const choose = (next) => {
    setTheme(next);
    updatePreferences.mutate({ theme: next });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm outline-none hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring">
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">Theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t}
            onSelect={() => choose(t)}
            className="justify-between gap-6"
          >
            {LABELS[t] ?? t}
            {theme === t && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
