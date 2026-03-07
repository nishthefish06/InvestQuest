import { getDb } from './lib/db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'investquest-secret-2026';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);

    const db = await getDb();
    const user = await db.collection('users').findOne({ username: decoded.username });
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ username: user.displayName, gameState: user.gameState });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.error('Session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
