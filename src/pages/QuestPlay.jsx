import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { QUESTS } from '../data/skills';
import { fetchLesson, generateQuizQuestions } from '../services/gemini';
import { X, Heart, Trophy, ArrowRight, Sparkles, SkipForward, Loader2, Eye } from 'lucide-react';

// ── Word-by-word streaming text ───────────────────────────────────────────────
function StreamingText({ text, onDone, speed = 38 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const wordsRef = useRef([]);

  useEffect(() => {
    wordsRef.current = text.split(' ');
    indexRef.current = 0;
    setDisplayed('');
    setDone(false);

    const tick = () => {
      if (indexRef.current >= wordsRef.current.length) {
        setDone(true);
        onDone?.();
        return;
      }
      setDisplayed(wordsRef.current.slice(0, indexRef.current + 1).join(' '));
      indexRef.current++;
      setTimeout(tick, speed);
    };
    const t = setTimeout(tick, speed);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && (
        <span style={{
          display: 'inline-block', width: 2, height: '1em',
          background: '#fbb03b', marginLeft: 3, verticalAlign: 'middle',
          animation: 'iq-blink 0.6s step-end infinite'
        }} />
      )}
    </span>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function Bubble({ block, onDone, isActive }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}
    >
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #fbb03b, #e8a838)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', boxShadow: '0 0 10px rgba(251,176,59,0.35)',
        marginTop: 2
      }}>
        {block.emoji || '✨'}
      </div>
      {/* Bubble */}
      <div style={{
        flex: 1,
        background: 'rgba(168,85,247,0.08)',
        border: '1px solid rgba(168,85,247,0.2)',
        borderRadius: '4px 16px 16px 16px',
        padding: '12px 16px',
        fontSize: '0.9375rem',
        lineHeight: 1.65,
        color: 'var(--text-primary)',
      }}>
        {isActive
          ? <StreamingText text={block.text} onDone={onDone} />
          : block.text
        }
      </div>
    </motion.div>
  );
}

// ── Tap-to-reveal card ────────────────────────────────────────────────────────
function RevealCard({ block, onDone }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (flipped) return;
    setFlipped(true);
    setTimeout(() => onDone?.(), 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{ marginBottom: 16, marginLeft: 44 }}
    >
      <motion.div
        onClick={handleFlip}
        whileTap={{ scale: 0.97 }}
        style={{
          borderRadius: 16,
          border: flipped ? '1.5px solid rgba(168,85,247,0.4)' : '1.5px dashed rgba(168,85,247,0.35)',
          background: flipped ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.04)',
          padding: '14px 18px',
          cursor: flipped ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          minHeight: 60,
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
          {flipped ? block.emoji : '👆'}
        </span>
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.p key="hint"
              initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, fontStyle: 'italic' }}
            >
              {block.hint}
            </motion.p>
          ) : (
            <motion.p key="fact"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.55, fontWeight: 500 }}
            >
              {block.fact}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Poll block ────────────────────────────────────────────────────────────────
function PollBlock({ block, onDone }) {
  const [picked, setPicked] = useState(null);

  const handlePick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    setTimeout(() => onDone?.(), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{ marginBottom: 16, marginLeft: 44 }}
    >
      {/* Question bubble */}
      <div style={{
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '4px 16px 16px 16px',
        padding: '12px 16px', marginBottom: 10,
        fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <span>🤔</span> {block.question}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: picked !== null ? 10 : 0 }}>
        {block.options.map((opt, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePick(i)}
            style={{
              padding: '8px 16px', borderRadius: 20,
              border: picked === i
                ? '1.5px solid #fbb03b'
                : picked !== null
                  ? '1.5px solid rgba(255,255,255,0.08)'
                  : '1.5px solid rgba(255,255,255,0.15)',
              background: picked === i ? 'rgba(251,176,59,0.15)' : 'rgba(255,255,255,0.05)',
              color: picked === i ? '#fbb03b' : picked !== null ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: '0.875rem', fontWeight: 700,
              cursor: picked !== null ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {opt}
          </motion.button>
        ))}
      </div>

      {/* Gemini reaction */}
      <AnimatePresence>
        {picked !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, #fbb03b, #e8a838)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.875rem'
            }}>✨</div>
            <div style={{
              flex: 1,
              background: 'rgba(251,176,59,0.08)',
              border: '1px solid rgba(251,176,59,0.2)',
              borderRadius: '4px 14px 14px 14px',
              padding: '10px 14px',
              fontSize: '0.875rem', lineHeight: 1.55,
              color: 'var(--text-primary)',
            }}>
              <StreamingText text={block.reactions[picked]} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Interactive Lesson Screen ─────────────────────────────────────────────────
function LessonScreen({ quest, blocks, isLoading, onStartQuiz, onSkip, onClose }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const endRef = useRef(null);
  const allDone = visibleCount >= blocks.length;

  // Show first block once we have blocks
  useEffect(() => {
    if (blocks.length > 0 && visibleCount === 0) {
      setVisibleCount(1);
      setActiveIdx(0);
    }
  }, [blocks.length, visibleCount]);

  // Auto-scroll as new blocks appear
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleCount, waitingForUser]);

  const advanceBlock = useCallback(() => {
    const nextIdx = visibleCount; // 0-based next block
    if (nextIdx >= blocks.length) return;

    const nextBlock = blocks[nextIdx];
    // Reveal and poll require user interaction before advancing further
    if (nextBlock.type === 'reveal' || nextBlock.type === 'poll') {
      setVisibleCount(v => v + 1);
      setActiveIdx(nextIdx);
      setWaitingForUser(true);
    } else {
      setVisibleCount(v => v + 1);
      setActiveIdx(nextIdx);
      setWaitingForUser(false);
    }
  }, [visibleCount, blocks]);

  const handleBlockDone = useCallback((idx) => {
    const isLast = idx === blocks.length - 1;
    if (isLast) {
      setWaitingForUser(false);
      return;
    }
    // For bubbles: auto-advance after short pause
    // For reveal/poll: onDone fires after interaction, auto-advance
    const currentBlock = blocks[idx];
    const delay = currentBlock.type === 'bubble' ? 400 : 300;
    setTimeout(() => advanceBlock(), delay);
  }, [blocks, advanceBlock]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 300,
      display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid var(--border-glass)', flexShrink: 0
      }}>
        <button onClick={onClose} style={{ padding: 4 }}>
          <X size={22} color="var(--text-secondary)" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            borderRadius: 8, padding: '4px 6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src="/coin.png" alt="" style={{ width: 20, height: 20 }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.8125rem',
            background: 'linear-gradient(135deg, #fbb03b, #e8a838)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Gemini AI Tutor
          </span>
        </div>
        <button onClick={onSkip} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', borderRadius: 20,
          background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
          color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
        }}>
          <SkipForward size={13} /> Skip
        </button>
      </div>

      {/* Title */}
      <div style={{ padding: '16px 20px 8px', flexShrink: 0 }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Lesson</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {quest?.title}
        </h2>
      </div>

      {/* Progress dots */}
      {blocks.length > 0 && (
        <div style={{ display: 'flex', gap: 4, padding: '0 20px 12px', flexShrink: 0 }}>
          {blocks.map((_, i) => (
            <div key={i} style={{
              height: 3, borderRadius: 100, transition: 'all 0.4s',
              flex: i < visibleCount ? 2 : 1,
              background: i < visibleCount ? '#fbb03b' : 'rgba(255,255,255,0.1)',
            }} />
          ))}
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', padding: '20px 0' }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: '0.875rem' }}>Gemini is preparing your lesson…</span>
          </div>
        )}

        {blocks.slice(0, visibleCount).map((block, i) => {
          const isActive = i === activeIdx && i === visibleCount - 1;
          if (block.type === 'bubble') return (
            <Bubble key={i} block={block} isActive={isActive}
              onDone={isActive ? () => handleBlockDone(i) : undefined} />
          );
          if (block.type === 'reveal') return (
            <RevealCard key={i} block={block}
              onDone={isActive ? () => handleBlockDone(i) : undefined} />
          );
          if (block.type === 'poll') return (
            <PollBlock key={i} block={block}
              onDone={isActive ? () => handleBlockDone(i) : undefined} />
          );
          return null;
        })}

        <div ref={endRef} />
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px 32px', borderTop: '1px solid var(--border-glass)', flexShrink: 0 }}>
        <AnimatePresence>
          {allDone && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="btn btn-primary btn-block btn-lg"
              onClick={onStartQuiz}
              style={{ gap: 8 }}
            >
              <img src="/coin.png" alt="" style={{ width: 20, height: 20 }} /> Start Quiz
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes iq-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}

// ── Loading Quiz ──────────────────────────────────────────────────────────────
function LoadingQuiz() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 300,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      maxWidth: 480, margin: '0 auto', gap: 16
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'iq-pulse 1.5s ease-in-out infinite'
      }}>
        <img src="/coin.png" alt="" style={{ width: 48, height: 48 }} />
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>Building your quiz…</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Gemini is generating questions based on your lesson</p>
      <style>{`@keyframes iq-pulse { 0%,100%{box-shadow:0 0 30px rgba(168,85,247,0.5)} 50%{box-shadow:0 0 50px rgba(168,85,247,0.8)} }`}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function QuestPlay() {
  const { worldId, questId } = useParams();
  const navigate = useNavigate();
  const { addXP, loseHeart, hearts, completeLesson, resetHearts } = useGameState();

  const [phase, setPhase] = useState('lesson');
  const [blocks, setBlocks] = useState([]);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const lessonTextRef = useRef(''); // flat text for quiz generation

  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);

  const quest = QUESTS[worldId]?.find((q) => q.id === questId) || { title: 'Lesson', xp: 50 };

  // Fetch structured lesson on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoadingLesson(true);
    setBlocks([]);
    lessonTextRef.current = '';

    fetchLesson(quest.title, worldId).then(fetchedBlocks => {
      if (cancelled) return;
      setBlocks(fetchedBlocks);
      // Build flat text from bubbles + reveal facts for quiz generation
      lessonTextRef.current = fetchedBlocks
        .map(b => b.type === 'bubble' ? b.text : b.type === 'reveal' ? b.fact : '')
        .filter(Boolean).join(' ');
      setIsLoadingLesson(false);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questId, worldId]);

  const handleStartQuiz = async () => {
    setPhase('loading_quiz');
    try {
      const qs = await generateQuizQuestions(quest.title, lessonTextRef.current, worldId);
      setQuestions(qs);
    } catch { /* generateQuizQuestions always returns fallback */ }
    setPhase('quiz');
  };

  const handleSkip = () => {
    setIsLoadingLesson(false);
    handleStartQuiz();
  };

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const current = questions[qIndex];
    if (idx === current.correct) {
      setScore(s => s + 1);
      setTotalXP(s => s + current.xp);
      addXP(current.xp);
    } else {
      loseHeart();
    }
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      setPhase('finished');
      completeLesson(worldId);
      return;
    }
    setQIndex(i => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  const handleClose = () => {
    resetHearts();
    navigate(`/world/${worldId}`);
  };

  if (phase === 'lesson') {
    return (
      <LessonScreen
        quest={quest}
        blocks={blocks}
        isLoading={isLoadingLesson}
        onStartQuiz={handleStartQuiz}
        onSkip={handleSkip}
        onClose={handleClose}
      />
    );
  }

  if (phase === 'loading_quiz') return <LoadingQuiz />;

  if (phase === 'finished') {
    const total = questions.length;
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 300,
        display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto'
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
            style={{
              width: 100, height: 100, borderRadius: '50%',
              background: score >= Math.ceil(total * 0.6) ? 'linear-gradient(135deg, #10b981, #385c43)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: 24
            }}>
            {score >= Math.ceil(total * 0.6) ? '🏆' : '💪'}
          </motion.div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>
            {score >= Math.ceil(total * 0.6) ? 'Great Job!' : 'Keep Practicing!'}
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

  // ── Quiz phase ────────────────────────────────────────────────────────────
  const current = questions[qIndex];
  const total = questions.length;
  if (!current) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 300,
      display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto'
    }}>
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
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 24, lineHeight: 1.3 }}>
              {current.question}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {current.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                let borderColor = 'var(--border-glass)', bg = 'var(--bg-card)';
                if (revealed) {
                  if (i === current.correct) { borderColor = 'var(--accent-green)'; bg = 'rgba(16,185,129,0.1)'; }
                  else if (i === selected) { borderColor = 'var(--accent-red)'; bg = 'rgba(239,68,68,0.1)'; }
                } else if (i === selected) {
                  borderColor = 'var(--accent-purple)'; bg = 'rgba(243,156,18,0.1)';
                }
                return (
                  <motion.div key={i} whileTap={{ scale: 0.98 }} onClick={() => handleSelect(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: bg, border: `2px solid ${borderColor}`, borderRadius: 'var(--radius-lg)', cursor: revealed ? 'default' : 'pointer', transition: 'all 0.2s', fontSize: '0.9375rem' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>
                      {letter}
                    </div>
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
            {qIndex + 1 >= total ? 'See Results' : <><span>Next</span> <ArrowRight size={18} /></>}
          </button>
        </motion.div>
      )}
    </div>
  );
}