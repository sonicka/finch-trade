export class HttpError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export const notFoundHandler = (req, res, next) =>
  next(new HttpError(404, 'NOT_FOUND', 'Route not found'));

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const isUniqueViolation = error.code === '23505';
  const statusCode = isUniqueViolation
    ? 409
    : Number.isInteger(error.statusCode)
      ? error.statusCode
      : Number.isInteger(error.status)
        ? error.status
        : 500;
  const code = isUniqueViolation
    ? 'CONFLICT'
    : error.code || 'INTERNAL_SERVER_ERROR';
  const message = isUniqueViolation
    ? 'A record with these values already exists.'
    : statusCode >= 500
      ? 'Internal server error'
      : error.type === 'entity.too.large'
        ? 'Request body is too large.'
        : error.type === 'entity.parse.failed'
          ? 'Request body must contain valid JSON.'
          : error.message;

  if (statusCode >= 500) {
    console.error('Unhandled API error:', {
      method: req.method,
      path: req.originalUrl,
      code,
    });
  }

  return res.status(statusCode).json({ error: code, message });
};
