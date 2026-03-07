import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { WORLDS, DAILY_GOALS } from '../data/skills';
import { ChevronRight } from 'lucide-react';

const steps = ['welcome', 'worlds', 'goal', 'ready'];

export default function Onboarding() {
  const { completeOnboarding } = useGameState();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(10);

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      completeOnboarding({ username: name || 'Investor', dailyGoal });
      navigate('/');
    }
  };

  const slide = { initial: { opacity: 0, x: 60 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -60 } };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', padding: 24 }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 9999, background: i <= step ? 'var(--accent-purple)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="welcome" {...slide} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>💰</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>Finance Quest</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, marginBottom: 8 }}>
                Master money through <strong>games</strong>, not textbooks.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Three worlds. Infinite skills. Play solo or with friends.
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="worlds" {...slide}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Three Worlds</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>Each world teaches different money skills</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {WORLDS.map((w) => (
                  <div key={w.id} className={`world-card ${w.id}`} style={{ position: 'relative', background: 'var(--bg-card)' }}>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 50, height: 50, borderRadius: 14, background: w.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: `0 0 15px ${w.color}33` }}>
                        {w.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{w.name}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{w.desc}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span className="badge" style={{ background: `${w.color}22`, color: w.color }}>{w.tagline}</span>
                          {w.multiplayer && <span className="badge badge-orange">Multiplayer</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="goal" {...slide}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Daily Goal</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>How much time can you spend learning?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DAILY_GOALS.map((g) => (
                  <button key={g.id} onClick={() => setDailyGoal(g.minutes)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                      background: dailyGoal === g.minutes ? 'rgba(168,85,247,0.12)' : 'var(--bg-card)',
                      border: `2px solid ${dailyGoal === g.minutes ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                      borderRadius: 'var(--radius-md)', transition: 'all 0.25s', textAlign: 'left',
                    }}>
                    <span style={{ fontSize: '1.5rem' }}>{g.icon}</span>
                    <span style={{ fontWeight: 600 }}>{g.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="ready" {...slide} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>🚀</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, marginBottom: 8 }}>You're All Set!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 20 }}>
                Choose a name and start your financial journey
              </p>
              <input className="input-field" placeholder="Enter your name..."
                value={name} onChange={(e) => setName(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.125rem', maxWidth: 280, margin: '0 auto', display: 'block' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                You start with <strong style={{ color: 'var(--accent-green)' }}>$5,000</strong> virtual cash to share with buddies
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button className="btn btn-primary btn-block btn-lg" onClick={next}
        whileTap={{ scale: 0.96 }} style={{ marginTop: 24 }}>
        {step === steps.length - 1 ? "Let's Go! 🎮" : <>Continue <ChevronRight size={18} /></>}
      </motion.button>
    </div>
  );
}
