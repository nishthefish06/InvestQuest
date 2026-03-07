import { getDb } from './lib/db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'investquest-secret-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const { gameState } = req.body;
    if (!gameState) return res.status(400).json({ error: 'No game state provided' });

    const db = await getDb();
    await db.collection('users').updateOne(
      { username: decoded.username },
      { $set: { gameState, updatedAt: new Date() } }
    );

    res.status(200).json({ ok: true });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    console.error('Save error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
