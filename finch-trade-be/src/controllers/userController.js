import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/db.js';
import dotenv from 'dotenv';
import { queryOne, runQuery } from '../utils.js';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const signUp = async (req, res) => {
  const { email, username, birbName, friendCode, password } = req.body;

  if (!email || !username || !birbName || !friendCode || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if email already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );

    if (existingUser) {
      return res.status(400).json({ message: 'Email already taken' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await runQuery(
      'INSERT INTO users (email, username, birb_name, friend_code, password) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [email, username, birbName, friendCode, hashedPassword],
    );

    const id = result.lastID;
    const token = jwt.sign(
      { id, email, username, birbName, friendCode },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.status(201).json({ token });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Get user by email
    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
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
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const getUserFromDB = (req, res) => {
  const { userId } = req.params;

  db.all(
    'SELECT id, username, birb_name AS "birbName", friend_code AS "friendCode" FROM users WHERE id = $1',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ message: 'Failed to retrieve the user' });
      }

      if (rows.length === 1) {
        res.json(rows[0]);
      } else if (rows.length === 0) {
        res.status(404).json({ message: 'User not found' });
      } else {
        console.warn(`Unexpected multiple users with id ${userId}:`, rows);
        res.status(500).json({
          message:
            'Database inconsistency: multiple users found with the same id',
        });
      }
    },
  );
};

export const editUser = async (req, res) => {
  const { userId } = req.params;
  const { email, password, passwordAgain } = req.body;

  if (userId !== req.userId) {
    return res
      .status(403)
      .json({ message: 'You can only edit your own account.' });
  }

  try {
    if (password && password !== passwordAgain)
      return res.status(400).json({ message: 'Passwords do not match' });

    const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (email && email !== user.email) {
      const existing = await queryOne(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId],
      );
      if (existing)
        return res.status(400).json({ message: 'Email already in use.' });
    }

    let newHashedPassword = user.password;
    let hasChanged = false;

    if (password) {
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (!isSamePassword) {
        newHashedPassword = await bcrypt.hash(password, 10);
        hasChanged = true;
      }
    }
    if (email && email !== user.email) {
      hasChanged = true;
    }
    if (!hasChanged) {
      return res.status(200).json({ message: 'No changes made.' });
    }

    const newEmail = email || user.email;

    const query = `UPDATE users SET email = $1, password = $2 WHERE id = $3`;
    await runQuery(query, [newEmail, newHashedPassword, userId]);
    return res.status(200).json({
      message: 'User updated successfully.',
      updatedId: userId,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
