import { getDb } from './lib/db.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'investquest-secret-2026';

function auth(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) throw Object.assign(new Error('Not authenticated'), { status: 401 });
  return jwt.verify(h.split(' ')[1], JWT_SECRET);
}

export default async function handler(req, res) {
  try {
    const decoded = auth(req);
    const username = decoded.username;
    const db = await getDb();
    const { action } = req.query;

    // POST /api/challenge?action=send
    if (req.method === 'POST' && action === 'send') {
      const { targetUsername, matchId } = req.body;
      if (!targetUsername || !matchId) return res.status(400).json({ error: 'Missing params' });
      await db.collection('challenges').deleteMany({ from: username, to: targetUsername, status: 'pending' });
      await db.collection('challenges').insertOne({
        from: username, to: targetUsername, matchId, status: 'pending', createdAt: new Date(),
      });
      return res.status(200).json({ ok: true, matchId });
    }

    // GET /api/challenge?action=incoming
    if (req.method === 'GET' && action === 'incoming') {
      const since = new Date(Date.now() - 5 * 60 * 1000);
      const challenge = await db.collection('challenges').findOne(
        { to: username, status: 'pending', createdAt: { $gte: since } },
        { sort: { createdAt: -1 } }
      );
      if (!challenge) return res.status(200).json({ challenge: null });
      return res.status(200).json({ challenge: { from: challenge.from, matchId: challenge.matchId, _id: String(challenge._id) } });
    }

    // POST /api/challenge?action=dismiss
    if (req.method === 'POST' && action === 'dismiss') {
      const { challengeId } = req.body;
      if (!challengeId) return res.status(400).json({ error: 'Missing challengeId' });
      await db.collection('challenges').updateOne(
        { _id: new ObjectId(challengeId), to: username },
        { $set: { status: 'dismissed' } }
      );
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    if (err.status === 401 || err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: err.message });
    }
    console.error('challenge error:', err);
    return res.status(500).json({ error: err.message });
  }
}
