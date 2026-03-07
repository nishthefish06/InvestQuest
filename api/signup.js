import { getDb } from './lib/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'investquest-secret-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

    const db = await getDb();
    const users = db.collection('users');

    const existing = await users.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    const result = await users.insertOne({
      username: username.toLowerCase(),
      displayName: username,
      passwordHash,
      gameState: null,
      createdAt: now,
      updatedAt: now,
    });

    const token = jwt.sign({ userId: result.insertedId, username: username.toLowerCase() }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, username: username, message: 'Account created!' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
