'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, LogOut, PenLine, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const initialOf = (user) => (user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase();

const NAV = [
  { href: '/read', label: 'Read a repo', icon: BookOpen },
  { href: '/editor', label: 'Editor', icon: PenLine },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="glass-bar sticky top-0 z-30 border-b border-border/70">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-1.5">
          <Link href="/dashboard" className="mr-3">
            <Logo markSize={26} />
          </Link>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-transparent p-1 pr-2.5 outline-none transition-colors hover:border-border hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/40">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-violet to-brand-cyan text-xs font-semibold text-white shadow-[0_4px_14px_-4px_hsl(var(--brand-violet)/0.8)]">
              {initialOf(user)}
            </span>
            <span className="hidden max-w-[12rem] truncate text-sm sm:inline">
              {user?.displayName || user?.email}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/profile')}>
              <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => logout.mutate(undefined, { onSuccess: () => router.replace('/') })}
            >
              <LogOut className="mr-2 h-4 w-4 text-muted-foreground" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}
