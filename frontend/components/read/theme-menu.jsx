'use client';

import { useTheme } from 'next-themes';
import { Check, Palette } from 'lucide-react';
import { THEMES } from '@readmesh/shared';
import { useProfile } from '@/hooks/use-profile';
import { useAuthGate } from '@/providers/auth-gate-provider';
import { THEME_LABELS } from '@/lib/theme';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const { updatePreferences } = useProfile();
  const { isAuthed } = useAuthGate();

  const choose = (next) => {
    setTheme(next);
    // This menu also sits on the public home page. Persisting for a signed-out
    // visitor produced a guaranteed 401 plus a pointless token-refresh attempt on
    // every click, so the theme stays local until there is an account to save it to.
    if (isAuthed) updatePreferences.mutate({ theme: next });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm outline-none hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring">
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">Theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((t) => (
          <DropdownMenuItem key={t} onSelect={() => choose(t)} className="justify-between gap-6">
            {THEME_LABELS[t] ?? t}
            {theme === t && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
