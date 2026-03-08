import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { BUDDY_LIST } from '../data/skills';
import { SIM_STOCKS } from '../data/skills';
import { WORLDS } from '../data/skills';
import { Settings, ChevronRight, Send, DollarSign, LogOut, Swords, Search, X, Plus } from 'lucide-react';

const COINS = [
  { id: 1, top: '4%', left: '85%', size: 45, delay: 0.2, rotate: -15 },
  { id: 2, top: '25%', left: '5%', size: 60, delay: 1.5, rotate: 20 },
  { id: 3, top: '65%', left: '90%', size: 50, delay: 0.8, rotate: -5 },
];

function DecorCoins({ coins }) {
  return (
    <>
      {coins.map((coin) => (
        <motion.img
          key={coin.id}
          src="/coin.png"
          alt=""
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [0, -10, 0],
            rotate: [coin.rotate, coin.rotate + 5, coin.rotate]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: coin.delay 
          }}
          style={{
            position: 'absolute',
            top: coin.top,
            left: coin.left,
            bottom: coin.bottom,
            width: coin.size,
            height: coin.size,
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
          }}
        />
      ))}
    </>
  );
}

export default function Profile() {
  const { username, xp, level, xpToNext, streak, lessonsCompleted, achievements, holdings, stockCash, worldProgress, friends, friendRequests, searchUser, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, logout, token } = useGameState();
  const navigate = useNavigate();
  const progress = (xp / xpToNext) * 100;
  
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchStatus, setSearchStatus] = useState(''); // 'loading', 'found', 'error', 'sent'
  const [searchError, setSearchError] = useState('');
  const [incomingChallenge, setIncomingChallenge] = useState(null);

  // Colors matching the Dashboard aesthetic
  const bgLight = '#4d7f5c'; // Darker sage green base
  const bgDark = '#416a4d';  // Even darker sage for gradient
  const amber = '#fbb03b';
  const headerTeal = '#dceddd'; // Lighter text color to contrast dark background
  const cardSage = '#385c43'; // Darker card background
  const overlayBg = 'rgba(65, 106, 77, 0.9)'; // Slightly darker/blurrier for modals

  // ── Poll MongoDB for incoming challenges ──
  useEffect(() => {
    if (!token || !username) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch('/api/challenge?action=incoming', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const { challenge } = await res.json();
        if (!cancelled && challenge) {
          setIncomingChallenge(challenge);
        }
      } catch (_) {}
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [token, username]);

  const handleSendChallenge = async (friendUsername) => {
    const matchId = `match-${username.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
    try {
      const res = await fetch('/api/challenge?action=send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUsername: friendUsername, matchId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Server error (${res.status})`);
      }
      navigate(`/arena/${matchId}`);
    } catch (e) {
      console.error('Failed to send challenge', e);
      alert(`Challenge failed: ${e.message}\n\nPlease try again or refresh the page.`);
    }
  };

  const handleAcceptChallenge = () => {
    if (incomingChallenge) {
      // Dismiss from DB so it stops polling
      if (incomingChallenge._id) {
        fetch('/api/challenge?action=dismiss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ challengeId: incomingChallenge._id }),
        }).catch(() => {});
      }
      navigate(`/arena/${incomingChallenge.matchId}`);
    }
  };

  const handleDeclineChallenge = () => {
    if (incomingChallenge?._id) {
      fetch('/api/challenge?action=dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ challengeId: incomingChallenge._id }),
      }).catch(() => {});
    }
    setIncomingChallenge(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchStatus('loading');
    setSearchError('');
    setSearchResult(null);
    try {
      const user = await searchUser(searchQuery.trim());
      setSearchResult(user);
      setSearchStatus('found');
    } catch (error) {
      setSearchStatus('error');
      setSearchError(error.message);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    setSearchStatus('loading');
    try {
      await sendFriendRequest(searchResult.username);
      setSearchStatus('sent');
    } catch (error) {
      setSearchStatus('error');
      setSearchError(error.message);
    }
  };

  const holdingsValue = (holdings || []).reduce((sum, h) => {
    const stock = SIM_STOCKS.find((s) => s.ticker === h.ticker);
    return sum + (stock ? stock.price * h.shares : 0);
  }, 0);

  // Real calendar logic
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Get total days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Create calendar array with empty cells before month starts, then actual days
  const calDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calDays.push({ day: '', active: false, today: false, empty: true });
  }
  
  // Add actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === currentDay;
    // A day is active if it falls within the streak period (counting back from today)
    const daysAgo = currentDay - day;
    const isActive = daysAgo >= 0 && daysAgo < (streak || 0);
    
    calDays.push({
      day,
      active: isActive,
      today: isToday,
      empty: false
    });
  }
  
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  return (
    <div style={{
      minHeight: '100dvh',
      background: `radial-gradient(circle at center, ${bgLight} 0%, ${bgDark} 100%)`,
      color: headerTeal,
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: 20
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <DecorCoins coins={COINS} />
      </div>

      <div className="page-content" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 90px' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '20px 0 24px' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            <img src="/logo.png" alt="User Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: amber, letterSpacing: '-0.02em', marginBottom: 2 }}>{username}</h1>
          <p style={{ fontSize: '0.875rem', color: headerTeal, opacity: 0.8, fontWeight: 800 }}>Level {level}</p>
          <div style={{ marginTop: 12, maxWidth: 200, margin: '12px auto 0' }}>
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: amber, width: `${progress}%` }} />
            </div>
            <p style={{ fontSize: '0.6875rem', color: headerTeal, fontWeight: 700, opacity: 0.7, marginTop: 4 }}>{xp} / {xpToNext} XP</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { val: lessonsCompleted || 0, label: 'Lessons', color: headerTeal },
            { val: `${streak || 0}🔥`, label: 'Streak', color: amber },
            { val: `${friends?.filter((buddy, index, self) => index === self.findIndex(f => f.username === buddy.username)).length || 0}`, label: 'Friends', color: '#27ae60' },
          ].map((s, i) => (
            <div key={i} style={{ background: cardSage, padding: '16px 8px', borderRadius: 24, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.25rem', color: s.color }}>{s.val}</p>
              <p style={{ fontSize: '0.6875rem', color: headerTeal, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* World Progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ background: cardSage, padding: '6px 14px', borderRadius: 12, fontSize: '1rem', fontWeight: 900, color: headerTeal }}>
            World Progress
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {WORLDS.map((w) => (
            <div key={w.id} style={{ background: cardSage, padding: '14px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '1.5rem', background: 'rgba(255,255,255,0.2)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{w.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: headerTeal }}>{w.name}</span>
                  <span style={{ fontSize: '0.8125rem', color: headerTeal, fontWeight: 900 }}>{worldProgress?.[w.id] || 0}%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: headerTeal, width: `${worldProgress?.[w.id] || 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ background: cardSage, padding: '6px 14px', borderRadius: 12, fontSize: '1rem', fontWeight: 900, color: headerTeal }}>
            Achievements
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: headerTeal, opacity: 0.6 }}>
            {achievements?.filter((a) => a.earned).length || 0}/{achievements?.length || 0}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          {achievements?.map((badge, i) => (
            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.03 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: badge.earned ? 1 : 0.4 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: badge.earned ? cardSage : 'rgba(255,255,255,0.15)', boxShadow: badge.earned ? '0 4px 12px rgba(0,0,0,0.06)' : 'none' }}>
                {badge.icon}
              </div>
              <p style={{ fontSize: '0.5625rem', color: headerTeal, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{badge.name}</p>
            </motion.div>
          ))}
        </div>

        {/* Friends System */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ background: cardSage, padding: '6px 14px', borderRadius: 12, fontSize: '1rem', fontWeight: 900, color: headerTeal }}>
            Friends
          </div>
          <button onClick={() => setShowAddFriend(true)} style={{ fontWeight: 800, fontSize: '0.875rem', color: headerTeal, background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <Plus size={14} /> Add Friend
          </button>
        </div>

        {friendRequests?.length > 0 && (
          <div style={{ marginBottom: 16, padding: 16, background: 'rgba(243,156,18,0.15)', borderRadius: 24, border: `2px solid ${amber}` }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 900, color: amber, marginBottom: 10 }}>Pending Requests ({friendRequests?.length || 0})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {friendRequests?.map((req) => (
                <div key={req} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.4)', padding: '10px 14px', borderRadius: 16 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: headerTeal }}>{req}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => acceptFriendRequest(req)} style={{ padding: '6px 12px', borderRadius: 9999, background: '#27ae60', color: '#fff', fontSize: '0.75rem', fontWeight: 800, border: 'none' }}>Accept</button>
                    <button onClick={() => rejectFriendRequest(req)} style={{ padding: '6px 12px', borderRadius: 9999, background: '#e74c3c', color: '#fff', fontSize: '0.75rem', fontWeight: 800, border: 'none' }}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {friends?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 24, border: '2px dashed rgba(255,255,255,0.2)' }}>
              <p style={{ fontSize: '0.875rem', color: headerTeal, fontWeight: 700, opacity: 0.8 }}>You don't have any friends yet.<br/>Click "Add Friend" to search!</p>
            </div>
          ) : (
            friends?.filter((buddy, index, self) => index === self.findIndex(f => f.username === buddy.username))
              .map((buddy) => (
              <div key={buddy.username} style={{ background: cardSage, padding: '14px 16px', borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>👾</div>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: '#27ae60', border: `2px solid ${cardSage}` }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 900, fontSize: '0.9375rem', color: headerTeal }}>{buddy.username}</p>
                    <p style={{ fontSize: '0.6875rem', color: headerTeal, opacity: 0.8, fontWeight: 600 }}>Lvl {buddy.level || 1} · {buddy.streak || 0}🔥 · {(buddy.xp || 0).toLocaleString()} XP</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleSendChallenge(buddy.username)}
                      style={{ padding: '8px 12px', borderRadius: 12, color: bgLight, display: 'flex', alignItems: 'center', gap: 6, background: headerTeal, fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                      <Swords size={14} /> Battle
                    </button>
                    <button onClick={() => {
                      if (window.confirm(`Are you sure you want to remove ${buddy.username} from your friends list?`)) {
                        removeFriend(buddy.username);
                      }
                    }}
                      style={{ padding: '8px', borderRadius: 12, color: '#e74c3c', display: 'flex', alignItems: 'center', border: 'none', background: 'rgba(231, 76, 60, 0.15)', cursor: 'pointer' }}>
                      <LogOut size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Friend Modal */}
        {showAddFriend && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'fixed', inset: 0, background: overlayBg, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => { setShowAddFriend(false); setSearchStatus(''); setSearchResult(null); setSearchQuery(''); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: bgLight, borderRadius: 32, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 12px 48px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 900, fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: headerTeal }}>Find a Friend</h3>
                <button onClick={() => setShowAddFriend(false)} style={{ background: 'none', border: 'none', color: headerTeal }}><X size={24} /></button>
              </div>
              
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input style={{ flex: 1, padding: '14px 16px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.6)', fontSize: '1rem', color: headerTeal, fontWeight: 600, outline: 'none' }} type="text" placeholder="Enter exactly: username"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <button type="submit" disabled={searchStatus === 'loading'} style={{ padding: '0 20px', borderRadius: 16, background: headerTeal, color: bgLight, fontWeight: 900, border: 'none' }}>
                  {searchStatus === 'loading' && !searchResult ? '...' : <Search size={20} />}
                </button>
              </form>

              <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: 20, border: '2px dashed rgba(255,255,255,0.2)', padding: 16 }}>
                {searchStatus === '' && (
                  <p style={{ fontSize: '0.875rem', color: headerTeal, opacity: 0.7, fontWeight: 600, textAlign: 'center' }}>Search requires an exact username match.</p>
                )}
                {searchStatus === 'error' && (
                  <p style={{ fontSize: '0.9375rem', color: '#e74c3c', fontWeight: 800 }}>{searchError}</p>
                )}
                {searchStatus === 'sent' && (
                  <p style={{ fontSize: '0.9375rem', color: '#27ae60', fontWeight: 800 }}>Friend request sent!</p>
                )}
                {searchStatus === 'found' && searchResult && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👾</div>
                      <div>
                        <p style={{ fontWeight: 900, fontSize: '1rem', color: headerTeal }}>{searchResult.username}</p>
                        <p style={{ fontSize: '0.75rem', color: headerTeal, opacity: 0.8, fontWeight: 600 }}>Lvl {searchResult.level} · {searchResult.xp} XP</p>
                      </div>
                    </div>
                    <button onClick={handleSendRequest} style={{ padding: '8px 16px', borderRadius: 16, background: amber, color: '#fff', fontSize: '0.875rem', fontWeight: 900, border: 'none' }}>
                      Add Friend
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Incoming Challenge Modal */}
        {incomingChallenge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'fixed', inset: 0, background: overlayBg, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: bgLight, borderRadius: 32, padding: 32, width: '100%', maxWidth: 320, border: `4px solid ${amber}`, textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}>
              
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: amber, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 16px rgba(243,156,18,0.4)' }}>
                <Swords size={40} />
              </div>
              
              <h3 style={{ fontWeight: 900, fontSize: '1.75rem', fontFamily: 'var(--font-display)', marginBottom: 12, color: headerTeal }}>Challenge Request!</h3>
              <p style={{ color: headerTeal, fontSize: '1rem', marginBottom: 28, lineHeight: 1.4, fontWeight: 600 }}>
                <strong style={{ color: headerTeal, fontWeight: 900 }}>{incomingChallenge.from || incomingChallenge.challenger}</strong> has challenged you to a 3-minute stock trading battle!
              </p>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={handleDeclineChallenge} 
                  style={{ flex: 1, padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.4)', color: headerTeal, border: 'none', fontWeight: 800, fontSize: '1rem' }}>
                  Decline
                </button>
                <button 
                  onClick={handleAcceptChallenge} 
                  style={{ flex: 1, padding: '14px', borderRadius: 16, background: amber, color: '#fff', border: 'none', fontWeight: 900, fontSize: '1rem', boxShadow: '0 8px 16px rgba(243,156,18,0.3)' }}>
                  Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Streak Calendar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ background: cardSage, padding: '6px 14px', borderRadius: 12, fontSize: '1rem', fontWeight: 900, color: headerTeal }}>
            Streak Calendar
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: headerTeal, opacity: 0.6 }}>
            {monthName} {currentYear}
          </span>
        </div>
        <div style={{ background: cardSage, padding: 16, borderRadius: 24, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '0.6875rem', color: headerTeal, opacity: 0.8, fontWeight: 800, paddingBottom: 6 }}>{d}</div>
            ))}
            {calDays.map((d, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: d.today ? 900 : 700, background: d.empty ? 'transparent' : d.today ? amber : d.active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: d.empty ? 'transparent' : d.today ? '#fff' : d.active ? headerTeal : 'rgba(26,83,92,0.4)' }}>{d.day}</div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button onClick={logout}
          style={{ width: '100%', padding: '16px', borderRadius: 20, background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', fontSize: '1rem', fontWeight: 900, border: '2px solid rgba(231, 76, 60, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
