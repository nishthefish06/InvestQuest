import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { WORLDS, QUESTS, MODULES } from '../data/skills';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const BOTTOM_COINS = [
  { id: 1, bottom: '-5%', left: '-5%', size: 80, delay: 0.2, rotate: -15 },
  { id: 2, bottom: '2%', left: '20%', size: 60, delay: 0.8, rotate: 10 },
  { id: 3, bottom: '-2%', left: '45%', size: 90, delay: 0, rotate: -25 },
  { id: 4, bottom: '5%', left: '70%', size: 55, delay: 1.5, rotate: 15 },
  { id: 5, bottom: '-10%', left: '90%', size: 100, delay: 0.5, rotate: -10 },
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

export default function WorldHub() {
  const { worldId } = useParams();
  const navigate = useNavigate();
  const { worldProgress } = useGameState();
  const world = WORLDS.find((w) => w.id === worldId);
  const quests = QUESTS[worldId] || [];
  const modules = MODULES[worldId] || [];
  const [activeModule, setActiveModule] = useState(modules[0]?.id || 'basics');

  if (!world) return <div className="page-content"><p>World not found</p></div>;

  const filteredQuests = quests.filter((q) => q.module === activeModule);

  const getGameRoute = () => {
    if (worldId === 'budget') return '/budget-game';
    if (worldId === 'stocks') return '/arena';
    if (worldId === 'crypto') return '/crypto-game';
    return '/';
  };

  const getGameName = () => {
    if (worldId === 'budget') return 'Budget Boss';
    if (worldId === 'stocks') return 'Market Match';
    if (worldId === 'crypto') return 'Crypto Chaos';
    return 'Game';
  };

  const bgLight = '#87a992'; // Matches the sage green background in design
  const bgDark = '#56755f';
  const innerCard = 'rgba(255,255,255,0.2)';
  const trackColor = '#4e6d55'; // Darker inset background
  const pillBtnColors = 'linear-gradient(180deg, #6c9c76 0%, #4b7d56 100%)';
  const amber = '#f5b041';

  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(180deg, ${bgLight} 0%, ${bgDark} 100%)`,
      position: 'relative',
      overflowX: 'hidden',
      color: '#111',
      paddingBottom: 80
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <DecorCoins coins={BOTTOM_COINS} />
      </div>

      <div className="page-content" style={{ position: 'relative', zIndex: 1, padding: '24px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, marginTop: 10 }}>
          <button onClick={() => navigate('/')} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={28} color="#111" />
          </button>

          <div style={{
            width: 72, height: 72, borderRadius: 16, overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: world.gradient
          }}>
            {world.mapImage ? (
              <img src={world.mapImage} alt={world.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{world.icon}</div>
            )}
          </div>

          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 4 }}>
              {world.name}
            </h1>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#333', lineHeight: 1.3 }}>
              {world.desc}
            </p>
          </div>
        </div>

        {/* Completion Bar */}
        <div style={{
          background: innerCard,
          borderRadius: 9999,
          padding: '12px 16px',
          marginBottom: 20,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800 }}>Completion</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800 }}>{worldProgress[worldId]}%</span>
          </div>
          <div style={{
            height: 12,
            background: trackColor,
            borderRadius: 9999,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
          }}>
            <motion.div
              style={{
                height: '100%',
                width: `${worldProgress[worldId]}%`,
                background: '#5cb874', // Lighter interior green
                borderRadius: 9999,
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 0 8px rgba(92,184,116,0.6)'
              }}
            />
          </div>
        </div>

        {/* Play Game CTA */}
        <motion.button whileTap={{ scale: 0.96 }}
          onClick={() => navigate(getGameRoute())}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: 9999,
            background: pillBtnColors,
            color: 'white',
            fontWeight: 800,
            fontSize: '1.25rem',
            fontFamily: 'var(--font-display)',
            border: 'none',
            cursor: 'pointer',
            marginBottom: 20,
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), 0 8px 16px rgba(0,0,0,0.15)',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
          Play {getGameName()}
        </motion.button>

        {/* Module Tabs (Pills) */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, marginBottom: 20, justifyContent: 'center' }}>
          {modules.map((mod) => (
            <button key={mod.id} onClick={() => setActiveModule(mod.id)}
              style={{
                padding: '10px 20px', borderRadius: 9999, fontSize: '0.8125rem', fontWeight: 800,
                whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                background: activeModule === mod.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                color: '#111',
                boxShadow: activeModule === mod.id ? '0 4px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s',
              }}>
              {mod.name}
            </button>
          ))}
        </div>

        {/* Quest Path (Coins) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '16px 0' }}>
          {filteredQuests.map((quest, i) => {
            const isOdd = i % 2 === 0;
            const canPlay = quest.status !== 'locked';

            return (
              <motion.div key={quest.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  flexDirection: isOdd ? 'row' : 'row-reverse',
                  paddingLeft: isOdd ? 24 : 0, paddingRight: isOdd ? 0 : 24,
                }}>

                <div onClick={() => canPlay && (quest.type === 'sim' ? navigate(getGameRoute()) : navigate(`/quest/${worldId}/${quest.id}`))}
                  style={{
                    width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, cursor: canPlay ? 'pointer' : 'not-allowed',
                    opacity: quest.status === 'locked' ? 0.5 : 1,
                    filter: quest.status === 'completed' ? 'sepia(1) hue-rotate(80deg) saturate(2)' : 'none', // Tint green if completed
                    transition: 'all 0.25s'
                  }}>
                  <img src="/flat-coin.png" alt="Quest Node" style={{ width: '200%', height: '200%', objectFit: 'contain', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))' }} />
                </div>

                <div style={{ flex: 1, textAlign: isOdd ? 'left' : 'right' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)', marginBottom: 2 }}>{quest.title}</h4>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111', marginBottom: 4 }}>{quest.desc}</p>
                  <p style={{ fontSize: '0.75rem', color: amber, fontWeight: 900, textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>+{quest.xp} XP</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

