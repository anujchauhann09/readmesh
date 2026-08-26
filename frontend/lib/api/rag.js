import { ROUTES } from '@readmesh/shared';
import { apiClient, API_BASE_URL, refreshSession } from '@/lib/api-client';
import { unwrapData } from './envelope';

const { RAG } = ROUTES;
const path = (route) => `${RAG.BASE}${route}`;

const INGEST_TIMEOUT = 120_000;
const ASK_TIMEOUT = 90_000;
// A stream that stops producing tokens should fail, not hang the panel forever.
const STREAM_IDLE_TIMEOUT = 90_000;

const askBody = ({ url, ref, question, conversationId }) => ({
  url,
  question,
  ...(ref ? { ref } : {}),
  ...(conversationId ? { conversationId } : {}),
});

export const ingestRepoRequest = ({ url, ref, force }) =>
  apiClient
    .post(
      path(RAG.INGEST),
      { url, ...(ref ? { ref } : {}), ...(force ? { force } : {}) },
      { timeout: INGEST_TIMEOUT },
    )
    .then(unwrapData);

export const askRepoRequest = (params) =>
  apiClient.post(path(RAG.ASK), askBody(params), { timeout: ASK_TIMEOUT }).then(unwrapData);

const readErrorMessage = async (res) => {
  const data = await res.json().catch(() => null);
  const error = new Error(data?.error?.message || `Request failed (${res.status})`);
  error.code = data?.error?.code ?? 'STREAM_ERROR';
  error.status = res.status;
  return error;
};

const openStream = (params, signal) =>
  fetch(`${API_BASE_URL}${path(RAG.ASK_STREAM)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(askBody(params)),
    signal,
  });

/**
 * Streams a grounded answer over SSE.
 *
 * This is the one caller that cannot go through axios (it needs the response body
 * as a stream), so it re-implements the two things the interceptor would have done:
 * a single retry after refreshing an expired access token, and turning the error
 * envelope into a real Error. Without the refresh, a token expiring mid-session
 * turned the next question into a hard failure.
 */
export const askRepoStream = async (
  params,
  { onSources, onDelta, onConversation, signal } = {},
) => {
  let res = await openStream(params, signal);

  if (res.status === 401) {
    try {
      await refreshSession();
      res = await openStream(params, signal);
    } catch {
      throw await readErrorMessage(res);
    }
  }

  if (!res.ok || !res.body) throw await readErrorMessage(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleFrame = (frame) => {
    const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
    if (!dataLine) return;
    let event;
    try {
      event = JSON.parse(dataLine.slice(5).trim());
    } catch {
      return;
    }
    if (event.type === 'sources') onSources?.(event.sources ?? [], event.ref);
    else if (event.type === 'delta') onDelta?.(event.text ?? '');
    else if (event.type === 'conversation') onConversation?.(event.conversation);
    else if (event.type === 'error') throw new Error(event.message || 'Streaming failed');
  };

  // Races each read against an idle deadline; a silent upstream then rejects
  // instead of leaving the caller awaiting a chunk that never arrives.
  const readWithTimeout = () => {
    let timer;
    const idle = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('The AI stopped responding. Please try again.')),
        STREAM_IDLE_TIMEOUT,
      );
    });
    return Promise.race([reader.read(), idle]).finally(() => clearTimeout(timer));
  };

  try {
    for (;;) {
      const { done, value } = await readWithTimeout();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) handleFrame(frame);
    }
    if (buffer.trim()) handleFrame(buffer);
  } finally {
    // Releases the connection whether we finished, threw, or were aborted.
    reader.cancel().catch(() => {});
  }
};
