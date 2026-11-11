import { rateLimit } from 'express-rate-limit';

const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT = 10;
const SIGNUP_RATE_LIMIT = 5;

const createAuthRateLimit = (limit) =>
  rateLimit({
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      }),
  });

export const loginRateLimit = createAuthRateLimit(LOGIN_RATE_LIMIT);
export const signUpRateLimit = createAuthRateLimit(SIGNUP_RATE_LIMIT);
