'use client';

import { useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

export function Mermaid({ code }) {
  const { resolvedTheme } = useTheme();
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
        });
        const { svg: out } = await mermaid.render(`mmd-${rawId}`, code);
        if (!cancelled) {
          setSvg(out);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to render diagram');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, rawId, resolvedTheme]);

  if (error) {
    return (
      <pre className="my-4 overflow-x-auto rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="my-4 flex justify-center overflow-x-auto rounded-lg border border-border bg-card p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
