import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { BUDDY_LIST } from '../data/skills';
import { SIM_STOCKS } from '../data/skills';
import { WORLDS } from '../data/skills';
import { Settings, ChevronRight, Send, DollarSign, LogOut, Swords } from 'lucide-react';

export default function Profile() {
  const { username, xp, level, xpToNext, streak, lessonsCompleted, achievements, holdings, stockCash, worldProgress, friends, friendRequests, searchUser, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, logout, pusherClient, triggerPusherEvent } = useGameState();
  const navigate = useNavigate();
  const progress = (xp / xpToNext) * 100;
  
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchStatus, setSearchStatus] = useState(''); // 'loading', 'found', 'error', 'sent'
  const [searchError, setSearchError] = useState('');
  const [incomingChallenge, setIncomingChallenge] = useState(null);

  useEffect(() => {
    if (pusherClient && username) {
      // Public channel — no auth required so events are reliably received
      const safeChannel = `notify-${username.replace(/[^a-zA-Z0-9_-]/g, '')}`;
      const channel = pusherClient.subscribe(safeChannel);
      
      channel.bind('challenge', (data) => {
        setIncomingChallenge(data);
      });

      return () => {
        pusherClient.unsubscribe(safeChannel);
      };
    }
  }, [pusherClient, username]);

  const handleSendChallenge = async (friendUsername) => {
    const matchId = `match-${username.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
    const targetChannel = `notify-${friendUsername.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    try {
      await triggerPusherEvent(targetChannel, 'challenge', { challenger: username, matchId });
      navigate(`/arena/${matchId}`);
    } catch (e) {
      console.error('Failed to send challenge', e);
      alert(`Challenge failed: ${e.message}`);
    }
  };

  const handleAcceptChallenge = () => {
    if (incomingChallenge) {
      navigate(`/arena/${incomingChallenge.matchId}`);
    }
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

  const holdingsValue = holdings.reduce((sum, h) => {
    const stock = SIM_STOCKS.find((s) => s.ticker === h.ticker);
    return sum + (stock ? stock.price * h.shares : 0);
  }, 0);

  const calDays = Array.from({ length: 28 }).map((_, i) => ({ day: i + 1, active: i >= 28 - streak, today: i === 27 }));

  return (
    <div className="page-content">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '16px 0 20px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', border: '3px solid var(--accent-purple)', boxShadow: 'var(--shadow-glow-purple)', overflow: 'hidden' }}>
          <img src="/logo.png" alt="User Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{username}</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--accent-purple)', fontWeight: 500 }}>Level {level}</p>
        <div style={{ marginTop: 10, maxWidth: 180, margin: '10px auto 0' }}>
          <div className="progress-bar" style={{ height: 5 }}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginTop: 3 }}>{xp} / {xpToNext} XP</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
        {[
          { val: lessonsCompleted, label: 'Lessons', color: 'var(--accent-purple)' },
          { val: `${streak}🔥`, label: 'Streak', color: 'var(--accent-orange)' },
          { val: `${friends.length}`, label: 'Friends', color: 'var(--accent-green)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '10px 6px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: s.color }}>{s.val}</p>
            <p style={{ fontSize: '0.5625rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* World Progress */}
      <div className="section-header"><h2 className="section-title">🗺️ World Progress</h2></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {WORLDS.map((w) => (
          <div key={w.id} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.125rem' }}>{w.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{w.name}</span>
                <span style={{ fontSize: '0.75rem', color: w.color, fontWeight: 600 }}>{worldProgress[w.id]}%</span>
              </div>
              <div className="progress-bar" style={{ height: 4 }}><div className={`progress-fill ${w.id}`} style={{ width: `${worldProgress[w.id]}%` }} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="section-header"><h2 className="section-title">🏅 Achievements</h2><span className="section-link">{achievements.filter((a) => a.earned).length}/{achievements.length}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
        {achievements.map((badge, i) => (
          <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.03 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', opacity: badge.earned ? 1 : 0.3 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', border: `2px solid ${badge.earned ? badge.color : 'var(--text-muted)'}`, background: badge.earned ? `${badge.color}22` : 'var(--bg-card)' }}>{badge.icon}</div>
            <p style={{ fontSize: '0.5625rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>{badge.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Friends System */}
      <div className="section-header">
        <h2 className="section-title">🤝 Friends</h2>
        <button className="section-link" onClick={() => setShowAddFriend(true)}>+ Add Friend</button>
      </div>

      {friendRequests?.length > 0 && (
        <div style={{ marginBottom: 18, padding: 12, background: 'rgba(245,158,11,0.1)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-orange)', marginBottom: 8 }}>Pending Requests ({friendRequests.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {friendRequests.map((req) => (
              <div key={req} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{req}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => acceptFriendRequest(req)} style={{ padding: '4px 10px', borderRadius: 9999, background: 'var(--accent-green)', color: '#000', fontSize: '0.6875rem', fontWeight: 700 }}>Accept</button>
                  <button onClick={() => rejectFriendRequest(req)} style={{ padding: '4px 10px', borderRadius: 9999, background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', fontSize: '0.6875rem', fontWeight: 600 }}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {friends?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>You don't have any friends yet.<br/>Click "Add Friend" to search for someone!</p>
          </div>
        ) : (
          friends?.map((buddy) => (
            <div key={buddy.username} className="card card-interactive" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>👾</div>
                  <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-green)', border: '2px solid var(--bg-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{buddy.username}</p>
                  <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>Lvl {buddy.level || 1} · {buddy.streak || 0}🔥 · {(buddy.xp || 0).toLocaleString()} XP</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleSendChallenge(buddy.username)}
                    style={{ padding: '6px 10px', borderRadius: 9999, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--accent-purple)', fontSize: '0.6875rem', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 0 10px rgba(168,85,247,0.4)' }}>
                    <Swords size={12} /> Battle
                  </button>
                  <button onClick={() => {
                    if (window.confirm(`Are you sure you want to remove ${buddy.username} from your friends list?`)) {
                      removeFriend(buddy.username);
                    }
                  }}
                    style={{ padding: '6px', borderRadius: 9999, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', cursor: 'pointer' }}>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => { setShowAddFriend(false); setSearchStatus(''); setSearchResult(null); setSearchQuery(''); }}>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 360, border: '1px solid var(--border-glass)' }}>
            
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: 16 }}>Find a Friend</h3>
            
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="input-field" type="text" placeholder="Enter exactly: username"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" disabled={searchStatus === 'loading'}>
                {searchStatus === 'loading' && !searchResult ? '...' : 'Search'}
              </button>
            </form>

            <div style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)', padding: 16 }}>
              {searchStatus === '' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Search requires exact username match.</p>
              )}
              {searchStatus === 'error' && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--accent-red)', fontWeight: 600 }}>{searchError}</p>
              )}
              {searchStatus === 'sent' && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--accent-green)', fontWeight: 600 }}>Friend request sent!</p>
              )}
              {searchStatus === 'found' && searchResult && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>👾</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{searchResult.username}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Lvl {searchResult.level} · {searchResult.xp} XP</p>
                    </div>
                  </div>
                  <button onClick={handleSendRequest} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                    Send Request
                  </button>
                </div>
              )}
            </div>
            
            <button onClick={() => setShowAddFriend(false)} style={{ width: '100%', marginTop: 16, padding: 10, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Close</button>
          </motion.div>
        </motion.div>
      )}

      {/* Incoming Challenge Modal */}
      {incomingChallenge && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
            style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 320, border: '2px solid var(--accent-purple)', textAlign: 'center', boxShadow: 'var(--shadow-glow-purple)' }}>
            
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(168,85,247,0.2)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Swords size={32} />
            </div>
            
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: 8 }}>Incoming Battle!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24, lineHeight: 1.4 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{incomingChallenge.challenger}</strong> challenged you to a live stock market battle!
            </p>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setIncomingChallenge(null)} 
                style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                Decline
              </button>
              <button 
                onClick={handleAcceptChallenge} 
                style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--accent-purple)', color: '#fff', border: 'none', fontWeight: 700, boxShadow: '0 0 14px rgba(168,85,247,0.4)' }}>
                Accept
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Streak Calendar */}
      <div className="section-header"><h2 className="section-title">📅 Streak</h2><span className="section-link">28 days</span></div>
      <div className="card" style={{ padding: 10, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '0.5625rem', color: 'var(--text-muted)', fontWeight: 600, padding: 3 }}>{d}</div>
          ))}
          {calDays.map((d, i) => (
            <div key={i} style={{ aspectRatio: '1', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: d.today ? 700 : 400, background: d.today ? 'var(--accent-purple)' : d.active ? 'rgba(168,85,247,0.3)' : 'var(--bg-card)', color: d.today ? 'white' : d.active ? 'var(--accent-purple)' : 'var(--text-muted)' }}>{d.day}</div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button className="btn btn-secondary btn-block" onClick={logout}
        style={{ marginBottom: 16, color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.2)' }}>
        <LogOut size={16} /> Log Out
      </button>
    </div>
  );
}
