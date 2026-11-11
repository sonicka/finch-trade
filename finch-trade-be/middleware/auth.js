import jwt from 'jsonwebtoken';
import { requireJwtSecret } from '../src/config/env.js';

const JWT_SECRET = requireJwtSecret();

/**
 * Verifies the Authorization: Bearer <token> header and attaches the
 * decoded payload to req.user (and req.userId for convenience).
 * Rejects the request with 401 if the token is missing or invalid.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (
      typeof decoded !== 'object' ||
      !Number.isSafeInteger(Number(decoded.id)) ||
      Number(decoded.id) < 1
    ) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    req.user = decoded;
    req.userId = String(decoded.id);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
