import { ApiError } from '../common/ApiError.js';

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    return next(ApiError.badRequest('Validation failed', result.error.flatten()));
  }

  req.validated = result.data;
  return next();
};
