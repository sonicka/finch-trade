import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/db.js';
import dotenv from 'dotenv';
import { queryOne, runQuery } from '../utils.js';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const signUp = (req, res) => {
  const { email, username, birbName, friendCode, password } = req.body;

  if (!email || !username || !birbName || !friendCode || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (row) {
        return res.status(400).json({ message: 'Email already taken' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        'INSERT INTO users (email, username, birb_name, friend_code, password) VALUES (?, ?, ?, ?, ?)',
        [email, username, birbName, friendCode, hashedPassword],
        function (err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating user' });
          }
          const id = this.lastID;
          const token = jwt.sign(
            { id, email, username, birbName, friendCode },
            JWT_SECRET,
            { expiresIn: '1h' },
          );
          res.status(201).json({ token });
        },
      );
    });
  } catch {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
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
          { expiresIn: '1h' },
        );
        res.status(200).json({ token });
      },
    );
  } catch {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const getUserFromDB = (req, res) => {
  const { userId } = req.params;

  db.all(
    'SELECT id, username, birb_name as birbName, friend_code as friendCode FROM users WHERE id = ?', // todo id?
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ error: 'Failed to retrieve the user' });
      }

      if (rows.length === 1) {
        res.json(rows[0]);
      } else if (rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        console.warn(`Unexpected multiple users with id ${userId}:`, rows);
        res.status(500).json({
          error:
            'Database inconsistency: multiple users found with the same id',
        });
      }
    },
  );
};

export const editUser = async (req, res) => {
  const { userId } = req.params;
  const { email, password, passwordAgain } = req.body;

  try {
    if (password && password !== passwordAgain)
      return res.status(400).json({ error: 'Passwords do not match' });

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (email && email !== user.email) {
      const existing = await queryOne(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId],
      );
      if (existing)
        return res.status(400).json({ error: 'Email already in use.' });
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

    const query = `UPDATE users SET email = ?, password = ? WHERE id = ?`;
    await runQuery(query, [newEmail, newHashedPassword, userId]);
    return res.status(200).json({
      message: 'User updated successfully.',
      updatedId: userId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
