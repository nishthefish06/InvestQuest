import { getDb } from '../lib/db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'investquest-secret-2026';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Authenticate user
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);

    const { q } = req.query; // q = username to search
    if (!q) return res.status(400).json({ error: 'Missing search query' });

    // Cannot search for yourself
    if (q.toLowerCase() === decoded.username.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot search for yourself' });
    }

    const db = await getDb();
    
    // Exact or case-insensitive match for username
    const targetUser = await db.collection('users').findOne({ 
      username: { $regex: new RegExp(`^${q}$`, 'i') } 
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return public safe profile data
    const publicProfile = {
      username: targetUser.username,
      level: targetUser.gameState?.level || 1,
      xp: targetUser.gameState?.xp || 0,
      streak: targetUser.gameState?.streak || 0,
    };

    res.status(200).json({ user: publicProfile });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
