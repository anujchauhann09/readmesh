import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import * as savedRepoService from './savedRepo.service.js';

export const save = asyncHandler(async (req, res) => {
  const repo = await savedRepoService.saveRepo(req.user.publicId, req.validated.body);
  sendSuccess(res, { statusCode: 201, message: 'Repository saved', data: { repo } });
});

export const list = asyncHandler(async (req, res) => {
  const { repos, meta } = await savedRepoService.listSavedRepos(
    req.user.publicId,
    req.validated.query,
  );
  sendSuccess(res, { data: { repos }, meta });
});

export const remove = asyncHandler(async (req, res) => {
  await savedRepoService.removeSavedRepo(req.user.publicId, req.validated.params.id);
  sendSuccess(res, { message: 'Repository removed', data: null });
});
