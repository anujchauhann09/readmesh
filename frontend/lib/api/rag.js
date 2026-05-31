import { API_PREFIX, ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';

const { RAG } = ROUTES;
const path = (route) => `${RAG.BASE}${route}`;

const INGEST_TIMEOUT = 120_000;
const ASK_TIMEOUT = 90_000;

export const ingestRepoRequest = ({ url, ref, force }) =>
  apiClient
    .post(path(RAG.INGEST), { url, ...(ref ? { ref } : {}), ...(force ? { force } : {}) }, {
      timeout: INGEST_TIMEOUT,
    })
    .then((r) => r.data.data);

export const askRepoRequest = ({ url, ref, question }) =>
  apiClient
    .post(path(RAG.ASK), { url, ...(ref ? { ref } : {}), question }, { timeout: ASK_TIMEOUT })
    .then((r) => r.data.data);


const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? `http://localhost:8080${API_PREFIX}`;

export const askRepoStream = async (
  { url, ref, question },
  { onSources, onDelta, signal } = {},
) => {
  const res = await fetch(`${baseURL}${path(RAG.ASK_STREAM)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, ...(ref ? { ref } : {}), question }),
    signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message || `Request failed (${res.status})`);
  }

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
    else if (event.type === 'error') throw new Error(event.message || 'Streaming failed');
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) handleFrame(frame);
  }
  if (buffer.trim()) handleFrame(buffer);
};
