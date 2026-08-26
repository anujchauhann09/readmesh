import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../common/ApiError.js';
import { fetchWithTimeout, isAbortError } from '../utils/http.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 30_000;
// Streaming holds the connection open by design, so it gets a longer leash than
// a unary call — but still a finite one.
const STREAM_TIMEOUT_MS = 120_000;

// Calm, reassuring copy shown to users. The technical cause is logged separately
// so a raw "malformed data" / "AI provider error (503)" never reaches the UI.
const AI_BUSY = 'The AI is busy right now. Please try again in a moment.';
const AI_RETRY = 'The AI couldn’t finish that response. Please try again.';
const AI_TIMEOUT = 'The AI took too long to respond. Please try again.';
const AI_TRUNCATED =
  'The response was too long to finish. Try a shorter document or a narrower question.';

const providerErrorMessage = (status) => (status === 503 || status === 429 ? AI_BUSY : AI_RETRY);

export const isAiEnabled = () => Boolean(config.ai.geminiApiKey);

const requireKey = () => {
  if (!config.ai.geminiApiKey) {
    throw new ApiError(503, 'AI features are not configured on this server', {
      code: 'AI_UNAVAILABLE',
    });
  }
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const quotaError = (body) => {
  const details = body?.error?.details ?? [];
  const retryInfo = details.find((d) => String(d['@type'] ?? '').endsWith('RetryInfo'));
  const seconds = retryInfo?.retryDelay ? Number.parseInt(retryInfo.retryDelay, 10) : null;

  logger.warn(
    { scope: seconds ? 'rate' : 'quota', retryAfterSeconds: seconds ?? null },
    'Gemini rate/quota limit hit',
  );

  const message =
    seconds && seconds > 0
      ? `AI rate limit reached. Try again in ${seconds}s.`
      : 'AI daily free-tier quota reached. Please try again later.';

  return new ApiError(429, message, {
    code: 'TOO_MANY_REQUESTS',
    details: { retryAfterSeconds: seconds ?? null, scope: seconds ? 'rate' : 'quota' },
  });
};

const transportError = (err, scope) => {
  logger.warn({ scope, cause: err.name }, 'Gemini request failed');
  return ApiError.badGateway(isAbortError(err) ? AI_TIMEOUT : AI_BUSY);
};

export const generateContent = async ({
  prompt,
  system,
  json = false,
  schema,
  temperature = 0.3,
  maxOutputTokens = 2048,
}) => {
  requireKey();

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(json && { responseMimeType: 'application/json' }),
      ...(json && schema && { responseSchema: schema }),
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  let res;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/${config.ai.geminiModel}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.ai.geminiApiKey,
      },
      body: JSON.stringify(body),
      timeoutMs: TIMEOUT_MS,
    });
  } catch (err) {
    throw transportError(err, 'generateContent');
  }

  if (!res.ok) {
    if (res.status === 429) throw quotaError(await safeJson(res));
    logger.warn({ status: res.status, scope: 'generateContent' }, 'Gemini provider error');
    throw ApiError.badGateway(providerErrorMessage(res.status));
  }

  const data = await res.json();

  const blockReason = data.promptFeedback?.blockReason;
  if (blockReason) {
    throw new ApiError(422, 'Content was blocked by the AI safety filters', { code: 'AI_BLOCKED' });
  }

  const candidate = data.candidates?.[0];
  const finish = candidate?.finishReason;
  if (!candidate || finish === 'SAFETY' || finish === 'RECITATION') {
    throw new ApiError(422, 'The AI could not generate a response for this content', {
      code: 'AI_NO_OUTPUT',
    });
  }

  const text = (candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  // Hitting the output cap yields a half-finished answer. Prose is still useful
  // (the caller can show it with a truncation notice); JSON is not — it will not
  // parse — so that case is reported as its own actionable error.
  if (finish === 'MAX_TOKENS') {
    logger.warn({ scope: 'generateContent', json }, 'Gemini hit the output token cap');
    if (json || !text) {
      throw new ApiError(422, AI_TRUNCATED, { code: 'AI_TRUNCATED' });
    }
    return text;
  }

  if (!text) {
    logger.warn(
      { scope: 'generateContent', finishReason: finish },
      'Gemini returned an empty response',
    );
    throw ApiError.badGateway(AI_RETRY);
  }
  if (!json) return text;

  try {
    return JSON.parse(text);
  } catch {
    logger.warn(
      { scope: 'generateContent', finishReason: finish, preview: text.slice(0, 200) },
      'Gemini returned non-JSON output',
    );
    throw ApiError.badGateway(AI_RETRY);
  }
};

export async function* generateContentStream({
  prompt,
  system,
  temperature = 0.3,
  maxOutputTokens = 2048,
  signal,
}) {
  requireKey();

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  let res;
  try {
    res = await fetchWithTimeout(
      `${BASE_URL}/${config.ai.geminiModel}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.ai.geminiApiKey },
        body: JSON.stringify(body),
        timeoutMs: STREAM_TIMEOUT_MS,
        signal,
      },
    );
  } catch (err) {
    if (signal?.aborted) return;
    throw transportError(err, 'generateContentStream');
  }

  if (!res.ok) {
    if (res.status === 429) throw quotaError(await safeJson(res));
    logger.warn({ status: res.status, scope: 'generateContentStream' }, 'Gemini provider error');
    throw ApiError.badGateway(providerErrorMessage(res.status));
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for await (const part of res.body) {
      buffer += decoder.decode(part, { stream: true });
      const frames = buffer.split('\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        const line = frame.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        let json;
        try {
          json = JSON.parse(payload);
        } catch {
          continue;
        }
        const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
        if (text) yield text;
      }
    }
  } catch (err) {
    if (signal?.aborted || isAbortError(err)) return;
    throw err;
  }
}

const embedOne = async (text, taskType) => {
  let res;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/${config.ai.embedModel}:embedContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.ai.geminiApiKey },
      body: JSON.stringify({
        model: `models/${config.ai.embedModel}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: config.ai.embedDimension,
      }),
      timeoutMs: TIMEOUT_MS,
    });
  } catch (err) {
    throw transportError(err, 'embed');
  }

  if (!res.ok) {
    if (res.status === 429) throw quotaError(await safeJson(res));
    logger.warn({ status: res.status, scope: 'embed' }, 'Embedding provider error');
    throw ApiError.badGateway(providerErrorMessage(res.status));
  }

  const data = await res.json();
  const values = data.embedding?.values;
  if (!Array.isArray(values)) {
    logger.warn({ scope: 'embed' }, 'Embedding provider returned an unexpected response');
    throw ApiError.badGateway(AI_RETRY);
  }
  return values;
};

export const embedTexts = async (
  texts,
  { taskType = 'RETRIEVAL_DOCUMENT', concurrency = 5 } = {},
) => {
  requireKey();
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const vectors = new Array(texts.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < texts.length) {
      const i = cursor;
      cursor += 1;
      vectors[i] = await embedOne(texts[i], taskType);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, texts.length) }, worker));
  return vectors;
};
