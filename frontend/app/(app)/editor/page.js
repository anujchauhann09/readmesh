'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogoMark } from '@/components/brand/logo';
import { useDocuments } from '@/hooks/use-documents';


export default function EditorIndexPage() {
  const router = useRouter();
  const { documents, isLoading, create } = useDocuments();
  const acted = useRef(false);

  useEffect(() => {
    if (isLoading || acted.current) return;
    acted.current = true;

    if (documents.length > 0) {
      router.replace(`/editor/${documents[0].id}`);
    } else {
      create.mutate(
        { content: '# Untitled\n\n' },
        {
          onSuccess: (d) => router.replace(`/editor/${d.id}`),
          onError: () => {
            acted.current = false;
          },
        },
      );
    }
  }, [isLoading, documents, create, router]);

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <span className="rm-float">
          <LogoMark size={36} />
        </span>
        <span className="text-sm">Opening your workspace…</span>
      </div>
    </div>
  );
}
