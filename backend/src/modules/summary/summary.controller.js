import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import * as summaryService from './summary.service.js';

export const tldr = asyncHandler(async (req, res) => {
  const { content, repoName } = req.validated.body;
  const data = await summaryService.summarize(content, { repoName });
  sendSuccess(res, { data });
});

export const commands = asyncHandler(async (req, res) => {
  const data = await summaryService.extractCommands(req.validated.body.content);
  sendSuccess(res, { data });
});

export const beginner = asyncHandler(async (req, res) => {
  const data = await summaryService.beginnerMode(req.validated.body.content);
  sendSuccess(res, { data });
});

export const translate = asyncHandler(async (req, res) => {
  const { content, language } = req.validated.body;
  const data = await summaryService.translateContent(content, language);
  sendSuccess(res, { data });
});
