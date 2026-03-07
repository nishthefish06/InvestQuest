import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_SUBMISSIONS } from '../data/community';
import { WORLDS, QUIZ_DATA } from '../data/skills';
import { useGameState } from '../hooks/useGameState';
import { ChevronUp, ChevronDown, Plus, BookOpen, Send, X, ArrowRight, Heart, Trophy } from 'lucide-react';

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

  const handleVote = (id, dir) => {
    // Only allow one vote per submission — toggle off if same direction
    if (voted[id] === dir) return; // already voted this way, no change
    const prev = voted[id];
    let delta = dir === 'up' ? 1 : -1;
    if (prev) delta += prev === 'up' ? -1 : 1; // undo previous vote
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
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 300, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
              style={{ width: 100, height: 100, borderRadius: '50%', background: score >= 3 ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: 24 }}>
              {score >= 3 ? '🏆' : '💪'}
            </motion.div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, marginBottom: 8 }}>
              {score >= 3 ? 'Great Job!' : 'Keep Practicing!'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>{playing.title}</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>You scored {score}/{total}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'rgba(245,158,11,0.1)', borderRadius: 9999, border: '1px solid rgba(245,158,11,0.2)', marginBottom: 32 }}>
              <Trophy size={20} color="var(--accent-orange)" />
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-orange)', fontSize: '1.25rem' }}>+{totalXP} XP</span>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleClose}>Done</button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 300, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 }}>
          <button onClick={handleClose} style={{ padding: 4 }}><X size={22} color="var(--text-secondary)" /></button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 4 }}>{playing.title}</p>
            <div className="progress-bar" style={{ height: 6 }}>
              <div className={`progress-fill ${playing.world}`} style={{ width: `${((qIndex + 1) / total) * 100}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart key={i} size={14} fill={i < hearts ? 'var(--accent-red)' : 'none'} color={i < hearts ? 'var(--accent-red)' : 'var(--text-muted)'} />
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
                  }
                  return (
                    <motion.div key={i} whileTap={{ scale: 0.98 }} onClick={() => handleSelect(i)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: bg, border: `2px solid ${borderColor}`, borderRadius: 'var(--radius-lg)', cursor: revealed ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>{letter}</div>
                      <span style={{ fontSize: '0.875rem' }}>{opt}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        {revealed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '16px 24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, fontWeight: 700, fontSize: '0.875rem', color: selected === current.correct ? 'var(--accent-green)' : 'var(--accent-red)' }}>
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

  // ── MAIN COMMUNITY PAGE ──────────────────────────────
  return (
    <div className="page-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Community 🌍</h1>
            <p className="page-subtitle">Learn from & contribute courses</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setTab('submit')}><Plus size={16} /> Submit</button>
        </div>
      </div>

      {/* World Filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
        <button onClick={() => setWorldFilter('all')}
          style={{ padding: '6px 14px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', background: worldFilter === 'all' ? 'rgba(168,85,247,0.15)' : 'var(--bg-card)', border: `1px solid ${worldFilter === 'all' ? 'var(--accent-purple)' : 'var(--border-subtle)'}`, color: worldFilter === 'all' ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>
          All Worlds
        </button>
        {WORLDS.map((w) => (
          <button key={w.id} onClick={() => setWorldFilter(w.id)}
            style={{ padding: '6px 14px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', background: worldFilter === w.id ? `${w.color}22` : 'var(--bg-card)', border: `1px solid ${worldFilter === w.id ? w.color : 'var(--border-subtle)'}`, color: worldFilter === w.id ? w.color : 'var(--text-secondary)' }}>
            {w.icon} {w.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[{ id: 'browse', label: '🔥 Popular' }, { id: 'voting', label: '🗳️ Voting' }, { id: 'submit', label: '✏️ Submit' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '7px 14px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, background: tab === t.id ? 'rgba(168,85,247,0.15)' : 'var(--bg-card)', border: `1px solid ${tab === t.id ? 'var(--accent-purple)' : 'var(--border-subtle)'}`, color: tab === t.id ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Browse / Voting */}
      {(tab === 'browse' || tab === 'voting') && filtered.map((sub, i) => {
        const w = WORLDS.find((w) => w.id === sub.world);
        return (
          <motion.div key={sub.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="card card-interactive" style={{ padding: 14, marginBottom: 8, cursor: sub.status === 'approved' ? 'pointer' : 'default' }}
            onClick={() => sub.status === 'approved' && openLesson(sub)}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleVote(sub.id, 'up')} style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: voted[sub.id] === 'up' ? 'rgba(168,85,247,0.2)' : 'var(--bg-card)', border: `1px solid ${voted[sub.id] === 'up' ? 'var(--accent-purple)' : 'var(--border-glass)'}`, color: voted[sub.id] === 'up' ? 'var(--accent-purple)' : 'var(--text-secondary)' }}><ChevronUp size={14} /></button>
                <span style={{ fontWeight: 700, fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}>{sub.votes}</span>
                <button onClick={() => handleVote(sub.id, 'down')} style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: voted[sub.id] === 'down' ? 'rgba(239,68,68,0.2)' : 'var(--bg-card)', border: `1px solid ${voted[sub.id] === 'down' ? 'var(--accent-red)' : 'var(--border-glass)'}`, color: voted[sub.id] === 'down' ? 'var(--accent-red)' : 'var(--text-secondary)' }}><ChevronDown size={14} /></button>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span>{sub.authorAvatar}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{sub.author}</span>
                  {w && <span style={{ fontSize: '0.5625rem', padding: '2px 6px', borderRadius: 9999, background: `${w.color}22`, color: w.color, fontWeight: 600 }}>{w.icon} {w.name.split(' ')[0]}</span>}
                  <span className={`badge ${sub.status === 'approved' ? 'badge-green' : 'badge-orange'}`} style={{ padding: '2px 6px' }}>{sub.status === 'approved' ? '✅' : '🗳️'} {sub.status}</span>
                </div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 2 }}>{sub.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3, marginBottom: 6 }}>{sub.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><BookOpen size={10} /> {sub.lessons} lessons</span>
                  {sub.tags.map((tag) => <span key={tag} style={{ fontSize: '0.5625rem', padding: '1px 6px', borderRadius: 9999, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{tag}</span>)}
                </div>
                {sub.status === 'approved' && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: '0.6875rem', padding: '4px 12px', borderRadius: 9999, background: 'rgba(168,85,247,0.12)', color: 'var(--accent-purple)', fontWeight: 600 }}>
                      ▶ Start Lesson
                    </span>
                  </div>
                )}
                {tab === 'voting' && (
                  <div style={{ marginTop: 6 }}>
                    <div className="progress-bar" style={{ height: 4 }}><div className="progress-fill" style={{ width: `${Math.min((sub.votes / 200) * 100, 100)}%` }} /></div>
                    <p style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub.votes}/200 votes for approval</p>
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
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Submit a Course</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>World</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {WORLDS.map((w) => (
                    <button key={w.id} onClick={() => setForm((f) => ({ ...f, world: w.id }))}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, background: form.world === w.id ? `${w.color}22` : 'var(--bg-card)', border: `1px solid ${form.world === w.id ? w.color : 'var(--border-glass)'}`, color: form.world === w.id ? w.color : 'var(--text-secondary)' }}>
                      {w.icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Title</label>
                <input className="input-field" placeholder="e.g. Crypto Tax Guide" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea className="input-field" placeholder="What will students learn?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ minHeight: 80, resize: 'vertical' }} />
              </div>
              <button className="btn btn-primary btn-block" onClick={handleSubmit}><Send size={16} /> Submit for Voting</button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
