import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import * as documentService from './document.service.js';

export const create = asyncHandler(async (req, res) => {
  const document = await documentService.createDocument(req.user.publicId, req.validated.body);
  sendSuccess(res, { statusCode: 201, message: 'Document created', data: { document } });
});

export const list = asyncHandler(async (req, res) => {
  const documents = await documentService.listDocuments(req.user.publicId);
  sendSuccess(res, { data: { documents } });
});

export const get = asyncHandler(async (req, res) => {
  const document = await documentService.getDocument(req.user.publicId, req.validated.params.id);
  sendSuccess(res, { data: { document } });
});

export const update = asyncHandler(async (req, res) => {
  const document = await documentService.updateDocument(
    req.user.publicId,
    req.validated.params.id,
    req.validated.body,
  );
  sendSuccess(res, { message: 'Document saved', data: { document } });
});

export const remove = asyncHandler(async (req, res) => {
  await documentService.deleteDocument(req.user.publicId, req.validated.params.id);
  sendSuccess(res, { message: 'Document deleted', data: null });
});
