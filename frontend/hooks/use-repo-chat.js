'use client';

import { useCallback, useRef, useState } from 'react';
import { askRepoStream } from '@/lib/api/rag';

export function useRepoChat({ url, ref }) {
  const [messages, setMessages] = useState([]);
  const [isPending, setIsPending] = useState(false);
  const abortRef = useRef(null);

  const patchLast = useCallback((patch) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, ...patch(last) };
      return next;
    });
  }, []);

  const send = useCallback(
    async (question) => {
      const q = question.trim();
      if (!q || isPending) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setIsPending(true);
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: q },
        { role: 'assistant', content: '', sources: [], streaming: true },
      ]);

      try {
        await askRepoStream(
          { url, ref, question: q },
          {
            signal: controller.signal,
            onSources: (sources) => patchLast(() => ({ sources })),
            onDelta: (text) => patchLast((last) => ({ content: (last.content || '') + text })),
          },
        );
        patchLast(() => ({ streaming: false }));
      } catch (error) {
        if (controller.signal.aborted) {
          patchLast(() => ({ streaming: false }));
        } else {
          patchLast((last) => ({
            role: 'error',
            streaming: false,
            content: last.content || error.message || 'Something went wrong.',
          }));
        }
      } finally {
        setIsPending(false);
        abortRef.current = null;
      }
    },
    [url, ref, isPending, patchLast],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  return { messages, send, stop, reset, isPending };
}
