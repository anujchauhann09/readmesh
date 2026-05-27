'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@readmesh/shared';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const initialOf = (user) => (user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase();

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            {APP_NAME}
          </Link>
          <Link href="/read" className="text-sm text-muted-foreground hover:text-foreground">
            Read a repo
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 outline-none hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
              {initialOf(user)}
            </span>
            <span className="max-w-[12rem] truncate text-sm">{user?.displayName || user?.email}</span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/profile')}>Profile</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => logout.mutate(undefined, { onSuccess: () => router.replace('/login') })}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}
