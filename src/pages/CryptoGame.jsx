import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import GeminiFeedback from '../components/GeminiFeedback';

const SCENARIOS = [
  {
    id: 'defi_summer',
    name: 'DeFi Summer',
    year: '2020',
    emoji: '🌞',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
    desc: "Yield farming is printing money. Everyone's an expert.",
    rugs: 4, moons: 14, crabs: 7,
    baseMultiplier: 1.4,
    lesson: "DeFi Summer 2020 saw protocols like Compound and Uniswap explode. Early farmers made fortunes — but many protocols were unaudited and rugged overnight. Knowing when to exit separates winners from victims.",
  },
  {
    id: 'ftx_collapse',
    name: 'FTX Collapse',
    year: '2022',
    emoji: '💥',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.25)',
    desc: "Everything looks fine. SBF is on magazine covers.",
    rugs: 12, moons: 4, crabs: 9,
    baseMultiplier: 1.8,
    lesson: "November 2022: FTX collapsed in 72 hours, erasing $32B in value. On-chain data showed warning signs weeks earlier — but FOMO kept people in. Due diligence and exit plans aren't optional.",
  },
  {
    id: 'btc_halving',
    name: 'BTC Halving',
    year: '2024',
    emoji: '⚡',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.25)',
    desc: "Supply shock incoming. Institutions are buying.",
    rugs: 3, moons: 10, crabs: 12,
    baseMultiplier: 1.25,
    lesson: "Bitcoin halvings reduce miner rewards by 50%, historically preceding major rallies. The 2024 halving led to all-time highs — but patience was required. Steady hands and long time horizons win in macro cycles.",
  },
  {
    id: 'memecoin',
    name: 'Memecoin Season',
    year: '2023',
    emoji: '🐸',
    color: '#fbb03b',
    glow: 'rgba(251,176,59,0.25)',
    desc: "PEPE is up 5000%. Your coworker just quit to trade full-time.",
    rugs: 9, moons: 9, crabs: 7,
    baseMultiplier: 2.2,
    lesson: "Memecoin seasons are pure sentiment-driven volatility. PEPE, BONK, and WIF generated massive returns — for the first 48 hours. 95% of memecoins lose 99% of value within months. High reward means very high risk.",
  },
];

function buildBoard(scenario) {
  const pool = [
    ...Array(scenario.rugs).fill('rug'),
    ...Array(scenario.moons).fill('moon'),
    ...Array(scenario.crabs).fill('crab'),
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function calcMultiplier(revealed, scenario) {
  const moons = revealed.filter((r) => r === 'moon').length;
  const crabs = revealed.filter((r) => r === 'crab').length;
  return Math.round((1 + moons * scenario.baseMultiplier * 0.3 + crabs * 0.02) * 100) / 100;
}

const CELL_META = {
  moon: { icon: '🚀', color: '#10b981', bg: 'rgba(16,185,129,0.18)', border: '#10b981' },
  rug: { icon: '💀', color: '#ef4444', bg: 'rgba(239,68,68,0.18)', border: '#ef4444' },
  crab: { icon: '🦀', color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: '#334155' },
};

const BET_OPTIONS = [100, 250, 500, 1000];

export default function CryptoGame() {
  const navigate = useNavigate();
  const {
    virtualCash = 2000,
    updateVirtualCash,
    addXP,
    setCrashBestMultiplier,
    cryptoCrashBestMultiplier,
  } = useGameState();

  const [screen, setScreen] = useState('pick');
  const [scenario, setScenario] = useState(null);
  const [bet, setBet] = useState(250);
  const [board, setBoard] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [revealedIdx, setRevealedIdx] = useState(new Set());
  const [multiplier, setMultiplier] = useState(1);
  const [phase, setPhase] = useState('playing');
  const [shaking, setShaking] = useState(false);
  const [cashOutValue, setCashOutValue] = useState(0);
  const [localBalance, setLocalBalance] = useState(null);

  const displayBalance = localBalance ?? virtualCash;

  const startGame = useCallback(() => {
    const newBoard = buildBoard(scenario);
    setBoard(newBoard);
    setRevealed([]);
    setRevealedIdx(new Set());
    setMultiplier(1);
    setPhase('playing');
    setCashOutValue(0);
    setLocalBalance((prev) => (prev ?? virtualCash) - bet);
    if (updateVirtualCash) updateVirtualCash(-bet);
    setScreen('game');
  }, [scenario, bet, virtualCash, updateVirtualCash]);

  const revealCell = useCallback((idx) => {
    if (phase !== 'playing' || revealedIdx.has(idx)) return;
    const type = board[idx];
    const newRevealed = [...revealed, type];
    const newIdx = new Set([...revealedIdx, idx]);
    setRevealedIdx(newIdx);
    setRevealed(newRevealed);

    if (type === 'rug') {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      setPhase('rugged');
      if (addXP) addXP(10);
      setTimeout(() => setScreen('result'), 1600);
    } else {
      setMultiplier(calcMultiplier(newRevealed, scenario));
    }
  }, [phase, revealedIdx, board, revealed, scenario, addXP]);

  const cashOut = useCallback(() => {
    if (phase !== 'playing' || revealed.length === 0) return;
    const val = Math.floor(bet * multiplier);
    setCashOutValue(val);
    setPhase('cashed');
    setLocalBalance((prev) => (prev ?? virtualCash) + val);
    if (updateVirtualCash) updateVirtualCash(val);
    if (addXP) addXP(10 + Math.floor(multiplier * 15));
    if (setCrashBestMultiplier) setCrashBestMultiplier(multiplier);
    setTimeout(() => setScreen('result'), 1200);
  }, [phase, revealed, bet, multiplier, virtualCash, updateVirtualCash, addXP, setCrashBestMultiplier]);

  const safeRevealed = revealed.filter((r) => r !== 'rug').length;
  const profit = phase === 'cashed' ? cashOutValue - bet : -bet;

  return (
    <div className="page-content" style={{ paddingBottom: 40 }}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          15%{transform:translateX(-10px)}
          30%{transform:translateX(10px)}
          45%{transform:translateX(-7px)}
          60%{transform:translateX(7px)}
          75%{transform:translateX(-4px)}
        }
        @keyframes cell-reveal {
          0%{transform:scale(0.4) rotate(-15deg);opacity:0}
          65%{transform:scale(1.2) rotate(3deg)}
          100%{transform:scale(1) rotate(0deg);opacity:1}
        }
        @keyframes cash-pulse {
          0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)}
          50%{box-shadow:0 0 0 10px rgba(16,185,129,0)}
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/world/crypto')} style={{ padding: 4 }}>
          <ArrowLeft size={22} color="var(--text-secondary)" />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gradient-crypto)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
          ⛏️
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800 }}>Crypto Chaos</h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Crypto Caverns</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Balance</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--accent-orange)' }}>
            ${displayBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {cryptoCrashBestMultiplier > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '7px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', width: 'fit-content' }}>
          <Trophy size={13} color="var(--accent-orange)" />
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-orange)', fontWeight: 600 }}>Best: {cryptoCrashBestMultiplier}×</span>
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* PICK SCENARIO */}
        {screen === 'pick' && (
          <motion.div key="pick" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Each cell hides a 🚀 moon, 💀 rug, or 🦀 crab. Reveal cells to grow your multiplier — cash out before you get rugged.
            </p>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Choose a market cycle</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SCENARIOS.map((s) => (
                <motion.button key={s.id} whileTap={{ scale: 0.98 }}
                  onClick={() => { setScenario(s); setScreen('bet'); }}
                  style={{
                    background: 'var(--bg-card)', border: `1px solid ${s.color}33`,
                    borderRadius: 'var(--radius-md)', padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}>
                  <span style={{ fontSize: '1.4rem' }}>{s.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: s.color }}>{s.name}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{s.year}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--accent-red)' }}>💀 {s.rugs}</span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--accent-green)' }}>🚀 {s.moons}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* BET */}
        {screen === 'bet' && scenario && (
          <motion.div key="bet" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <button onClick={() => setScreen('pick')} style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> back
            </button>
            <div className="card" style={{ padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{scenario.emoji}</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: scenario.color, marginBottom: 4 }}>
                {scenario.name} — {scenario.year}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{scenario.desc}</p>
            </div>
            <div className="card" style={{ padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Place your bet</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {BET_OPTIONS.filter((v) => v <= displayBalance).map((v) => (
                  <button key={v} onClick={() => setBet(v)}
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      border: `1px solid ${bet === v ? scenario.color : 'var(--border-glass)'}`,
                      background: bet === v ? `${scenario.color}22` : 'transparent',
                      color: bet === v ? scenario.color : 'var(--text-secondary)',
                      fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.15s',
                    }}>${v}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>You're betting</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: scenario.color }}>${bet}</span>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={startGame}
              className="btn btn-crypto btn-block btn-lg"
              style={{ boxShadow: `0 4px 20px ${scenario.glow}` }}>
              <Zap size={18} /> Enter the Field
            </motion.button>
          </motion.div>
        )}

        {/* GAME */}
        {screen === 'game' && scenario && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ animation: shaking ? 'shake 0.55s ease' : 'none' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Multiplier', value: `${multiplier}×`, color: multiplier >= 2 ? 'var(--accent-green)' : 'var(--text-primary)' },
                { label: 'Potential', value: `$${Math.floor(bet * multiplier).toLocaleString()}`, color: 'var(--accent-orange)' },
                { label: 'Safe opens', value: safeRevealed, color: 'var(--text-secondary)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card" style={{ flex: 1, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 900, color }}>{value}</div>
                </div>
              ))}
            </div>

            {phase === 'rugged' && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 12, textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-red)' }}>
                💀 RUGGED — You lost ${bet.toLocaleString()}
              </motion.div>
            )}
            {phase === 'cashed' && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid var(--accent-green)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 12, textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                ✅ Cashed out ${cashOutValue.toLocaleString()} at {multiplier}×!
              </motion.div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
              {board.map((type, idx) => {
                const isRevealed = revealedIdx.has(idx);
                const meta = CELL_META[type];
                return (
                  <button key={idx} onClick={() => revealCell(idx)}
                    disabled={phase !== 'playing' || isRevealed}
                    style={{
                      aspectRatio: '1', borderRadius: 8,
                      border: `1px solid ${isRevealed ? `${meta.border}55` : 'var(--border-glass)'}`,
                      background: isRevealed ? meta.bg : 'var(--bg-card)',
                      cursor: phase === 'playing' && !isRevealed ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isRevealed ? '1.2rem' : '0',
                      transition: 'all 0.15s',
                      animation: isRevealed ? 'cell-reveal 0.3s ease forwards' : 'none',
                    }}>
                    {isRevealed ? meta.icon : (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--border-glass)' }} />
                    )}
                  </button>
                );
              })}
            </div>

            {phase === 'playing' && revealed.length > 0 && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={cashOut}
                style={{
                  width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
                  border: 'none', color: '#080b12', fontWeight: 900, fontSize: '0.9rem',
                  cursor: 'pointer', fontFamily: 'var(--font-display)',
                  animation: 'cash-pulse 2s infinite',
                }}>
                CASH OUT — ${Math.floor(bet * multiplier).toLocaleString()}
              </motion.button>
            )}
            {phase === 'playing' && revealed.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '8px 0' }}>
                Tap any cell to begin. Cash out anytime after your first reveal.
              </p>
            )}
          </motion.div>
        )}

        {/* RESULT */}
        {screen === 'result' && scenario && (
          <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card" style={{
              padding: 24, marginBottom: 14, textAlign: 'center',
              borderColor: profit >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
              background: profit >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>{profit >= 0 ? '🏆' : '💀'}</div>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                {profit >= 0 ? 'You cashed out' : 'You got rugged'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {profit >= 0 ? `+$${profit.toLocaleString()}` : `-$${bet.toLocaleString()}`}
              </div>
              {profit >= 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                  {multiplier}× multiplier · {safeRevealed} safe cells
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Balance: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${displayBalance.toLocaleString()}</span>
              </div>
            </div>

            <GeminiFeedback
              gameType="crypto"
              gameState={{
                cashedOut: profit >= 0,
                pnlAmount: profit,
                pnlPct: Math.round((profit / bet) * 100),
                moves: safeRevealed,
                scenarioName: scenario.name,
                scenarioYear: scenario.year,
                lesson: scenario.lesson,
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen('bet')}
                style={{
                  flex: 1, padding: '13px', borderRadius: 'var(--radius-md)',
                  background: 'transparent', border: `1px solid ${scenario.color}44`,
                  color: scenario.color, fontWeight: 700, fontSize: '0.85rem',
                  fontFamily: 'var(--font-display)',
                }}>
                Play Again
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen('pick')}
                className="btn btn-crypto" style={{ flex: 1, padding: '13px' }}>
                New Scenario
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}