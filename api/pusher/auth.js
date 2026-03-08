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

    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;

    // Add user info to presence/private channels
    const presenceData = {
      user_id: decoded.username,
      user_info: { username: decoded.username }
    };

    const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
    res.send(authResponse);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    console.error('Pusher auth error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
