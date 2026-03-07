import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { CRYPTO_TOKENS } from '../data/skills';
import { ArrowLeft, RotateCcw, Zap, Skull, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import GeminiFeedback from '../components/GeminiFeedback';

function generateGrid(size, mineCount) {
  const cells = [];
  const minePositions = new Set();
  while (minePositions.size < mineCount) {
    minePositions.add(Math.floor(Math.random() * size * size));
  }
  for (let i = 0; i < size * size; i++) {
    if (minePositions.has(i)) {
      const rugs = CRYPTO_TOKENS.filter((t) => t.isRug);
      const rug = rugs[Math.floor(Math.random() * rugs.length)];
      cells.push({ id: i, type: 'rug', token: rug, value: -100, revealed: false });
    } else {
      const safe = CRYPTO_TOKENS.filter((t) => !t.isRug);
      const token = safe[Math.floor(Math.random() * safe.length)];
      const r = Math.random();
      const value = r < 0.3 ? Math.floor(Math.random() * -30) : r < 0.5 ? 0 : Math.floor(Math.random() * 80) + 5;
      cells.push({ id: i, type: value > 0 ? 'profit' : value < 0 ? 'loss' : 'neutral', token, value, revealed: false });
    }
  }
  return cells;
}

export default function CryptoGame() {
  const navigate = useNavigate();
  const { addXP, setMinesweeperScore } = useGameState();
  const gridSize = 5;
  const mineCount = 4;

  const [grid, setGrid] = useState(() => generateGrid(gridSize, mineCount));
  const [gameOver, setGameOver] = useState(false);
  const [portfolio, setPortfolio] = useState(1000);
  const [moves, setMoves] = useState(0);
  const [cashed, setCashed] = useState(false);

  const revealedCount = grid.filter((c) => c.revealed).length;
  const profitFromMoves = grid.filter((c) => c.revealed && c.type !== 'rug').reduce((s, c) => s + c.value, 0);
  const currentValue = 1000 + (profitFromMoves / 100) * 1000;

  const revealCell = useCallback((id) => {
    if (gameOver || cashed) return;
    const cell = grid.find((c) => c.id === id);
    if (!cell || cell.revealed) return;

    if (cell.type === 'rug') {
      // Game over — reveal all
      setGrid((g) => g.map((c) => ({ ...c, revealed: true })));
      setGameOver(true);
      setPortfolio(0);
      return;
    }

    setGrid((g) => g.map((c) => c.id === id ? { ...c, revealed: true } : c));
    setMoves((m) => m + 1);
    setPortfolio(currentValue + (cell.value / 100) * 1000);
  }, [grid, gameOver, cashed, currentValue]);

  const cashOut = () => {
    if (gameOver || cashed) return;
    setCashed(true);
    const score = Math.max(0, Math.floor(currentValue - 1000));
    const earnedXP = Math.floor(score / 10) + moves * 5;
    addXP(earnedXP);
    setMinesweeperScore(score);
  };

  const reset = () => {
    setGrid(generateGrid(gridSize, mineCount));
    setGameOver(false);
    setCashed(false);
    setPortfolio(1000);
    setMoves(0);
  };

  const displayValue = gameOver ? 0 : currentValue;
  const pnl = displayValue - 1000;
  const pnlPct = ((pnl / 1000) * 100).toFixed(1);

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => navigate('/world/crypto')} style={{ padding: 4 }}><ArrowLeft size={22} color="var(--text-secondary)" /></button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800 }}>⛏️ Crypto Caverns</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reveal tiles to mine profits — avoid rug pulls!</p>
        </div>
      </div>

      {/* Portfolio Card */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Portfolio Value</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem' }}>
              ${displayValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
              color: pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {pnl >= 0 ? '+' : ''}{pnlPct}%
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{moves} tiles revealed</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        {[
          { icon: <TrendingUp size={12} />, label: 'Profit', color: 'var(--accent-green)' },
          { icon: <Minus size={12} />, label: 'Flat', color: 'var(--text-secondary)' },
          { icon: <TrendingDown size={12} />, label: 'Loss', color: 'var(--accent-red)' },
          { icon: <Skull size={12} />, label: 'Rug Pull', color: 'var(--accent-red)' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.625rem', color: l.color }}>{l.icon} {l.label}</div>
        ))}
      </div>

      {/* Minesweeper Grid */}
      <div className="mine-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, maxWidth: 350, margin: '0 auto', marginBottom: 20 }}>
        {grid.map((cell) => (
          <motion.div
            key={cell.id}
            className={`mine-cell ${cell.revealed ? (cell.type === 'rug' ? 'rug' : cell.type) : 'hidden'}`}
            onClick={() => revealCell(cell.id)}
            whileTap={!cell.revealed ? { scale: 0.9 } : {}}
            initial={cell.revealed ? { scale: 0.8, opacity: 0 } : {}}
            animate={{ scale: 1, opacity: 1 }}
          >
            {cell.revealed ? (
              <>
                <span style={{ fontSize: '1rem' }}>{cell.type === 'rug' ? '💀' : cell.token.icon}</span>
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, marginTop: 2 }}>
                  {cell.type === 'rug' ? 'RUG!' : cell.value > 0 ? `+${cell.value}%` : cell.value < 0 ? `${cell.value}%` : '0%'}
                </span>
              </>
            ) : (
              <span style={{ fontSize: '0.875rem', color: 'var(--accent-orange)', opacity: 0.5 }}>⛏️</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      {!gameOver && !cashed && revealedCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button className="btn btn-crypto btn-block btn-lg" onClick={cashOut}
            style={{ marginBottom: 10 }}>
            💰 Cash Out — Take ${displayValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Or keep revealing tiles for more profit (but more risk!)
          </p>
        </motion.div>
      )}

      {/* Game Over */}
      {gameOver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-red)', marginBottom: 8 }}>💀 Rug Pulled!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>You hit a scam coin! Portfolio wiped out.</p>

          <GeminiFeedback gameType="crypto" gameState={{ pnlPct, pnlAmount: pnl, cashedOut: false, moves }} />

          <button className="btn btn-crypto btn-lg" onClick={reset}>
            <RotateCcw size={16} /> Try Again
          </button>
        </motion.div>
      )}

      {/* Cashed Out */}
      {cashed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-green)', marginBottom: 8 }}>💰 Cashed Out!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Smart move knowing when to take profits!</p>
          <div style={{ padding: '10px 20px', background: 'rgba(245,158,11,0.1)', borderRadius: 9999, border: '1px solid rgba(245,158,11,0.2)', display: 'inline-block', marginBottom: 16 }}>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-orange)' }}>
              +{Math.floor(Math.max(0, pnl) / 10) + moves * 5} XP
            </span>
          </div>

          <GeminiFeedback gameType="crypto" gameState={{ pnlPct, pnlAmount: pnl, cashedOut: true, moves }} />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-crypto btn-lg" onClick={reset}><RotateCcw size={16} /> Play Again</button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/world/crypto')}>Back</button>
          </div>
        </motion.div>
      )}

      {/* Tip Card */}
      {!gameOver && !cashed && revealedCount === 0 && (
        <div className="card" style={{ padding: 14, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-orange)', marginBottom: 4 }}>💡 How to Play</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Tap tiles to reveal crypto price movements. Each tile shows a % gain or loss.
            <strong> But beware — {mineCount} tiles are rug pulls</strong> that wipe your portfolio!
            Cash out anytime to keep your gains.
          </p>
        </div>
      )}
    </div>
  );
}
