import { getDb } from './lib/db.js';
import jwt from 'jsonwebtoken';

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

    // POST /api/arena?action=join
    if (req.method === 'POST' && action === 'join') {
      const { matchId } = req.body;
      if (!matchId) return res.status(400).json({ error: 'Missing matchId' });
      await db.collection('arenaMatches').updateOne(
        { matchId },
        {
          $set: { [`players.${username}`]: { joinedAt: new Date(), netWorth: 100000 } },
          $setOnInsert: { matchId, createdAt: new Date() },
        },
        { upsert: true }
      );
      return res.status(200).json({ ok: true });
    }

    // GET /api/arena?action=status&matchId=xxx
    if (req.method === 'GET' && action === 'status') {
      const { matchId } = req.query;
      if (!matchId) return res.status(400).json({ error: 'Missing matchId' });
      const match = await db.collection('arenaMatches').findOne({ matchId });
      return res.status(200).json({ players: match?.players || {} });
    }

    // POST /api/arena?action=networth
    if (req.method === 'POST' && action === 'networth') {
      const { matchId, netWorth } = req.body;
      if (!matchId || netWorth === undefined) return res.status(400).json({ error: 'Missing params' });
      await db.collection('arenaMatches').updateOne(
        { matchId },
        { $set: { [`players.${username}.netWorth`]: netWorth, [`players.${username}.updatedAt`]: new Date() } }
      );
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    if (err.status === 401 || err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: err.message });
    }
    console.error('arena error:', err);
    return res.status(500).json({ error: err.message });
  }
}
