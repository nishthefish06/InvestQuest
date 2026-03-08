import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { WORLDS } from '../data/skills';
import { LEADERBOARD } from '../data/community';
import { Flame, TrendingUp, Users, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COINS = [
  { id: 1, top: '2%', left: '8%', size: 60, delay: 0, rotate: 15 },
  { id: 2, top: '2%', left: '25%', size: 45, delay: 1, rotate: -10 },
  { id: 3, top: '-2%', left: '55%', size: 70, delay: 0.5, rotate: 25 },
  { id: 4, top: '5%', left: '85%', size: 55, delay: 1.5, rotate: -5 },
];

const BOTTOM_COINS = [
  { id: 5, bottom: '2%', left: '10%', size: 65, delay: 0.2, rotate: -15 },
  { id: 6, bottom: '-2%', left: '35%', size: 80, delay: 0.8, rotate: 20 },
  { id: 7, bottom: '3%', left: '60%', size: 50, delay: 0, rotate: -5 },
  { id: 8, bottom: '2%', left: '80%', size: 40, delay: 1.2, rotate: 10 },
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

export default function Dashboard() {
  const { username, xp, level, xpToNext, streak, lessonsCompleted, worldProgress, marketStocks, friends } = useGameState();
  const navigate = useNavigate();
  const progress = (xp / xpToNext) * 100;

  const bgLight = '#4d7f5c'; // Darker sage green base
  const bgDark = '#416a4d';  // Even darker sage for gradient
  const amber = '#fbb03b';
  const headerTeal = '#dceddd'; // Lighter text color to contrast dark background
  const cardSage = '#385c43'; // Darker card background
  const trackSage = 'rgba(255,255,255,0.1)';
  const progressBlue = '#fbb03b'; 

  return (
    <div style={{
      minHeight: '100dvh',
      color: headerTeal,
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: 20
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <DecorCoins coins={COINS} />
        <DecorCoins coins={BOTTOM_COINS} />
      </div>

      <div className="page-content" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 90px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 40 }}>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: amber, marginBottom: -4 }}>Welcome back</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: amber, letterSpacing: '-0.02em' }}>
              {username}
            </h1>
          </div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', 
              background: 'rgba(255,255,255,0.15)', borderRadius: 9999, 
              backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' 
            }}
          >
            <Flame size={20} color={amber} fill={amber} />
            <span style={{ fontWeight: 800, color: '#fbb03b', fontSize: '1rem' }}>{streak} days</span>
          </motion.div>
        </div>

        {/* Level + XP Card */}
        <div style={{ 
          background: cardSage, borderRadius: 24, padding: '16px 20px', 
          display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16,
          boxShadow: '0 8px 16px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            width: 72, height: 72, borderRadius: '50%', background: 'rgba(26,83,92,0.2)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.5rem', color: amber
          }}>
            {level}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: headerTeal }}>level one</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, opacity: 0.7 }}>{xp}/{xpToNext} XP</span>
            </div>
            <div style={{ width: '100%', height: 16, background: trackSage, borderRadius: 100, overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                style={{ height: '100%', background: progressBlue, borderRadius: 100 }} 
              />
            </div>
          </div>
        </div>

        {/* Lessons & Buddies Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ 
            background: cardSage, borderRadius: 24, padding: '16px', textAlign: 'center',
            boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
          }}>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: headerTeal, lineHeight: 1 }}>{lessonsCompleted}</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.8 }}>lessons</p>
          </div>
          <div style={{ 
            background: cardSage, borderRadius: 24, padding: '16px', textAlign: 'center',
            boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
          }}>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: headerTeal, lineHeight: 1 }}>{friends?.length || 0}</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.8 }}>buddies</p>
          </div>
        </div>

        {/* Our World Title */}
        <div style={{ 
          background: '#dceddd', padding: '6px 20px', borderRadius: 9999,
          fontSize: '1.125rem', fontWeight: 900, color: cardSage,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          width: 'fit-content', margin: '0 auto 12px'
        }}>
          our world
        </div>

        {/* Our World Box */}
        <div 
          style={{ 
            width: '100%', background: cardSage, borderRadius: 32, 
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '24px 16px 32px', marginBottom: 24, position: 'relative',
            boxShadow: '0 12px 24px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ position: 'relative', height: 300, width: 280, margin: '0 auto' }}>
            {/* SVG Winding Path */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', overflow: 'visible' }}>
              <path 
                d="M 5 20 Q 40 40, 80 80 Q 165 95, 215 130 T 95 220 Q 80 245, 65 280" 
                stroke="#21402a" 
                strokeWidth="3" 
                strokeDasharray="8 6" 
                strokeLinecap="round" 
                fill="none"
              />
            </svg>

            {/* Top Left - Budget */}
            <motion.div 
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/world/budget')}
              style={{
                position: 'absolute', top: 25, left: 25, width: 110, height: 110, 
                borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', zIndex: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <img src="/budget-map.png" alt="Budget Boardwalk" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>

            {/* Middle Right - Stocks */}
            <motion.div 
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/world/stocks')}
              style={{
                position: 'absolute', top: 75, right: 10, width: 110, height: 110, 
                borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', zIndex: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <img src="/stocks-map.png" alt="Stock Market Shore" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>

            {/* Bottom Left - Crypto */}
            <motion.div 
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/world/crypto')}
              style={{
                position: 'absolute', top: 165, left: 40, width: 110, height: 110, 
                borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', zIndex: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <img src="/crypto-map.png" alt="Crypto Caverns" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>
          </div>
        </div>

        {/* Market Movers */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 16 }}>
          <div style={{ 
            background: '#dceddd', padding: '6px 20px', borderRadius: 9999, 
            fontSize: '1.125rem', fontWeight: 900, color: cardSage,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            Market Movers
          </div>
          <button onClick={() => navigate('/arena')} style={{ fontWeight: 800, fontSize: '0.875rem', color: headerTeal, opacity: 0.8, cursor: 'pointer', background: 'none', border: 'none' }}>
            Trade →
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }}>
          {marketStocks.slice(0, 3).map((s) => (
            <div key={s.ticker} style={{ 
              background: cardSage, padding: '16px', borderRadius: 20, minWidth: 110, flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <span style={{ fontSize: '1.5rem', marginBottom: 2 }}>{s.logo}</span>
              <span style={{ fontFamily: 'var(--font-stock)', fontWeight: 900, fontSize: '1.125rem', color: headerTeal, textTransform: 'uppercase', letterSpacing: '0.02em', wordSpacing: '0.15em' }}>{s.ticker}</span>
              <span style={{ fontFamily: 'var(--font-stock)', fontWeight: 800, fontSize: '1.1875rem', color: headerTeal, textTransform: 'uppercase', letterSpacing: '0.02em', wordSpacing: '0.15em' }}>
                ${s.price.toFixed(2)}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: 8 }}>
                {s.change >= 0 ? <ArrowUpRight size={12} color="#fff" /> : <ArrowDownRight size={12} color="#ffb3b3" />}
                <span style={{ fontFamily: 'var(--font-stock)', fontSize: '0.9375rem', fontWeight: 800, color: s.change >= 0 ? '#fff' : '#ffb3b3', textTransform: 'uppercase', letterSpacing: '0.02em', wordSpacing: '0.15em' }}>
                  {s.change >= 0 ? '+' : ''}{s.changePct}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ 
            background: '#dceddd', padding: '6px 20px', borderRadius: 9999, 
            fontSize: '1.125rem', fontWeight: 900, color: cardSage,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            Leaderboard
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: headerTeal, opacity: 0.6 }}>
            This week
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LEADERBOARD.slice(0, 3).map((p) => (
            <div key={p.rank} style={{ 
              background: cardSage, padding: '12px 20px', borderRadius: 24, 
              display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
            }}>
              <span style={{ 
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '0.875rem', fontWeight: 900, background: p.rank <= 3 ? 'rgba(255,255,255,0.2)' : 'transparent', 
                fontFamily: 'var(--font-display)', color: headerTeal 
              }}>
                {p.rank}
              </span>
              <span style={{ fontSize: '1.25rem' }}>{p.avatar}</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <p style={{ fontWeight: 800, fontSize: '0.9375rem', color: headerTeal }}>{p.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7 }}>{p.xp.toLocaleString()} XP</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>•</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbb03b' }}>{p.portfolioReturn}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
