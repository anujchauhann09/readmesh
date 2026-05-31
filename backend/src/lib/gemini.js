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
