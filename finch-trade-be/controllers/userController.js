import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/db.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const signUp = (req, res) => {
  const { email, username, birbName, friendCode, password } = req.body;

  if (!email || !username || !birbName || !friendCode || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      if (row) {
        return res.status(400).json({ message: "Email already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        "INSERT INTO users (email, username, birbName, friendCode, password) VALUES (?, ?, ?, ?, ?)",
        [email, username, birbName, friendCode, hashedPassword],
        function (err) {
          if (err) {
            return res.status(500).json({ message: "Error creating use" });
          }
          const token = jwt.sign(
            { email, username, birbName, friendCode },
            JWT_SECRET,
            { expiresIn: "1h" }
          );
          res.status(201).json({ token });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    db.get(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ message: "Database error" });
        }

        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign(
          {
            email: user.email,
            username: user.username,
            birbName: user.birbName,
          },
          JWT_SECRET,
          { expiresIn: "1h" }
        );
        res.status(200).json({ token });
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
