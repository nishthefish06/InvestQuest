import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_SUBMISSIONS } from '../data/community';
import { WORLDS, QUIZ_DATA } from '../data/skills';
import { useGameState } from '../hooks/useGameState';
import { ChevronUp, ChevronDown, Plus, BookOpen, Send, X, ArrowRight, Heart, Trophy } from 'lucide-react';

const COINS = [
  { id: 1, top: '5%', left: '10%', size: 50, delay: 0, rotate: 15 },
  { id: 2, top: '40%', left: '85%', size: 40, delay: 1, rotate: -10 },
  { id: 3, top: '75%', left: '15%', size: 60, delay: 0.5, rotate: 25 },
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

export default function Community() {
  const navigate = useNavigate();
  const { addXP, completeLesson, loseHeart, hearts, resetHearts } = useGameState();
  const [tab, setTab] = useState('browse');
  const [worldFilter, setWorldFilter] = useState('all');
  const [submissions, setSubmissions] = useState(COMMUNITY_SUBMISSIONS);
  const [voted, setVoted] = useState({});
  const [form, setForm] = useState({ title: '', description: '', lessons: '', world: 'budget' });
  // Lesson player state
  const [playing, setPlaying] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [finished, setFinished] = useState(false);

  // Colors matching the Dashboard aesthetic
  const bgLight = '#4d7f5c'; // Darker sage green base
  const bgDark = '#416a4d';  // Even darker sage for gradient
  const amber = '#f39c12';
  const headerTeal = '#dceddd'; // Lighter text color to contrast dark background
  const cardSage = '#385c43'; // Darker card background
  const overlayBg = 'rgba(65, 106, 77, 0.9)'; // Slightly darker/blurrier for modal

  const handleVote = (id, dir) => {
    // Only allow one vote per submission — toggle off if same direction
    if (voted[id] === dir) return; 
    const prev = voted[id];
    let delta = dir === 'up' ? 1 : -1;
    if (prev) delta += prev === 'up' ? -1 : 1; 
    setVoted((v) => ({ ...v, [id]: dir }));
    setSubmissions((s) => s.map((sub) => sub.id === id ? { ...sub, votes: sub.votes + delta } : sub));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    setSubmissions((s) => [{ id: Date.now(), title: form.title, author: 'You', authorAvatar: '⭐', description: form.description, lessons: parseInt(form.lessons) || 5, votes: 1, status: 'voting', tags: ['New'], world: form.world }, ...s]);
    setForm({ title: '', description: '', lessons: '', world: 'budget' });
    setTab('browse');
  };

  const openLesson = (sub) => {
    setPlaying(sub);
    setQIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setTotalXP(0);
    setFinished(false);
    resetHearts();
  };

  const filtered = submissions
    .filter((s) => worldFilter === 'all' || s.world === worldFilter)
    .filter((s) => tab === 'voting' ? s.status === 'voting' : s.status === 'approved')
    .sort((a, b) => b.votes - a.votes);

  // ── LESSON PLAYER (overlay) ──────────────────────────
  if (playing) {
    const questions = QUIZ_DATA[playing.world] || QUIZ_DATA.stocks;
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
        completeLesson(playing.world);
        return;
      }
      setQIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    };

    const handleClose = () => {
      resetHearts();
      setPlaying(null);
    };

    if (finished) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(circle at center, ${bgLight} 0%, ${bgDark} 100%)`, zIndex: 300, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
              style={{ width: 100, height: 100, borderRadius: '50%', background: score >= 3 ? '#27ae60' : amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
              {score >= 3 ? '🏆' : '💪'}
            </motion.div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: 8, color: headerTeal }}>
              {score >= 3 ? 'Great Job!' : 'Keep Practicing!'}
            </h1>
            <p style={{ color: headerTeal, marginBottom: 4 }}>
              <strong>{playing.title}</strong>
            </p>
            <p style={{ color: headerTeal, opacity: 0.8, marginBottom: 20 }}>You scored {score}/{total}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'rgba(255,255,255,0.2)', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.3)', marginBottom: 32 }}>
              <Trophy size={20} color={headerTeal} />
              <span style={{ fontWeight: 900, fontFamily: 'var(--font-display)', color: headerTeal, fontSize: '1.25rem' }}>+{totalXP} XP</span>
            </div>
            <button className="btn btn-primary btn-block" style={{ background: headerTeal, color: bgLight, padding: '16px', borderRadius: 24, fontSize: '1.125rem', fontWeight: 800 }} onClick={handleClose}>Done</button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: overlayBg, zIndex: 300, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px 16px', gap: 12 }}>
          <button onClick={handleClose} style={{ padding: 4 }}><X size={26} color={headerTeal} /></button>
          <div style={{ flex: 1, position: 'relative' }}>
            <p style={{ fontSize: '0.6875rem', color: headerTeal, textAlign: 'center', marginBottom: 6, fontWeight: 700 }}>{playing.title}</p>
            <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: amber, borderRadius: 100, width: `${((qIndex + 1) / total) * 100}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart key={i} size={16} fill={i < hearts ? '#e74c3c' : 'none'} color={i < hearts ? '#e74c3c' : headerTeal} opacity={i < hearts ? 1 : 0.4} />
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', color: headerTeal }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.7, marginBottom: 12 }}>Question {qIndex + 1} of {total}</p>
          <AnimatePresence mode="wait">
            <motion.div key={qIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 32, lineHeight: 1.3 }}>{current.question}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {current.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  let borderColor = 'rgba(26,83,92,0.1)';
                  let bg = 'rgba(255,255,255,0.3)';
                  if (revealed) {
                        if (i === current.correct) { borderColor = '#2ecc71'; bg = 'rgba(46, 204, 113, 0.2)'; }
                    else if (i === selected) { borderColor = '#e74c3c'; bg = 'rgba(231, 76, 60, 0.2)'; }
                  }
                  return (
                    <motion.div key={i} whileTap={{ scale: 0.98 }} onClick={() => handleSelect(i)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: bg, border: `3px solid ${borderColor}`, borderRadius: 20, cursor: revealed ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0, color: headerTeal }}>{letter}</div>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: headerTeal }}>{opt}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        {revealed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '20px 24px 32px', background: cardSage, borderTopLeftRadius: 32, borderTopRightRadius: 32, boxShadow: '0 -8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, fontWeight: 800, fontSize: '1rem', color: selected === current.correct ? '#2ecc71' : '#ffb3b3' }}>
              {selected === current.correct ? `✅ Correct! +${current.xp} XP` : `❌ Not quite — the answer was ${String.fromCharCode(65 + current.correct)}`}
            </div>
            <button className="btn btn-primary btn-block btn-lg" style={{ background: amber, color: '#fff', padding: '16px', borderRadius: 24, fontSize: '1.125rem', fontWeight: 800, border: 'none' }} onClick={handleNext}>
              {qIndex + 1 >= total ? 'See Results' : <>Next <ArrowRight size={20} /></>}
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  // ── MAIN COMMUNITY PAGE ──────────────────────────────
  return (
    <div style={{
      minHeight: '100dvh',
      background: `radial-gradient(circle at center, ${bgLight} 0%, ${bgDark} 100%)`,
      color: headerTeal,
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: 20
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <DecorCoins coins={COINS} />
      </div>

      <div className="page-content" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 40 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: amber, letterSpacing: '-0.02em', lineHeight: 1 }}>Community</h1>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: headerTeal, opacity: 0.8, marginTop: 4 }}>Learn & contribute courses</p>
          </div>
          <button onClick={() => setTab('submit')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: 9999, fontWeight: 800, color: headerTeal, border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)', cursor: 'pointer' }}>
            <Plus size={18} /> Submit
          </button>
        </div>

        {/* World Filter */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 12 }}>
          <button onClick={() => setWorldFilter('all')}
            style={{ padding: '8px 16px', borderRadius: 9999, fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap', background: worldFilter === 'all' ? cardSage : 'rgba(255,255,255,0.15)', border: 'none', color: worldFilter === 'all' ? bgLight : headerTeal, transition: 'all 0.2s', boxShadow: worldFilter === 'all' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none' }}>
            All Worlds
          </button>
          {WORLDS.map((w) => (
            <button key={w.id} onClick={() => setWorldFilter(w.id)}
              style={{ padding: '8px 16px', borderRadius: 9999, fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap', background: worldFilter === w.id ? cardSage : 'rgba(255,255,255,0.15)', border: 'none', color: worldFilter === w.id ? bgLight : headerTeal, transition: 'all 0.2s', boxShadow: worldFilter === w.id ? '0 4px 12px rgba(0,0,0,0.08)' : 'none' }}>
              {w.icon} {w.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ id: 'browse', label: '🔥 Popular' }, { id: 'voting', label: '🗳️ Voting' }, { id: 'submit', label: '✏️ Submit' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 16, fontSize: '0.875rem', fontWeight: 800, background: tab === t.id ? amber : 'rgba(255,255,255,0.15)', border: 'none', color: tab === t.id ? '#fff' : headerTeal, transition: 'all 0.2s', boxShadow: tab === t.id ? '0 4px 12px rgba(243,156,18,0.3)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Browse / Voting */}
        {(tab === 'browse' || tab === 'voting') && filtered.map((sub, i) => {
          const w = WORLDS.find((w) => w.id === sub.world);
          return (
            <motion.div key={sub.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: cardSage, padding: 18, borderRadius: 24, marginBottom: 12, cursor: sub.status === 'approved' ? 'pointer' : 'default', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
              onClick={() => sub.status === 'approved' && openLesson(sub)}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleVote(sub.id, 'up')} style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: voted[sub.id] === 'up' ? amber : 'rgba(255,255,255,0.15)', border: 'none', color: voted[sub.id] === 'up' ? '#fff' : headerTeal }}><ChevronUp size={20} /></button>
                  <span style={{ fontWeight: 900, fontSize: '1rem', fontFamily: 'var(--font-display)', color: headerTeal }}>{sub.votes}</span>
                  <button onClick={() => handleVote(sub.id, 'down')} style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: voted[sub.id] === 'down' ? '#e74c3c' : 'rgba(255,255,255,0.15)', border: 'none', color: voted[sub.id] === 'down' ? '#fff' : headerTeal }}><ChevronDown size={20} /></button>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span>{sub.authorAvatar}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: headerTeal }}>{sub.author}</span>
                    {w && <span style={{ fontSize: '0.625rem', padding: '3px 8px', borderRadius: 9999, background: 'rgba(255,255,255,0.2)', color: headerTeal, fontWeight: 800 }}>{w.icon} {w.name.split(' ')[0]}</span>}
                    <span style={{ fontSize: '0.625rem', padding: '3px 8px', borderRadius: 9999, background: sub.status === 'approved' ? '#27ae60' : amber, color: '#fff', fontWeight: 800 }}>{sub.status === 'approved' ? '✅' : '🗳️'} {sub.status}</span>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: 4, color: headerTeal, lineHeight: 1.2 }}>{sub.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: headerTeal, opacity: 0.8, lineHeight: 1.4, marginBottom: 10 }}>{sub.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: headerTeal, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 4 }}><BookOpen size={14} /> {sub.lessons} lessons</span>
                    {sub.tags.map((tag) => <span key={tag} style={{ fontSize: '0.625rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: 'rgba(255,255,255,0.15)', color: headerTeal }}>{tag}</span>)}
                  </div>
                  {sub.status === 'approved' && (
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: '0.8125rem', padding: '6px 16px', borderRadius: 9999, background: headerTeal, color: bgLight, fontWeight: 800, display: 'inline-block' }}>
                        ▶ Start Lesson
                      </span>
                    </div>
                  )}
                  {tab === 'voting' && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: amber, width: `${Math.min((sub.votes / 200) * 100, 100)}%` }} />
                      </div>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: headerTeal, opacity: 0.6, marginTop: 4 }}>{sub.votes}/200 votes for approval</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Submit Form */}
        {tab === 'submit' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ background: cardSage, padding: 24, borderRadius: 32, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 20, color: headerTeal }}>Submit a Course</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: headerTeal, display: 'block', marginBottom: 8 }}>World</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {WORLDS.map((w) => (
                      <button key={w.id} onClick={() => setForm((f) => ({ ...f, world: w.id }))}
                        style={{ flex: 1, padding: '12px 0', borderRadius: 16, fontSize: '1.25rem', background: form.world === w.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', border: form.world === w.id ? `2px solid ${headerTeal}` : '2px solid transparent', transition: 'all 0.2s' }}>
                        {w.icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: headerTeal, display: 'block', marginBottom: 8 }}>Title</label>
                  <input style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.4)', fontSize: '1rem', color: headerTeal, fontWeight: 600, outline: 'none' }} placeholder="e.g. Crypto Tax Guide" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: headerTeal, display: 'block', marginBottom: 8 }}>Description</label>
                  <textarea style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.4)', fontSize: '1rem', color: headerTeal, fontWeight: 600, outline: 'none', minHeight: 100, resize: 'vertical' }} placeholder="What will students learn?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <button onClick={handleSubmit} style={{ width: '100%', padding: '16px', borderRadius: 20, background: headerTeal, color: bgLight, fontSize: '1.125rem', fontWeight: 900, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                  <Send size={20} /> Submit for Voting
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
