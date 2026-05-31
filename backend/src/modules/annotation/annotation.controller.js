import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import * as annotationService from './annotation.service.js';

export const create = asyncHandler(async (req, res) => {
  const annotation = await annotationService.createAnnotation(req.user.publicId, req.validated.body);
  sendSuccess(res, { statusCode: 201, message: 'Annotation saved', data: { annotation } });
});

export const list = asyncHandler(async (req, res) => {
  const annotations = await annotationService.listAnnotations(req.user.publicId, req.validated.query);
  sendSuccess(res, { data: { annotations } });
});

export const update = asyncHandler(async (req, res) => {
  const annotation = await annotationService.updateAnnotation(
    req.user.publicId,
    req.validated.params.id,
    req.validated.body,
  );
  sendSuccess(res, { message: 'Annotation updated', data: { annotation } });
});

export const remove = asyncHandler(async (req, res) => {
  await annotationService.deleteAnnotation(req.user.publicId, req.validated.params.id);
  sendSuccess(res, { message: 'Annotation deleted', data: null });
});
