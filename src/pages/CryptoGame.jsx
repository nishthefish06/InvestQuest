import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { ArrowLeft, ArrowUpRight, AlertOctagon, TrendingUp, Trophy } from 'lucide-react';

export default function CryptoGame() {
  const navigate = useNavigate();
  const { virtualCash, cryptoCrashBestMultiplier, setCrashBestMultiplier, updateVirtualCash, addXP } = useGameState();
  
  const [phase, setPhase] = useState('bet'); // bet | flying | rugged | cashed_out
  const [betAmount, setBetAmount] = useState(100);
  const [multiplier, setMultiplier] = useState(1.0);
  const [rugPoint, setRugPoint] = useState(0);
  const [chartData, setChartData] = useState([]);
  
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize a new round
  const startRound = () => {
    if (betAmount > virtualCash || betAmount <= 0) return;
    updateVirtualCash(-betAmount); // Deduct bet
    
    // Generate a random rug point (heavy weight towards early crashes, rare moons)
    const raw = Math.random();
    let crashAt;
    if (raw < 0.5) crashAt = 1.1 + (Math.random() * 0.9); // 50% chance 1.1x - 2.0x
    else if (raw < 0.8) crashAt = 2.0 + (Math.random() * 3.0); // 30% chance 2.0x - 5.0x
    else if (raw < 0.95) crashAt = 5.0 + (Math.random() * 10.0); // 15% chance 5.0x - 15.0x
    else crashAt = 15.0 + (Math.random() * 85.0); // 5% chance MOON (15.0x - 100.0x)
    
    setRugPoint(crashAt);
    setMultiplier(1.0);
    setChartData([{ time: 0, mult: 1.0 }]);
    setPhase('flying');
  };

  // The soaring logic
  useEffect(() => {
    if (phase !== 'flying') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    let ticks = 0;
    let currentMult = 1.0;

    timerRef.current = setInterval(() => {
      ticks++;
      // The multiplier grows exponentially faster over time
      const growthRate = 1.001 + (ticks * 0.0001); 
      currentMult *= growthRate;

      if (currentMult >= rugPoint) {
        // Boom. Rug pulled.
        clearInterval(timerRef.current);
        setMultiplier(rugPoint); // snap to exact death point
        setPhase('rugged');
      } else {
        setMultiplier(currentMult);
        setChartData((prev) => {
          const newData = [...prev, { time: ticks, mult: currentMult }];
          return newData.length > 50 ? newData.slice(newData.length - 50) : newData; // keep chart array small
        });
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [phase, rugPoint]);

  const cashOut = () => {
    if (phase !== 'flying') return;
    clearInterval(timerRef.current);
    setPhase('cashed_out');
    
    const profit = Math.floor(betAmount * multiplier);
    updateVirtualCash(profit); // Award winnings
    
    const xpEarned = Math.floor(multiplier * 10);
    addXP(xpEarned);

    if (multiplier > cryptoCrashBestMultiplier) {
      setCrashBestMultiplier(multiplier);
    }
  };

  const currentDisplayVal = Math.floor(betAmount * multiplier);

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => navigate('/world/crypto')} style={{ padding: 4 }}><ArrowLeft size={22} color="var(--text-secondary)" /></button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800 }}>🚀 To The Moon</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Available Cash</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent-orange)' }}>
            ${virtualCash.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', background: phase === 'rugged' ? 'linear-gradient(to bottom, #450a0a, var(--bg-card))' : 'var(--bg-card)' }} ref={containerRef}>
        
        {/* The Graphic / Chart Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          
          <AnimatePresence mode="popLayout">
            {phase === 'bet' && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>🐕</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>Cash out before the crash!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Meme coins are volatile. Don't get greedy.</p>
              </motion.div>
            )}

            {phase === 'flying' && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', zIndex: 10 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '5rem', fontWeight: 900, color: 'var(--accent-green)', textShadow: '0 0 40px rgba(16, 185, 129, 0.4)', lineHeight: 1 }}>
                  {multiplier.toFixed(2)}x
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 8 }}>
                  Potential: <span style={{ color: 'white' }}>${currentDisplayVal.toLocaleString()}</span>
                </div>
              </motion.div>
            )}

            {phase === 'cashed_out' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ textAlign: 'center', zIndex: 10 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-crypto)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)' }}>
                  <TrendingUp size={40} color="white" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-green)', marginBottom: 8 }}>
                  +{multiplier.toFixed(2)}x
                </h2>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>You secured <span style={{ color: 'white', fontWeight: 700 }}>${currentDisplayVal.toLocaleString()}</span>!</p>
              </motion.div>
            )}

            {phase === 'rugged' && (
              <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.6 }} style={{ textAlign: 'center', zIndex: 10 }}>
                <AlertOctagon size={80} color="var(--accent-red)" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 900, color: 'var(--accent-red)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                  RUGGED!
                </h2>
                <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>Crashed at exactly <span style={{ color: 'white', fontWeight: 700 }}>{multiplier.toFixed(2)}x</span></p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 8 }}>Investment lost.</p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Controls Area */}
        <div style={{ padding: 20, background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-glass)' }}>
          {phase === 'bet' || phase === 'rugged' || phase === 'cashed_out' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>Bet Amount ($)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setBetAmount(Math.max(10, betAmount - 50))} style={{ flex: 1 }}>- $50</button>
                  <input 
                    type="number" 
                    value={betAmount} 
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="form-input" 
                    style={{ flex: 2, textAlign: 'center', fontSize: '1.125rem', fontWeight: 700 }}
                  />
                  <button className="btn btn-secondary" onClick={() => setBetAmount(betAmount + 50)} style={{ flex: 1 }}>+ $50</button>
                </div>
              </div>
              <button 
                className="btn btn-crypto btn-lg btn-block" 
                onClick={startRound}
                disabled={betAmount > virtualCash || betAmount <= 0}
                style={{ fontSize: '1.25rem' }}
              >
                🚀 Launch {betAmount ? `$${betAmount}` : ''}
              </button>
            </div>
          ) : (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="btn btn-lg btn-block" 
              onClick={cashOut}
              style={{ background: 'var(--accent-green)', color: 'black', height: 80, fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 900, boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)', borderRadius: 16 }}
            >
              CASH OUT
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <Trophy size={14} color="var(--accent-orange)" /> Best Multiplier: <span style={{ color: 'white', fontWeight: 700 }}>{cryptoCrashBestMultiplier > 0 ? `${cryptoCrashBestMultiplier.toFixed(2)}x` : 'None'}</span>
      </div>
    </div>
  );
}
