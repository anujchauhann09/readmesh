'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { askRepoStream } from '@/lib/api/rag';
import { listConversationsRequest, getConversationRequest } from '@/lib/api/chat';

const CONVERSATIONS_KEY = 'chat-conversations';

const toLocalMessage = (m) => ({
  role: m.role === 'ASSISTANT' ? 'assistant' : 'user',
  content: m.content,
  sources: m.sources ?? [],
});

/**
 * Repo-scoped chat backed by server-persisted threads.
 *
 * The server stores every turn and accepts a `conversationId` to continue one, so
 * the panel restores the most recent thread for the repo on open instead of
 * starting blank each time it mounts. Messages are still mirrored in local state
 * because streaming has to paint tokens as they arrive.
 */
export function useRepoChat({ url, ref, owner, name }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([]);
  const [isPending, setIsPending] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const conversationId = useRef(null);
  const abortRef = useRef(null);

  // Restore the newest thread for this repo. Keyed on the repo, not the open file,
  // so moving between files keeps the conversation.
  useEffect(() => {
    if (!owner || !name || !ref) return undefined;

    let cancelled = false;
    setIsRestoring(true);
    conversationId.current = null;
    setMessages([]);

    (async () => {
      try {
        const { items } = await listConversationsRequest({ owner, name, ref, limit: 1 });
        const latest = items?.[0];
        if (!latest || cancelled) return;

        const full = await getConversationRequest(latest.id);
        if (cancelled) return;
        conversationId.current = full.id;
        setMessages((full.messages ?? []).map(toLocalMessage));
      } catch {
        // A thread that cannot be restored is not worth blocking the panel over —
        // the user can simply ask a new question, which starts a fresh one.
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [owner, name, ref]);

  const patchLast = useCallback((patch) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
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
          { url, ref, question: q, conversationId: conversationId.current },
          {
            signal: controller.signal,
            onSources: (sources) => patchLast(() => ({ sources })),
            onDelta: (text) => patchLast((last) => ({ content: (last.content || '') + text })),
            onConversation: (conversation) => {
              conversationId.current = conversation?.id ?? conversationId.current;
              queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
            },
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
    [url, ref, isPending, patchLast, queryClient],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  /** Starts a new thread; the previous one stays saved and reachable server-side. */
  const reset = useCallback(() => {
    abortRef.current?.abort();
    conversationId.current = null;
    setMessages([]);
  }, []);

  return { messages, send, stop, reset, isPending, isRestoring };
}
