import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import * as ragService from './rag.service.js';

export const ingest = asyncHandler(async (req, res) => {
  const { url, ref, force } = req.validated.body;
  const data = await ragService.ingestRepo(url, ref, { force });
  sendSuccess(res, { message: data.skipped ? 'Already indexed' : 'Repository indexed', data });
});

export const ask = asyncHandler(async (req, res) => {
  const { url, ref, question } = req.validated.body;
  const data = await ragService.askRepo(url, question, ref);
  sendSuccess(res, { data });
});

export const askStream = asyncHandler(async (req, res) => {
  const { url, ref, question } = req.validated.body;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  const controller = new AbortController();
  res.on('close', () => controller.abort());

  try {
    for await (const event of ragService.askRepoStream(url, question, ref, {
      signal: controller.signal,
    })) {
      send(event);
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
