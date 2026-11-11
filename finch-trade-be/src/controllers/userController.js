import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, runQuery } from '../utils.js';
import { requireJwtSecret } from '../config/env.js';
import { asyncHandler, HttpError } from '../errors.js';

const JWT_SECRET = requireJwtSecret();
const MAX_EMAIL_LENGTH = 254;
const MAX_PROFILE_FIELD_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeEmail = (value) => {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (
    email.length > MAX_EMAIL_LENGTH ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return null;
  }
  return email;
};

const normalizeProfileField = (value) => {
  if (typeof value !== 'string') return null;
  const field = value.trim();
  return field.length > 0 && field.length <= MAX_PROFILE_FIELD_LENGTH
    ? field
    : null;
};

const isValidPassword = (value) =>
  typeof value === 'string' &&
  value.length >= MIN_PASSWORD_LENGTH &&
  Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES;

const isUniqueViolation = (error) => error?.code === '23505';

// Validates signup details, prevents duplicate accounts, hashes the password,
// and returns a signed token for the new user.
export const signUp = asyncHandler(async (req, res) => {
  const body = isRecord(req.body) ? req.body : {};
  const email = normalizeEmail(body.email);
  const username = normalizeProfileField(body.username);
  const birbName = normalizeProfileField(body.birbName);
  const friendCode = normalizeProfileField(body.friendCode);

  if (!email || !username || !birbName || !friendCode || !body.password) {
    return res.status(400).json({
      message: 'Enter a valid email, profile details, and password.',
    });
  }
  if (!isValidPassword(body.password)) {
    return res.status(400).json({
      message:
        'Password must be at least 8 characters and no more than 72 bytes.',
    });
  }

  try {
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE LOWER(email) = $1 OR friend_code = $2',
      [email, friendCode],
    );
    if (existingUser) {
      throw new HttpError(
        409,
        'ACCOUNT_CONFLICT',
        'Email or friend code is already in use.',
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const result = await runQuery(
      'INSERT INTO users (email, username, birb_name, friend_code, password) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [email, username, birbName, friendCode, hashedPassword],
    );
    const token = jwt.sign(
      { id: result.lastID, email, username, birbName, friendCode },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.status(201).json({ token });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(
        409,
        'ACCOUNT_CONFLICT',
        'Email or friend code is already in use.',
      );
    }
    throw error;
  }
});

// Authenticates credentials and returns a token without disclosing which
// credential was invalid.
export const login = asyncHandler(async (req, res) => {
  const body = isRecord(req.body) ? req.body : {};
  const email = normalizeEmail(body.email);
  if (
    !email ||
    typeof body.password !== 'string' ||
    body.password.length === 0
  ) {
    return res
      .status(400)
      .json({ message: 'Enter a valid email and password.' });
  }
  if (Buffer.byteLength(body.password, 'utf8') > MAX_PASSWORD_BYTES) {
    return res.status(400).json({ message: 'Invalid email or password.' });
  }

  const user = await queryOne(
    `SELECT id, email, username, birb_name, friend_code, password
     FROM users
     WHERE LOWER(email) = $1`,
    [email],
  );
  if (!user || !(await bcrypt.compare(body.password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      birbName: user.birb_name,
      friendCode: user.friend_code,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

  return res.status(200).json({ token });
});

// Returns the public profile fields for the user identified by the route ID.
export const getUserFromDB = asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return res.status(400).json({ message: 'Invalid user id.' });
  }

  const user = await queryOne(
    'SELECT id, username, birb_name AS "birbName", friend_code AS "friendCode" FROM users WHERE id = $1',
    [userId],
  );
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json(user);
});

// Allows an authenticated user to update their own email and/or password.
export const editUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (userId !== req.userId) {
    return res
      .status(403)
      .json({ message: 'You can only edit your own account.' });
  }

  const body = isRecord(req.body) ? req.body : {};
  let email;
  if (body.email !== undefined) {
    email = normalizeEmail(body.email);
    if (!email) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
  }
  if (body.password !== undefined) {
    if (!isValidPassword(body.password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and no more than 72 bytes.',
      });
    }
    if (body.password !== body.passwordAgain) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
  } else if (body.passwordAgain !== undefined) {
    return res
      .status(400)
      .json({ message: 'Enter a new password to confirm.' });
  }

  const user = await queryOne(
    'SELECT id, email, password FROM users WHERE id = $1',
    [userId],
  );
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const emailChanged =
    email !== undefined && email !== user.email.toLowerCase();
  if (emailChanged) {
    const existing = await queryOne(
      'SELECT id FROM users WHERE LOWER(email) = $1 AND id <> $2',
      [email, userId],
    );
    if (existing) {
      return res.status(409).json({
        message: 'Email is already in use.',
      });
    }
  }

  let newHashedPassword = user.password;
  let passwordChanged = false;
  if (body.password !== undefined) {
    const isSamePassword = await bcrypt.compare(body.password, user.password);
    if (!isSamePassword) {
      newHashedPassword = await bcrypt.hash(body.password, 10);
      passwordChanged = true;
    }
  }
  if (!emailChanged && !passwordChanged) {
    return res.status(200).json({ message: 'No changes made.' });
  }

  try {
    await runQuery('UPDATE users SET email = $1, password = $2 WHERE id = $3', [
      emailChanged ? email : user.email,
      newHashedPassword,
      userId,
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, 'EMAIL_CONFLICT', 'Email is already in use.');
    }
    throw error;
  }

  return res.status(200).json({
    message: 'User updated successfully.',
    updatedId: userId,
  });
});
