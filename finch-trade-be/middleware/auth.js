import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

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
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    req.user = decoded;
    req.userId = String(decoded.id);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
