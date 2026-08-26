import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import { parseGithubUrl } from '../github/github.url.js';
import * as chatService from '../chat/chat.service.js';
import * as ragService from './rag.service.js';

/**
 * Resolves the thread a question belongs to.
 *
 * A continuing thread is opened up front because its history shapes the prompt; a
 * new one is created afterwards, once retrieval has resolved which ref the answer
 * actually came from, so the thread is filed against a real branch rather than
 * whatever the caller happened to type.
 */
const openExisting = (req, conversationId, question) =>
  conversationId
    ? chatService.openThread(req.user.publicId, { conversationId, question })
    : Promise.resolve(null);

const startThread = (req, url, ref, question) => {
  const { owner, repo } = parseGithubUrl(url);
  return chatService.openThread(req.user.publicId, {
    repo: { owner, name: repo, ref },
    question,
  });
};

export const ingest = asyncHandler(async (req, res) => {
  const { url, ref, force } = req.validated.body;
  const data = await ragService.ingestRepo(url, ref, { force });
  sendSuccess(res, { message: data.skipped ? 'Already indexed' : 'Repository indexed', data });
});

export const ask = asyncHandler(async (req, res) => {
  const { url, ref, question, conversationId } = req.validated.body;

  const existing = await openExisting(req, conversationId, question);
  const answer = await ragService.askRepo(url, question, ref, {
    history: existing?.history ?? [],
  });

  const thread = existing ?? (await startThread(req, url, answer.ref, question));
  await chatService.recordTurn(thread.id, {
    question,
    answer: answer.answer,
    sources: answer.sources,
  });

  sendSuccess(res, { data: { ...answer, conversation: thread.conversation } });
});

export const askStream = asyncHandler(async (req, res) => {
  const { url, ref, question, conversationId } = req.validated.body;

  // Ownership and thread lookup happen before the response is committed, so a bad
  // conversation id is still a clean JSON error rather than an SSE error frame.
  const existing = await openExisting(req, conversationId, question);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  const controller = new AbortController();
  res.on('close', () => controller.abort());

  let answer = '';
  let sources = [];
  let resolvedRef = ref;

  try {
    for await (const event of ragService.askRepoStream(url, question, ref, {
      signal: controller.signal,
      history: existing?.history ?? [],
    })) {
      if (event.type === 'sources') {
        sources = event.sources;
        resolvedRef = event.ref;
      }
      if (event.type === 'delta') answer += event.text;
      send(event);
    }

    // Persist only a completed answer: a half-streamed turn saved as history would
    // be replayed as context on the next question.
    if (answer.trim()) {
      const thread = existing ?? (await startThread(req, url, resolvedRef, question));
      await chatService.recordTurn(thread.id, { question, answer, sources });
      send({ type: 'conversation', conversation: thread.conversation });
    }
  } catch (err) {
    if (!controller.signal.aborted) {
      req.log?.error({ err }, 'RAG stream failed');
      send({ type: 'error', message: err.message || 'Streaming failed' });
    }
  } finally {
    res.end();
  }
});
