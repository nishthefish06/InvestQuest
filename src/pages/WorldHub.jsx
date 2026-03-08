import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { WORLDS, QUESTS, MODULES } from '../data/skills';
import { ArrowLeft, Play, Lock, Check, Users as UsersIcon, Gamepad2 } from 'lucide-react';
import { useState } from 'react';

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

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/')} style={{ padding: 4 }}>
          <ArrowLeft size={22} color="var(--text-secondary)" />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: world.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
          {world.icon}
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800 }}>{world.name}</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{world.desc}</p>
        </div>
    </div>

      {/* World Map Image */}
      {world.mapImage && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          style={{ 
            width: '100%', 
            height: 160, 
            borderRadius: 'var(--radius-xl)', 
            overflow: 'hidden', 
            marginBottom: 20,
            border: `1px solid ${world.color}33`,
            boxShadow: `0 8px 24px -8px ${world.color}40`,
            position: 'relative'
          }}>
          <img 
            src={world.mapImage} 
            alt={world.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '40%',
            background: `linear-gradient(to top, var(--bg-primary), transparent)`
          }} />
        </motion.div>
      )}

      {/* Progress */}
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>World Progress</span>
          <span style={{ fontSize: '0.8125rem', color: world.color, fontWeight: 700 }}>{worldProgress[worldId]}%</span>
        </div>
        <div className="progress-bar" style={{ height: 6 }}>
          <div className={`progress-fill ${worldId}`} style={{ width: `${worldProgress[worldId]}%` }} />
        </div>
      </div>

      {/* Play Game CTA */}
      <motion.button whileTap={{ scale: 0.96 }}
        className={`btn btn-${worldId} btn-block btn-lg`}
        onClick={() => navigate(getGameRoute())}
        style={{ marginBottom: 20 }}>
        <Gamepad2 size={20} /> Play {world.name.split(' ')[0]} Game
      </motion.button>

      {/* Module Tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 8 }}>
        {modules.map((mod) => (
          <button key={mod.id} onClick={() => setActiveModule(mod.id)}
            style={{
              padding: '8px 16px', borderRadius: 9999, fontSize: '0.8125rem', fontWeight: 600,
              whiteSpace: 'nowrap', border: '1px solid',
              background: activeModule === mod.id ? `${world.color}22` : 'var(--bg-card)',
              borderColor: activeModule === mod.id ? world.color : 'var(--border-subtle)',
              color: activeModule === mod.id ? world.color : 'var(--text-secondary)',
              transition: 'all 0.25s',
            }}>
            {mod.icon} {mod.name}
          </button>
        ))}
      </div>

      {/* Quest Path */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', padding: '16px 0' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 3, background: 'rgba(255,255,255,0.06)', transform: 'translateX(-50%)' }} />
        {filteredQuests.map((quest, i) => {
          const isOdd = i % 2 === 0;
          const icon = quest.status === 'completed' ? <Check size={18} /> : quest.status === 'locked' ? <Lock size={18} /> : quest.type === 'sim' ? <Gamepad2 size={18} /> : quest.type === 'group' ? <UsersIcon size={18} /> : <Play size={16} />;
          const canPlay = quest.status !== 'locked';
          const nodeColor = quest.status === 'completed' ? 'var(--accent-green)' : quest.status === 'locked' ? 'var(--text-muted)' : world.color;
          const nodeBg = quest.status === 'completed' ? 'rgba(16,185,129,0.15)' : quest.status === 'locked' ? 'var(--bg-card)' : `${world.color}22`;

          return (
            <motion.div key={quest.id} initial={{ opacity: 0, x: isOdd ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              style={{
                position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14,
                width: '100%', maxWidth: 320, padding: '8px 0',
                flexDirection: isOdd ? 'row' : 'row-reverse',
                paddingLeft: isOdd ? 16 : 0, paddingRight: isOdd ? 0 : 16,
              }}>
              <div onClick={() => canPlay && (quest.type === 'sim' ? navigate(getGameRoute()) : navigate(`/quest/${worldId}/${quest.id}`))}
                style={{
                  width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, border: '3px solid', cursor: canPlay ? 'pointer' : 'not-allowed', transition: 'all 0.25s',
                  background: nodeBg, borderColor: nodeColor, color: nodeColor,
                  opacity: quest.status === 'locked' ? 0.4 : 1,
                  boxShadow: canPlay && quest.status !== 'completed' ? `0 0 15px ${nodeBg}` : 'none',
                }}>
                {icon}
              </div>
              <div style={{ flex: 1, textAlign: isOdd ? 'left' : 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: isOdd ? 'flex-start' : 'flex-end', flexWrap: 'wrap', marginBottom: 2 }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{quest.title}</h4>
                  {quest.type === 'group' && <span style={{ fontSize: '0.5625rem', padding: '2px 6px', borderRadius: 9999, background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', fontWeight: 600 }}>GROUP</span>}
                  {quest.type === 'sim' && <span style={{ fontSize: '0.5625rem', padding: '2px 6px', borderRadius: 9999, background: `${world.color}22`, color: world.color, fontWeight: 600 }}>GAME</span>}
                </div>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{quest.desc}</p>
                <p style={{ fontSize: '0.625rem', color: 'var(--accent-orange)', fontWeight: 600, marginTop: 2 }}>+{quest.xp} XP</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
