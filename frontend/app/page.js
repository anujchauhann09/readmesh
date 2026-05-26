import Link from 'next/link';
import { APP_NAME, APP_TAGLINE } from '@readmesh/shared';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
        Phase 3 · Auth
      </span>
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{APP_NAME}</h1>
      <p className="text-balance text-lg text-muted-foreground">{APP_TAGLINE}</p>
      <div className="flex items-center gap-3">
        <Button asChild>
          <Link href="/register">Get started</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
      <Link href="/dashboard" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        Go to dashboard →
      </Link>
    </main>
  );
}
