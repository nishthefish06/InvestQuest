import Pusher from 'pusher';
import jwt from 'jsonwebtoken';

function getPusherConfig() {
  const appId = process.env.PUSHER_APP_ID || process.env.VITE_PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY || process.env.VITE_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || process.env.VITE_PUSHER_CLUSTER;

  // Log what we see (visible in Vercel function logs)
  console.log('[pusher/trigger] env check:', {
    hasAppId: !!appId, appId,
    hasKey: !!key,
    hasSecret: !!secret,
    hasCluster: !!cluster, cluster,
  });

  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      `Pusher env vars missing on server. Have: appId=${!!appId} key=${!!key} secret=${!!secret} cluster=${!!cluster}. ` +
      `Add PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER in Vercel dashboard.`
    );
  }

  return { appId, key, secret, cluster, useTLS: true };
}

const JWT_SECRET = process.env.JWT_SECRET || 'investquest-secret-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);

    const { channel, event, data } = req.body;
    if (!channel || !event || !data) {
      return res.status(400).json({ error: 'Missing channel, event, or data' });
    }

    // Build Pusher client AFTER auth so config errors are a 500, not confused with 401
    const pusher = new Pusher(getPusherConfig());

    const payload = {
      ...data,
      sender: decoded.username,
      timestamp: Date.now()
    };

    await pusher.trigger(channel, event, payload);
    res.status(200).json({ ok: true });

  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    console.error('[pusher/trigger] error:', err?.message);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}
