import Pusher from 'pusher';
import jwt from 'jsonwebtoken';

function getPusherConfig() {
  // Allow local dev to use existing VITE_ env vars if server-prefixed vars are missing.
  const appId = process.env.PUSHER_APP_ID || process.env.VITE_PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY || process.env.VITE_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || process.env.VITE_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error('Pusher server env missing: set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER');
  }

  return { appId, key, secret, cluster, useTLS: true };
}

const JWT_SECRET = process.env.JWT_SECRET || 'investquest-secret-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const pusher = new Pusher(getPusherConfig());

    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);

    const { channel, event, data } = req.body;
    
    if (!channel || !event || !data) {
      return res.status(400).json({ error: 'Missing channel, event, or data' });
    }

    // Securely include the sender's username from their JWT token
    const payload = {
      ...data,
      sender: decoded.username,
      timestamp: Date.now()
    };

    await pusher.trigger(channel, event, payload);
    
    res.status(200).json({ ok: true });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    console.error('Pusher trigger error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Server error', stack: err?.stack?.slice(0,300) });
  }
}
