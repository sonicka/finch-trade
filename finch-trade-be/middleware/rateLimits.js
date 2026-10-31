import { rateLimit } from 'express-rate-limit';

const createAuthRateLimit = (limit) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      }),
  });

export const loginRateLimit = createAuthRateLimit(10);
export const signUpRateLimit = createAuthRateLimit(5);
