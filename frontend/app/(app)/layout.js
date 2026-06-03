'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/navbar';
import { LogoMark } from '@/components/brand/logo';

export default function AppLayout({ children }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/');
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <span className="rm-float">
            <LogoMark size={40} />
          </span>
          <span className="text-sm">Connecting the mesh…</span>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}
