import { getDb } from '../lib/db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'investquest-secret-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Authenticate user
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const currentUser = decoded.username;

    const { action, targetUsername } = req.body;
    // action: 'send', 'accept', 'reject', 'remove'
    if (!action || !targetUsername) {
      return res.status(400).json({ error: 'Missing action or targetUsername' });
    }

    if (currentUser.toLowerCase() === targetUsername.toLowerCase()) {
       return res.status(400).json({ error: 'Cannot interact with yourself' });
    }

    const db = await getDb();
    
    // Find both users
    const [sender, target] = await Promise.all([
      db.collection('users').findOne({ username: currentUser }),
      db.collection('users').findOne({ username: { $regex: new RegExp(`^${targetUsername}$`, 'i') } })
    ]);

    if (!sender || !target) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetExactName = target.username;

    if (action === 'send') {
      // Add to target's pending requests if not already friends and not already requested
      const friends = target.gameState?.friends || [];
      const requests = target.gameState?.friendRequests || [];
      
      if (friends.some(f => f.username === currentUser)) return res.status(400).json({ error: 'Already friends' });
      if (requests.includes(currentUser)) return res.status(400).json({ error: 'Request already sent' });

      await db.collection('users').updateOne(
        { _id: target._id },
        { $addToSet: { 'gameState.friendRequests': currentUser } }
      );
      
      return res.status(200).json({ ok: true, message: 'Request sent' });
    } 
    
    else if (action === 'accept') {
      // Remove from currentUser's friendRequests, add each other to friends arrays
      
      const newFriendForCurrent = {
        username: targetExactName,
        level: target.gameState?.level || 1,
        xp: target.gameState?.xp || 0,
        streak: target.gameState?.streak || 0,
        addedAt: new Date()
      };

      const newFriendForTarget = {
        username: currentUser,
        level: sender.gameState?.level || 1,
        xp: sender.gameState?.xp || 0,
        streak: sender.gameState?.streak || 0,
        addedAt: new Date()
      };

      await Promise.all([
        db.collection('users').updateOne(
          { _id: sender._id },
          { 
            $pull: { 'gameState.friendRequests': targetExactName },
            $addToSet: { 'gameState.friends': newFriendForCurrent }
          }
        ),
        db.collection('users').updateOne(
          { _id: target._id },
          { 
            $addToSet: { 'gameState.friends': newFriendForTarget },
            // Also clean up if target had sent a request to current
            $pull: { 'gameState.friendRequests': currentUser }
          }
        )
      ]);

      return res.status(200).json({ ok: true, message: 'Request accepted', friend: newFriendForCurrent });
    }

    else if (action === 'reject') {
      await db.collection('users').updateOne(
        { _id: sender._id },
        { $pull: { 'gameState.friendRequests': targetExactName } }
      );
      return res.status(200).json({ ok: true, message: 'Request rejected' });
    }

    else if (action === 'remove') {
      await Promise.all([
        db.collection('users').updateOne(
          { _id: sender._id },
          { $pull: { 'gameState.friends': { username: targetExactName } } }
        ),
        db.collection('users').updateOne(
          { _id: target._id },
          { $pull: { 'gameState.friends': { username: currentUser } } }
        )
      ]);
      return res.status(200).json({ ok: true, message: 'Friend removed' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    console.error('Friend request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
