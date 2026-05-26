export const sendSuccess = (res, { statusCode = 200, data = null, message, meta } = {}) =>
  res.status(statusCode).json({
    success: true,
    ...(message !== undefined && { message }),
    data,
    ...(meta !== undefined && { meta }),
  });
