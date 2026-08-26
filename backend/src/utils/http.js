import { ApiError } from '../common/ApiError.js';

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * `fetch` with a hard deadline. A bare fetch has no timeout, so one slow upstream
 * can pin a request (and, during RAG ingestion, a dozen of them) open indefinitely.
 *
 * Caller-supplied signals are honoured alongside the deadline, so an aborted
 * client request still tears the upstream call down.
 */
export const fetchWithTimeout = async (
  url,
  { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...init } = {},
) => {
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
};

/** True when a rejection came from our deadline (or a caller abort), not the network. */
export const isAbortError = (error) => error?.name === 'AbortError';

export const upstreamError = (error, service) =>
  ApiError.badGateway(
    isAbortError(error) ? `${service} took too long to respond` : `Could not reach ${service}`,
  );
