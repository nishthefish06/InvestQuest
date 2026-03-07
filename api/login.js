import { getDb } from './lib/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'investquest-secret-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const db = await getDb();
    const users = db.collection('users');

    const user = await users.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({ token, username: user.displayName, gameState: user.gameState });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
