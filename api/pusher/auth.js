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
