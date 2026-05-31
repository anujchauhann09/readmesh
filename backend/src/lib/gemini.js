import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../common/ApiError.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 30_000;

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

  logger.warn({ scope: seconds ? 'rate' : 'quota', retryAfterSeconds: seconds ?? null }, 'Gemini rate/quota limit hit');

  const message =
    seconds && seconds > 0
      ? `AI rate limit reached. Try again in ${seconds}s.`
      : 'AI daily free-tier quota reached. Please try again later.';

  return new ApiError(429, message, {
    code: 'TOO_MANY_REQUESTS',
    details: { retryAfterSeconds: seconds ?? null, scope: seconds ? 'rate' : 'quota' },
  });
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE_URL}/${config.ai.geminiModel}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.ai.geminiApiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw ApiError.badGateway(
      err.name === 'AbortError' ? 'AI request timed out' : 'Could not reach the AI provider',
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    if (res.status === 429) throw quotaError(await safeJson(res));
    throw ApiError.badGateway(`AI provider error (${res.status})`);
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

  if (!text) throw ApiError.badGateway('The AI returned an empty response');
  if (!json) return text;

  try {
    return JSON.parse(text);
  } catch {
    throw ApiError.badGateway('The AI returned malformed data');
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
    res = await fetch(`${BASE_URL}/${config.ai.geminiModel}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.ai.geminiApiKey },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') return;
    throw ApiError.badGateway('Could not reach the AI provider');
  }

  if (!res.ok) {
    if (res.status === 429) throw quotaError(await safeJson(res));
    throw ApiError.badGateway(`AI provider error (${res.status})`);
  }

  const decoder = new TextDecoder();
  let buffer = '';

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
      const text = (json.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? '')
        .join('');
      if (text) yield text;
    }
  }
}

const embedOne = async (text, taskType) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE_URL}/${config.ai.embedModel}:embedContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.ai.geminiApiKey },
      body: JSON.stringify({
        model: `models/${config.ai.embedModel}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: config.ai.embedDimension,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    throw ApiError.badGateway(
      err.name === 'AbortError' ? 'Embedding request timed out' : 'Could not reach the AI provider',
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    if (res.status === 429) throw quotaError(await safeJson(res));
    throw ApiError.badGateway(`Embedding provider error (${res.status})`);
  }

  const data = await res.json();
  const values = data.embedding?.values;
  if (!Array.isArray(values)) {
    throw ApiError.badGateway('Embedding provider returned an unexpected response');
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
