import { ApiError } from '../common/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { ACCESS_COOKIE } from '../utils/cookies.js';


export const authenticate = (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return next(ApiError.unauthorized('Authentication required'));

  try {
    const payload = verifyAccessToken(token);
    req.user = { publicId: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired access token'));
  }
};

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    return next();
  };
