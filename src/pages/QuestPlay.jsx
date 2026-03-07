import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { QUIZ_DATA } from '../data/skills';
import { X, Heart, Trophy, ArrowRight } from 'lucide-react';

export default function QuestPlay() {
  const { worldId } = useParams();
  const navigate = useNavigate();
  const { addXP, loseHeart, hearts, completeLesson, resetHearts } = useGameState();
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = QUIZ_DATA[worldId] || QUIZ_DATA.stocks;
  const current = questions[qIndex];
  const total = questions.length;

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === current.correct) {
      setScore((s) => s + 1);
      setTotalXP((s) => s + current.xp);
      addXP(current.xp);
    } else {
      loseHeart();
    }
  };

  const handleNext = () => {
    if (qIndex + 1 >= total) {
      setFinished(true);
      completeLesson(worldId);
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  const handleClose = () => {
    resetHearts();
    navigate(`/world/${worldId}`);
  };

  if (finished) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 300, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
            style={{ width: 100, height: 100, borderRadius: '50%', background: score >= 3 ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: 24 }}>
            {score >= 3 ? '🏆' : '💪'}
          </motion.div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>
            {score >= 3 ? 'Great Job!' : 'Keep Practicing!'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>You scored {score}/{total}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'rgba(245,158,11,0.1)', borderRadius: 9999, border: '1px solid rgba(245,158,11,0.2)', marginBottom: 32 }}>
            <Trophy size={20} color="var(--accent-orange)" />
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-orange)', fontSize: '1.25rem' }}>+{totalXP} XP</span>
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleClose}>Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 300, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 }}>
        <button onClick={handleClose} style={{ padding: 4 }}><X size={22} color="var(--text-secondary)" /></button>
        <div style={{ flex: 1 }}>
          <div className="progress-bar" style={{ height: 6 }}>
            <div className={`progress-fill ${worldId}`} style={{ width: `${((qIndex + 1) / total) * 100}%` }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart key={i} size={16} fill={i < hearts ? 'var(--accent-red)' : 'none'} color={i < hearts ? 'var(--accent-red)' : 'var(--text-muted)'} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Question {qIndex + 1} of {total}</p>
        <AnimatePresence mode="wait">
          <motion.div key={qIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 24, lineHeight: 1.3 }}>{current.question}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {current.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                let borderColor = 'var(--border-glass)';
                let bg = 'var(--bg-card)';
                if (revealed) {
                  if (i === current.correct) { borderColor = 'var(--accent-green)'; bg = 'rgba(16,185,129,0.1)'; }
                  else if (i === selected) { borderColor = 'var(--accent-red)'; bg = 'rgba(239,68,68,0.1)'; }
                } else if (i === selected) {
                  borderColor = 'var(--accent-purple)'; bg = 'rgba(168,85,247,0.1)';
                }
                return (
                  <motion.div key={i} whileTap={{ scale: 0.98 }} onClick={() => handleSelect(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: bg, border: `2px solid ${borderColor}`, borderRadius: 'var(--radius-lg)', cursor: revealed ? 'default' : 'pointer', transition: 'all 0.2s', fontSize: '0.9375rem' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>{letter}</div>
                    <span>{opt}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {revealed && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '16px 24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, fontWeight: 700, color: selected === current.correct ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {selected === current.correct ? `✅ Correct! +${current.xp} XP` : `❌ Not quite — the answer was ${String.fromCharCode(65 + current.correct)}`}
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={handleNext}>
            {qIndex + 1 >= total ? 'See Results' : <>Next <ArrowRight size={18} /></>}
          </button>
        </motion.div>
      )}
    </div>
  );
}
