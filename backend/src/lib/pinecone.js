import { config } from '../config/env.js';
import { ApiError } from '../common/ApiError.js';
import { fetchWithTimeout, isAbortError } from '../utils/http.js';

const CONTROL_PLANE = 'https://api.pinecone.io';
const TIMEOUT_MS = 20_000;

export const isPineconeEnabled = () => Boolean(config.ai.pinecone.apiKey);

const requireEnabled = () => {
  if (!config.ai.pinecone.apiKey) {
    throw new ApiError(503, 'Vector search is not configured on this server', {
      code: 'RAG_UNAVAILABLE',
    });
  }
};

const request = async (url, { method = 'POST', body } = {}) => {
  let res;
  try {
    res = await fetchWithTimeout(url, {
      method,
      headers: {
        'Api-Key': config.ai.pinecone.apiKey,
        'Content-Type': 'application/json',
        'X-Pinecone-API-Version': '2025-01',
      },
      ...(body && { body: JSON.stringify(body) }),
      timeoutMs: TIMEOUT_MS,
    });
  } catch (err) {
    throw ApiError.badGateway(
      isAbortError(err) ? 'Vector DB request timed out' : 'Could not reach the vector DB',
    );
  }

  if (!res.ok) {
    if (res.status === 429) throw ApiError.tooManyRequests('Vector DB rate limit reached.');
    if (res.status === 404) throw ApiError.notFound('Vector index not found');
    throw ApiError.badGateway(`Vector DB error (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
};

let hostPromise = null;
const dataPlaneHost = () => {
  if (config.ai.pinecone.host) return Promise.resolve(config.ai.pinecone.host);
  if (!hostPromise) {
    hostPromise = request(`${CONTROL_PLANE}/indexes/${config.ai.pinecone.index}`, {
      method: 'GET',
    })
      .then((info) => {
        if (!info?.host) throw ApiError.badGateway('Vector index has no host');
        return info.host;
      })
      .catch((err) => {
        hostPromise = null;
        throw err;
      });
  }
  return hostPromise;
};

const dataUrl = async (path) => `https://${await dataPlaneHost()}${path}`;

export const upsertVectors = async (namespace, vectors) => {
  requireEnabled();
  if (vectors.length === 0) return;
  await request(await dataUrl('/vectors/upsert'), { body: { namespace, vectors } });
};

export const queryVectors = async (namespace, vector, { topK = 8, filter } = {}) => {
  requireEnabled();
  const result = await request(await dataUrl('/query'), {
    body: { namespace, vector, topK, includeMetadata: true, ...(filter && { filter }) },
  });
  return result?.matches ?? [];
};

/**
 * Reads specific vectors by id. Used to read the namespace's fingerprint sentinel,
 * which is how ingestion knows whether an existing index is still current.
 */
export const fetchVectors = async (namespace, ids) => {
  requireEnabled();
  const params = new URLSearchParams({ namespace });
  ids.forEach((id) => params.append('ids', id));
  try {
    const result = await request(await dataUrl(`/vectors/fetch?${params.toString()}`), {
      method: 'GET',
    });
    return result?.vectors ?? {};
  } catch (err) {
    // An index that has never seen this namespace is not an error here.
    if (err.statusCode === 404) return {};
    throw err;
  }
};

export const deleteNamespace = async (namespace) => {
  requireEnabled();
  try {
    await request(await dataUrl('/vectors/delete'), { body: { namespace, deleteAll: true } });
  } catch (err) {
    if (err.statusCode !== 404) throw err;
  }
};

export const namespaceStats = async (namespace) => {
  requireEnabled();
  const stats = await request(await dataUrl('/describe_index_stats'), { body: {} });
  return stats?.namespaces?.[namespace] ?? null;
};
