import Link from 'next/link';
import { LogoMark } from '@/components/brand/logo';

export const metadata = { title: 'Page not found — readmesh' };

export default function NotFound() {
  return (
    <main className="grid app-min-h place-items-center px-6">
      <div className="rm-panel rm-rise w-full max-w-md p-8 text-center">
        <LogoMark size={34} />
        <h1 className="mt-4 font-display text-lg font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          That link doesn&apos;t lead anywhere in readmesh.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to readmesh
        </Link>
      </div>
    </main>
  );
}
