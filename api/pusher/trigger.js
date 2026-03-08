import Pusher from 'pusher';
import jwt from 'jsonwebtoken';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

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
