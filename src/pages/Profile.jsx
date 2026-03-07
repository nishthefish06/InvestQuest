import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { BUDDY_LIST } from '../data/skills';
import { SIM_STOCKS } from '../data/skills';
import { WORLDS } from '../data/skills';
import { Settings, ChevronRight, Send, DollarSign, LogOut } from 'lucide-react';

export default function Profile() {
  const { username, xp, level, xpToNext, streak, lessonsCompleted, achievements, holdings, stockCash, virtualCash, worldProgress, buddyTransactions, sendMoney, logout } = useGameState();
  const navigate = useNavigate();
  const progress = (xp / xpToNext) * 100;
  const [sendingTo, setSendingTo] = useState(null);
  const [sendAmount, setSendAmount] = useState('');

  const holdingsValue = holdings.reduce((sum, h) => {
    const stock = SIM_STOCKS.find((s) => s.ticker === h.ticker);
    return sum + (stock ? stock.price * h.shares : 0);
  }, 0);

  const handleSend = () => {
    const amt = parseInt(sendAmount);
    if (!amt || amt <= 0 || amt > virtualCash) return;
    sendMoney(sendingTo.id, amt);
    setSendingTo(null);
    setSendAmount('');
  };

  const calDays = Array.from({ length: 28 }).map((_, i) => ({ day: i + 1, active: i >= 28 - streak, today: i === 27 }));

  return (
    <div className="page-content">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '16px 0 20px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--gradient-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 10px', border: '3px solid var(--accent-purple)', boxShadow: 'var(--shadow-glow-purple)' }}>💰</div>
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
          { val: `$${virtualCash.toLocaleString()}`, label: 'V-Cash', color: 'var(--accent-green)' },
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

      {/* Buddies */}
      <div className="section-header"><h2 className="section-title">🤝 Buddies</h2></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {BUDDY_LIST.map((buddy) => (
          <div key={buddy.id} className="card card-interactive" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>{buddy.avatar}</div>
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: buddy.online ? 'var(--accent-green)' : 'var(--text-muted)', border: '2px solid var(--bg-primary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{buddy.name}</p>
                <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>Lvl {buddy.level} · {buddy.streak}🔥 · {buddy.xp.toLocaleString()} XP</p>
              </div>
              <button onClick={() => setSendingTo(buddy)}
                style={{ padding: '6px 12px', borderRadius: 9999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <DollarSign size={12} /> Send
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Send Money Modal */}
      {sendingTo && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setSendingTo(null)}>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 320, border: '1px solid var(--border-glass)' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: '2rem' }}>{sendingTo.avatar}</span>
              <h3 style={{ fontWeight: 700, marginTop: 8 }}>Send to {sendingTo.name}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Your balance: ${virtualCash.toLocaleString()}</p>
            </div>
            <input className="input-field" type="number" placeholder="Amount ($)"
              value={sendAmount} onChange={(e) => setSendAmount(e.target.value)}
              style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[50, 100, 500].map((a) => (
                <button key={a} onClick={() => setSendAmount(String(a))}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  ${a}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={handleSend}>
              <Send size={16} /> Send Cash
            </button>
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
