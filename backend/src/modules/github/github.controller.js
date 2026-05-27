import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import * as githubService from './github.service.js';

export const resolveUrl = asyncHandler(async (req, res) => {
  const data = githubService.resolve(req.validated.body.url);
  sendSuccess(res, { data });
});

export const loadRepo = asyncHandler(async (req, res) => {
  const { url, ref } = req.validated.body;
  const data = await githubService.loadRepo(url, ref);
  sendSuccess(res, { data });
});

export const getContent = asyncHandler(async (req, res) => {
  const { owner, repo, ref, path } = req.validated.query;
  const data = await githubService.getFileContent(owner, repo, ref, path);
  sendSuccess(res, { data });
});
