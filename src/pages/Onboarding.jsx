import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { WORLDS, DAILY_GOALS } from '../data/skills';

const bgLight = '#4d7f5c'; // Darker sage green base
const bgDark = '#416a4d';  // Even darker sage for gradient
const headerTeal = '#dceddd'; // Lighter text color to contrast dark background
const amber = '#f39c12';
const amberDark = '#d68910';
const cardSage = '#385c43'; // Darker card background
const textMuted = 'rgba(255,255,255,0.7)';

// Fewer, larger coins for onboarding (sparser than login)
const COINS = [
  { top: '2%', left: '6%', size: 58, delay: 0 },
  { top: '6%', left: '70%', size: 46, delay: 0.5 },
  { top: '16%', left: '82%', size: 62, delay: 0.9 },
  { top: '35%', left: '2%', size: 44, delay: 1.0 },
  { top: '55%', left: '80%', size: 54, delay: 0.3 },
  { top: '70%', left: '8%', size: 40, delay: 1.2 },
  { top: '80%', left: '65%', size: 68, delay: 0.7 },
  { top: '90%', left: '20%', size: 48, delay: 0.4 },
  { top: '92%', left: '82%', size: 42, delay: 1.1 },
];

function FloatingCoins() {
  return (
    <>
      {COINS.map((c, i) => (
        <motion.div key={i}
          initial={{ y: 0 }}
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 3.5 + c.delay, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
          style={{ position: 'absolute', top: c.top, left: c.left, pointerEvents: 'none', zIndex: 0 }}>
          <img src="/coin.png" alt="" style={{ width: c.size, height: c.size, objectFit: 'contain', opacity: 0.8, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.3))' }} />
        </motion.div>
      ))}
    </>
  );
}

const steps = ['welcome', 'worlds', 'goal', 'ready'];

const slide = { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 }, transition: { duration: 0.28 } };

export default function Onboarding() {
  const { completeOnboarding } = useGameState();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [localName, setLocalName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(10);

  const handleFinish = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      completeOnboarding({ username: localName || 'Investor', dailyGoal });
      navigate('/');
    }
  };

  const goals = [
    { minutes: 5, label: '5 min/day' },
    { minutes: 10, label: '10 min/day' },
    { minutes: 15, label: '15 min/day' },
    { minutes: 30, label: '30 min/day' },
  ];

  return (
    <div style={{
      minHeight: '100dvh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'fixed', top: 0, left: 0, overflowY: 'auto'
    }}>
      <FloatingCoins />

      <div style={{
        width: '100%', maxWidth: 480, minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        padding: '24px 28px 40px', boxSizing: 'border-box', position: 'relative', zIndex: 1
      }}>
        
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 12, padding: '20px 0 40px', justifyContent: 'center' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: i <= step ? headerTeal : 'rgba(26,83,92,0.2)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">

            {/* Step 0: Welcome / Landing */}
            {step === 0 && (
              <motion.div key="welcome" {...slide}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ marginBottom: 48 }}>
                  <img src="/coin.png" alt="" style={{ width: 200, height: 200, objectFit: 'contain', filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.15))' }} />
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 900, color: '#fff', lineHeight: 1.15, textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  Start your investing journey!
                </h1>
              </motion.div>
            )}

            {/* Step 1: Worlds */}
            {step === 1 && (
              <motion.div key="worlds" {...slide} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ marginBottom: 36, textAlign: 'center' }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: headerTeal, marginBottom: 8 }}>Your Journey:</h1>
                  <p style={{ color: headerTeal, fontSize: '1.125rem', fontWeight: 700, opacity: 0.8 }}>Each world teaches different money skills.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {WORLDS.map((w) => (
                    <div key={w.id} style={{
                      background: amber,
                      borderRadius: 20, padding: '24px',
                      display: 'flex', alignItems: 'center', gap: 20,
                      boxShadow: '0 8px 0 rgba(0,0,0,0.1)',
                    }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: 14,
                        background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                      }}>{w.icon}</div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 900, fontSize: '1.125rem', color: headerTeal, marginBottom: 4 }}>{w.name}</h3>
                        <p style={{ fontSize: '0.875rem', color: headerTeal, opacity: 0.75, fontWeight: 700, lineHeight: 1.4 }}>{w.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Daily Goal */}
            {step === 2 && (
              <motion.div key="goal" {...slide} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: headerTeal, marginBottom: 8 }}>Daily Goal</h1>
                  <p style={{ color: headerTeal, fontSize: '1.125rem', fontWeight: 700, opacity: 0.8 }}>How much time can you spend learning?</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {goals.map((g) => (
                    <button key={g.minutes} onClick={() => setDailyGoal(g.minutes)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 20,
                        padding: '22px 28px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: amber,
                        color: headerTeal,
                        fontWeight: 900, fontSize: '1.25rem',
                        boxShadow: dailyGoal === g.minutes ? '0 0 0 4px #fff, 0 8px 0 rgba(0,0,0,0.2)' : '0 8px 0 rgba(0,0,0,0.1)',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}>
                      <div style={{ 
                        width: 28, height: 28, borderRadius: 6, 
                        border: `4px solid ${headerTeal}`, 
                        background: dailyGoal === g.minutes ? headerTeal : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {dailyGoal === g.minutes && <div style={{ width: 12, height: 12, background: '#fff', borderRadius: 2 }} />}
                      </div>
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Ready */}
            {step === 3 && (
              <motion.div key="ready" {...slide}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ marginBottom: 48 }}>
                  <img src="/coin.png" alt="" style={{ width: 160, height: 160, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))' }} />
                </div>
                
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: 32, textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  You're All Set!
                </h1>
                
                <div style={{ width: '100%', maxWidth: 340 }}>
                  <input
                autoFocus
                placeholder="Name"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFinish()}
                style={{
                  width: '100%', padding: '16px 20px', borderRadius: 16, border: 'none',
                  background: 'rgba(255,255,255,0.2)', fontSize: '1.25rem', fontWeight: 700,
                  color: headerTeal, textAlign: 'center', outline: 'none', marginBottom: 24,
                  '::placeholder': { color: 'rgba(255,255,255,0.4)' }
                }}
              />
                  
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleFinish}
                    style={{
                      width: '100%', padding: '22px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      background: `linear-gradient(135deg, ${amber}, ${amberDark})`,
                      color: '#fff', fontWeight: 900, fontSize: '1.5rem',
                      boxShadow: '0 10px 0 rgba(0,0,0,0.15)',
                    }}>
                    Let's Go!
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* CTA Button (Footer) */}
        {step < 3 && (
          <div style={{ padding: '32px 0 0' }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleFinish}
              style={{
                width: '100%', padding: '20px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${amber}, ${amberDark})`,
                color: '#fff', fontWeight: 900, fontSize: '1.5rem',
                boxShadow: '0 10px 0 rgba(0,0,0,0.15)',
              }}>
              Continue
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
