import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { WORLDS, SIM_STOCKS } from '../data/skills';
import { LEADERBOARD } from '../data/community';
import { Flame, TrendingUp, Users, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dashboard() {
  const { username, xp, level, xpToNext, streak, lessonsCompleted, worldProgress, virtualCash, marketStocks } = useGameState();
  const navigate = useNavigate();
  const progress = (xp / xpToNext) * 100;

  // Island positions for the visual world map
  const islands = [
    { ...WORLDS[0], x: '10%', y: '5%', size: 100, rotation: -5 },
    { ...WORLDS[1], x: '55%', y: '25%', size: 100, rotation: 3 },
    { ...WORLDS[2], x: '15%', y: '50%', size: 100, rotation: -2 },
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Welcome back</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900 }}>{username} 💰</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 9999, border: '1px solid rgba(245,158,11,0.2)' }}>
          <Flame size={16} color="var(--accent-orange)" />
          <span style={{ fontWeight: 700, color: 'var(--accent-orange)', fontSize: '0.875rem' }}>{streak} days</span>
        </div>
      </div>

      {/* Level + XP Card */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.125rem', boxShadow: 'var(--shadow-glow-purple)' }}>
            {level}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 700 }}>Level {level}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{xp} / {xpToNext} XP</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { icon: <Zap size={16} />, val: lessonsCompleted, label: 'Lessons', color: 'var(--accent-purple)' },
          { icon: <TrendingUp size={16} />, val: `$${(virtualCash).toLocaleString()}`, label: 'V-Cash', color: 'var(--accent-green)' },
          { icon: <Users size={16} />, val: '4', label: 'Buddies', color: 'var(--accent-cyan)' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="card" style={{ padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ color: s.color, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem' }}>{s.val}</p>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── WORLD MAP ─────────────────────────────────── */}
      <div className="section-header">
        <h2 className="section-title">🗺️ World Map</h2>
      </div>
      <div style={{
        position: 'relative', width: '100%', height: 320, marginBottom: 24,
        background: 'linear-gradient(180deg, rgba(10,10,40,0.8) 0%, rgba(15,15,50,0.6) 100%)',
        borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-glass)',
        overflow: 'hidden',
      }}>
        {/* Animated wave background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(6,182,212,0.3) 40px, rgba(6,182,212,0.3) 41px)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, opacity: 0.06, background: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(16,185,129,0.5) 8px, rgba(16,185,129,0.5) 9px)' }} />

        {/* Dotted paths between islands */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M 95 75 Q 160 110 230 105" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="6 4" />
          <path d="M 230 125 Q 180 180 120 210" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="6 4" />
        </svg>

        {/* Islands */}
        {islands.map((island, i) => (
          <motion.div
            key={island.id}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 200 }}
            onClick={() => navigate(`/world/${island.id}`)}
            style={{
              position: 'absolute', left: island.x, top: island.y,
              width: island.size, cursor: 'pointer',
              transform: `rotate(${island.rotation}deg)`,
              transition: 'transform 0.3s ease',
            }}
          >
            {/* Island base */}
            <div style={{
              width: island.size, height: island.size,
              borderRadius: '50% 50% 45% 55% / 50% 45% 55% 50%',
              background: `radial-gradient(circle at 40% 35%, ${island.color}44, ${island.color}11)`,
              border: `2px solid ${island.color}55`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 30px ${island.color}22, 0 4px 20px rgba(0,0,0,0.3)`,
              position: 'relative',
            }}>
              <span style={{ fontSize: '1.75rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{island.icon}</span>
              <div style={{
                position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap', textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: island.color, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  {island.name.split(' ').slice(0, 2).join(' ')}
                </p>
                <p style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>{worldProgress[island.id]}%</p>
              </div>
            </div>

            {/* Progress ring */}
            <svg width={island.size + 10} height={island.size + 10} style={{ position: 'absolute', top: -5, left: -5, pointerEvents: 'none' }}>
              <circle cx={(island.size + 10) / 2} cy={(island.size + 10) / 2} r={(island.size / 2) + 2}
                fill="none" stroke={`${island.color}33`} strokeWidth="3" />
              <circle cx={(island.size + 10) / 2} cy={(island.size + 10) / 2} r={(island.size / 2) + 2}
                fill="none" stroke={island.color} strokeWidth="3"
                strokeDasharray={`${(worldProgress[island.id] / 100) * Math.PI * (island.size + 4)} ${Math.PI * (island.size + 4)}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${(island.size + 10) / 2} ${(island.size + 10) / 2})`} />
            </svg>

            {/* Multiplayer badge */}
            {island.multiplayer && (
              <div style={{
                position: 'absolute', top: -6, right: -6,
                padding: '2px 6px', borderRadius: 9999,
                background: 'rgba(245,158,11,0.9)', color: '#000',
                fontSize: '0.5rem', fontWeight: 800,
                boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
              }}>
                MP
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Market Movers Mini */}
      <div className="section-header">
        <h2 className="section-title">📊 Market Movers</h2>
        <button className="section-link" onClick={() => navigate('/arena')}>Trade →</button>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 20 }}>
        {marketStocks.slice(0, 4).map((s) => (
          <div key={s.ticker} className="card" style={{ padding: '10px 14px', minWidth: 110, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: '0.875rem' }}>{s.logo}</span>
              <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{s.ticker}</span>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem' }}>${s.price.toFixed(2)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {s.change >= 0 ? <ArrowUpRight size={12} color="var(--accent-green)" /> : <ArrowDownRight size={12} color="var(--accent-red)" />}
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: s.change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {s.change >= 0 ? '+' : ''}{s.changePct}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="section-header">
        <h2 className="section-title">🏆 Leaderboard</h2>
        <span className="section-link">This Week</span>
      </div>
      <div className="card" style={{ padding: 12 }}>
        {LEADERBOARD.slice(0, 3).map((p) => (
          <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: p.rank < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 800, background: p.rank <= 3 ? 'var(--gradient-purple)' : 'var(--bg-card)', fontFamily: 'var(--font-display)' }}>{p.rank}</span>
            <span style={{ fontSize: '1rem' }}>{p.avatar}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{p.name}</p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{p.xp.toLocaleString()} XP · {p.portfolioReturn}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
