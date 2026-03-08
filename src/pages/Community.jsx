import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COMMUNITY_SUBMISSIONS } from '../data/community';
import { WORLDS } from '../data/skills';
import { useGameState } from '../hooks/useGameState';
import { generateCourseTips } from '../services/gemini';
import { ChevronUp, ChevronDown, Plus, Send, X, ExternalLink, CheckCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

// ── Theme colours (shared) ────────────────────────────────────────────────────
const C = {
  bgLight: '#4d7f5c',
  bgDark: '#416a4d',
  amber: '#fbb03b',
  teal: '#dceddd',
  card: '#385c43',
  cardDark: '#2e4d38',
};

// ── Decorative coins ──────────────────────────────────────────────────────────
const COINS = [
  { id: 1, top: '5%', left: '10%', size: 50, delay: 0, rotate: 15 },
  { id: 2, top: '40%', left: '85%', size: 40, delay: 1, rotate: -10 },
  { id: 3, top: '75%', left: '15%', size: 60, delay: 0.5, rotate: 25 },
];
function DecorCoins() {
  return (
    <>
      {COINS.map((c) => (
        <motion.img key={c.id} src="/coin.png" alt=""
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -10, 0], rotate: [c.rotate, c.rotate + 5, c.rotate] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
          style={{
            position: 'absolute', top: c.top, left: c.left, width: c.size, height: c.size,
            objectFit: 'contain', pointerEvents: 'none', zIndex: 0,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
          }} />
      ))}
    </>
  );
}

// ── Tip card swiper ───────────────────────────────────────────────────────────
function TipReader({ sub, tips, onMarkRead, onClose, alreadyRead }) {
  const [idx, setIdx] = useState(0);
  const total = tips.length;
  const tip = tips[idx];
  const isLast = idx === total - 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300, maxWidth: 480, margin: '0 auto',
        background: `radial-gradient(circle at center, ${C.bgLight} 0%, ${C.bgDark} 100%)`,
        display: 'flex', flexDirection: 'column'
      }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px 10px', flexShrink: 0
      }}>
        <button onClick={onClose}><X size={24} color={C.teal} /></button>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: C.teal, opacity: 0.7 }}>
          {idx + 1} / {total}
        </span>
        <div style={{ width: 24 }} />
      </div>

      {/* Progress bar */}
      <div style={{
        margin: '0 20px 16px', height: 4, background: 'rgba(255,255,255,0.1)',
        borderRadius: 100, overflow: 'hidden', flexShrink: 0
      }}>
        <motion.div animate={{ width: `${((idx + 1) / total) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: '100%', background: C.amber, borderRadius: 100 }} />
      </div>

      {/* Course title */}
      <div style={{ padding: '0 20px 16px', flexShrink: 0 }}>
        <p style={{
          fontSize: '0.6875rem', color: C.teal, opacity: 0.6, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4
        }}>
          {sub.authorAvatar} {sub.author}
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 900,
          color: C.amber, lineHeight: 1.2
        }}>{sub.title}</h2>
      </div>

      {/* Tip card */}
      <div style={{
        flex: 1, padding: '0 20px', display: 'flex', flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}
            style={{
              background: C.card, borderRadius: 28, padding: '32px 28px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
            <div style={{ fontSize: '3rem', marginBottom: 20, lineHeight: 1 }}>{tip.emoji}</div>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900,
              color: C.teal, lineHeight: 1.2, marginBottom: 16
            }}>{tip.headline}</h3>
            <p style={{ fontSize: '1rem', color: C.teal, opacity: 0.85, lineHeight: 1.7 }}>
              {tip.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div style={{ padding: '20px 20px 36px', flexShrink: 0 }}>
        {!isLast ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setIdx(i => i + 1)}
            style={{
              width: '100%', padding: '16px', borderRadius: 20, background: C.teal,
              color: C.bgLight, fontSize: '1rem', fontWeight: 900, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
            }}>
            Next Tip <ArrowRight size={18} />
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => !alreadyRead && onMarkRead(sub)}
            style={{
              width: '100%', padding: '16px', borderRadius: 20,
              background: alreadyRead ? 'rgba(255,255,255,0.1)' : C.amber,
              color: alreadyRead ? C.teal : '#fff',
              fontSize: '1rem', fontWeight: 900, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: alreadyRead ? 'default' : 'pointer', opacity: alreadyRead ? 0.7 : 1
            }}>
            <CheckCircle size={20} />
            {alreadyRead ? 'Already Read ✓' : 'Mark as Read · +25 XP'}
          </motion.button>
        )}

        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          {tips.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 18 : 6, height: 6, borderRadius: 100,
              background: i === idx ? C.amber : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s', cursor: 'pointer',
            }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Link reader (for courses with a URL) ──────────────────────────────────────
function LinkReader({ sub, onMarkRead, onClose, alreadyRead }) {
  const w = WORLDS.find((w) => w.id === sub.world);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300, maxWidth: 480, margin: '0 auto',
        background: `radial-gradient(circle at center, ${C.bgLight} 0%, ${C.bgDark} 100%)`,
        display: 'flex', flexDirection: 'column', overflowY: 'auto'
      }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px 14px', flexShrink: 0
      }}>
        <button onClick={onClose}><X size={24} color={C.teal} /></button>
        {w && <span style={{
          fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px',
          borderRadius: 9999, background: 'rgba(255,255,255,0.15)', color: C.teal
        }}>
          {w.icon} {w.name.split(' ')[0]}
        </span>}
        <div style={{ width: 32 }} />
      </div>

      <div style={{ flex: 1, padding: '0 20px 36px' }}>
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: '1.5rem' }}>{sub.authorAvatar}</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: '0.875rem', color: C.teal }}>{sub.author}</p>
            <p style={{ fontSize: '0.6875rem', color: C.teal, opacity: 0.6 }}>Community contributor</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {sub.tags?.map((tag) => (
              <span key={tag} style={{
                fontSize: '0.625rem', fontWeight: 700, padding: '3px 8px',
                borderRadius: 9999, background: 'rgba(255,255,255,0.15)', color: C.teal
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Title + description */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900,
          color: C.amber, lineHeight: 1.2, marginBottom: 14, letterSpacing: '-0.02em'
        }}>
          {sub.title}
        </h1>
        <p style={{ fontSize: '0.9375rem', color: C.teal, lineHeight: 1.7, marginBottom: 24, opacity: 0.9 }}>
          {sub.description}
        </p>

        {/* Resource link */}
        <a href={sub.link} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 12, background: C.card,
            borderRadius: 18, padding: '16px 20px', marginBottom: 24, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.12)'
          }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: `${C.amber}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <ExternalLink size={20} color={C.amber} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 800, color: C.teal, marginBottom: 2 }}>
              Open Resource
            </p>
            <p style={{
              fontSize: '0.75rem', color: C.teal, opacity: 0.55,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {sub.link}
            </p>
          </div>
          <ArrowRight size={16} color={C.amber} />
        </a>

        {/* Votes */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28,
          padding: '10px 16px', background: 'rgba(255,255,255,0.07)', borderRadius: 14
        }}>
          <ChevronUp size={16} color={C.amber} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: C.teal }}>
            {sub.votes} upvotes from the community
          </span>
        </div>

        {/* Mark as Read */}
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => !alreadyRead && onMarkRead(sub)}
          style={{
            width: '100%', padding: '16px', borderRadius: 20,
            background: alreadyRead ? 'rgba(255,255,255,0.08)' : C.teal,
            color: alreadyRead ? C.teal : C.bgLight,
            fontSize: '1rem', fontWeight: 900, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: alreadyRead ? 'default' : 'pointer', opacity: alreadyRead ? 0.7 : 1
          }}>
          <CheckCircle size={20} />
          {alreadyRead ? 'Already Read ✓' : 'Mark as Read · +25 XP'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Loading overlay ───────────────────────────────────────────────────────────
function LoadingTips() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300, maxWidth: 480, margin: '0 auto',
        background: `radial-gradient(circle at center, ${C.bgLight} 0%, ${C.bgDark} 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16
      }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 30px rgba(168,85,247,0.5)',
        animation: 'iq-pulse 1.5s ease-in-out infinite'
      }}>
        <Sparkles size={28} color="white" />
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: C.teal }}>
        Generating tips…
      </p>
      <p style={{ fontSize: '0.875rem', color: C.teal, opacity: 0.6 }}>Gemini is reading this course</p>
      <style>{`@keyframes iq-pulse { 0%,100%{box-shadow:0 0 30px rgba(168,85,247,0.5)} 50%{box-shadow:0 0 50px rgba(168,85,247,0.8)} }`}</style>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Community() {
  const { addXP, completeLesson } = useGameState();

  const [tab, setTab] = useState('browse');
  const [worldFilter, setWorldFilter] = useState('all');
  const [submissions, setSubmissions] = useState(COMMUNITY_SUBMISSIONS);
  const [voted, setVoted] = useState({});
  const [readIds, setReadIds] = useState(new Set());

  // Reader state
  const [readerMode, setReaderMode] = useState(null); // null | 'loading' | 'tips' | 'link'
  const [activeSub, setActiveSub] = useState(null);
  const [activeTips, setActiveTips] = useState([]);

  // Submit form
  const [form, setForm] = useState({ title: '', description: '', link: '', world: 'budget' });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleVote = (id, dir) => {
    if (voted[id] === dir) return;
    const prev = voted[id];
    let delta = dir === 'up' ? 1 : -1;
    if (prev) delta += prev === 'up' ? -1 : 1;
    setVoted((v) => ({ ...v, [id]: dir }));
    setSubmissions((s) => s.map((sub) => sub.id === id ? { ...sub, votes: sub.votes + delta } : sub));
  };

  const openCourse = async (sub) => {
    setActiveSub(sub);
    // Courses with a link → link reader
    if (sub.link) {
      setReaderMode('link');
      return;
    }
    // Courses with baked-in tips → show immediately
    if (sub.fallbackTips) {
      setActiveTips(sub.fallbackTips);
      setReaderMode('tips');
      return;
    }
    // Otherwise → ask Gemini
    setReaderMode('loading');
    const aiTips = await generateCourseTips(sub.title, sub.description, sub.world);
    if (aiTips) {
      setActiveTips(aiTips);
    } else {
      // Generic fallback if Gemini fails and no static tips
      setActiveTips([
        { emoji: '📖', headline: sub.title, body: sub.description },
        { emoji: '💡', headline: 'Keep learning', body: 'Financial literacy compounds just like money. Every concept you learn makes the next one easier.' },
        { emoji: '🚀', headline: 'Apply it today', body: 'The best time to use what you just learned is right now. Even one small action creates momentum.' },
      ]);
    }
    setReaderMode('tips');
  };

  const handleMarkRead = (sub) => {
    setReadIds((s) => new Set([...s, sub.id]));
    addXP(25);
    completeLesson(sub.world);
    setReaderMode(null);
    setActiveSub(null);
  };

  const handleCloseReader = () => {
    setReaderMode(null);
    setActiveSub(null);
    setActiveTips([]);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    setSubmissions((s) => [{
      id: Date.now(),
      title: form.title, author: 'You', authorAvatar: '⭐',
      description: form.description,
      link: form.link.trim() || null,
      votes: 1, status: 'voting', tags: ['New'], world: form.world,
    }, ...s]);
    setForm({ title: '', description: '', link: '', world: 'budget' });
    setSubmitSuccess(true);
    setTimeout(() => { setSubmitSuccess(false); setTab('browse'); }, 1800);
  };

  const filtered = submissions
    .filter((s) => worldFilter === 'all' || s.world === worldFilter)
    .filter((s) => tab === 'voting' ? s.status === 'voting' : s.status === 'approved')
    .sort((a, b) => b.votes - a.votes);

  return (
    <div style={{
      minHeight: '100dvh',
      background: `radial-gradient(circle at center, ${C.bgLight} 0%, ${C.bgDark} 100%)`,
      color: C.teal, position: 'relative', overflowX: 'hidden', paddingBottom: 20
    }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <DecorCoins />
      </div>

      <div className="page-content" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 90px' }}>

        {/* Page header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, marginTop: 40
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900,
              color: C.amber, letterSpacing: '-0.02em', lineHeight: 1
            }}>Community</h1>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: C.teal, opacity: 0.8, marginTop: 4 }}>
              Peer tips & resources
            </p>
          </div>
          <button onClick={() => setTab('submit')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
              background: 'rgba(255,255,255,0.2)', borderRadius: 9999, fontWeight: 800,
              color: C.teal, border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(4px)', cursor: 'pointer'
            }}>
            <Plus size={18} /> Share Tip
          </button>
        </div>

        {/* World filter */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 12 }}>
          <button onClick={() => setWorldFilter('all')}
            style={{
              padding: '8px 16px', borderRadius: 9999, fontSize: '0.875rem', fontWeight: 700,
              whiteSpace: 'nowrap', border: 'none', transition: 'all 0.2s',
              background: worldFilter === 'all' ? C.card : 'rgba(255,255,255,0.15)',
              color: worldFilter === 'all' ? C.bgLight : C.teal
            }}>
            All Worlds
          </button>
          {WORLDS.map((w) => (
            <button key={w.id} onClick={() => setWorldFilter(w.id)}
              style={{
                padding: '8px 16px', borderRadius: 9999, fontSize: '0.875rem', fontWeight: 700,
                whiteSpace: 'nowrap', border: 'none', transition: 'all 0.2s',
                background: worldFilter === w.id ? C.card : 'rgba(255,255,255,0.15)',
                color: worldFilter === w.id ? C.bgLight : C.teal
              }}>
              {w.icon} {w.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ id: 'browse', label: '🔥 Popular' }, { id: 'voting', label: '🗳️ Voting' }, { id: 'submit', label: '✏️ Share' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 16, fontSize: '0.875rem', fontWeight: 800,
                border: 'none', transition: 'all 0.2s',
                background: tab === t.id ? C.amber : 'rgba(255,255,255,0.15)',
                color: tab === t.id ? '#fff' : C.teal,
                boxShadow: tab === t.id ? '0 4px 12px rgba(243,156,18,0.3)' : 'none'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        {(tab === 'browse' || tab === 'voting') && filtered.map((sub, i) => {
          const w = WORLDS.find((w) => w.id === sub.world);
          const isRead = readIds.has(sub.id);
          const hasContent = sub.link || sub.fallbackTips;
          return (
            <motion.div key={sub.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: C.card, padding: 18, borderRadius: 24, marginBottom: 12,
                cursor: sub.status === 'approved' ? 'pointer' : 'default',
                opacity: isRead ? 0.72 : 1, boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
              }}
              onClick={() => sub.status === 'approved' && openCourse(sub)}>

              <div style={{ display: 'flex', gap: 14 }}>
                {/* Vote column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                  onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleVote(sub.id, 'up')}
                    style={{
                      width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', border: 'none',
                      background: voted[sub.id] === 'up' ? C.amber : 'rgba(255,255,255,0.15)',
                      color: voted[sub.id] === 'up' ? '#fff' : C.teal
                    }}>
                    <ChevronUp size={20} />
                  </button>
                  <span style={{ fontWeight: 900, fontSize: '1rem', fontFamily: 'var(--font-display)', color: C.teal }}>
                    {sub.votes}
                  </span>
                  <button onClick={() => handleVote(sub.id, 'down')}
                    style={{
                      width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', border: 'none',
                      background: voted[sub.id] === 'down' ? '#e74c3c' : 'rgba(255,255,255,0.15)',
                      color: voted[sub.id] === 'down' ? '#fff' : C.teal
                    }}>
                    <ChevronDown size={20} />
                  </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span>{sub.authorAvatar}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: C.teal }}>{sub.author}</span>
                    {w && <span style={{
                      fontSize: '0.625rem', padding: '3px 8px', borderRadius: 9999,
                      background: 'rgba(255,255,255,0.2)', color: C.teal, fontWeight: 800
                    }}>
                      {w.icon} {w.name.split(' ')[0]}
                    </span>}
                    <span style={{
                      fontSize: '0.625rem', padding: '3px 8px', borderRadius: 9999, fontWeight: 800,
                      background: sub.status === 'approved' ? '#27ae60' : C.amber, color: '#fff'
                    }}>
                      {sub.status === 'approved' ? '✅' : '🗳️'} {sub.status}
                    </span>
                    {isRead && <span style={{
                      fontSize: '0.625rem', padding: '3px 8px', borderRadius: 9999,
                      background: 'rgba(255,255,255,0.15)', color: C.teal, fontWeight: 800
                    }}>✓ Read</span>}
                  </div>

                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, marginBottom: 4, color: C.teal, lineHeight: 1.2 }}>
                    {sub.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: C.teal, opacity: 0.8, lineHeight: 1.4, marginBottom: 10 }}>
                    {sub.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {sub.link && <span style={{
                      fontSize: '0.75rem', fontWeight: 600, color: C.amber,
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <ExternalLink size={12} /> Has link
                    </span>}
                    {sub.fallbackTips && !sub.link && <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      color: '#c084fc', display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <Sparkles size={12} /> {sub.fallbackTips.length} tips
                    </span>}
                    {sub.tags?.map((tag) => (
                      <span key={tag} style={{
                        fontSize: '0.625rem', fontWeight: 700, padding: '2px 8px',
                        borderRadius: 9999, background: 'rgba(255,255,255,0.15)', color: C.teal
                      }}>{tag}</span>
                    ))}
                  </div>

                  {sub.status === 'approved' && !isRead && (
                    <div style={{ marginTop: 12 }}>
                      <span style={{
                        fontSize: '0.8125rem', padding: '6px 16px', borderRadius: 9999,
                        background: hasContent ? C.teal : 'rgba(255,255,255,0.2)',
                        color: hasContent ? C.bgLight : C.teal,
                        fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6
                      }}>
                        {sub.link ? '🔗 Read & Earn XP' : sub.fallbackTips ? '📖 Read Tips · +25 XP' : '✨ Generate Tips · +25 XP'}
                      </span>
                    </div>
                  )}

                  {tab === 'voting' && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{
                        width: '100%', height: 6, background: 'rgba(255,255,255,0.1)',
                        borderRadius: 100, overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%', background: C.amber, borderRadius: 100,
                          width: `${Math.min((sub.votes / 200) * 100, 100)}%`
                        }} />
                      </div>
                      <p style={{
                        fontSize: '0.6875rem', fontWeight: 600, color: C.teal,
                        opacity: 0.6, marginTop: 4
                      }}>{sub.votes}/200 votes for approval</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Submit form */}
        {tab === 'submit' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <AnimatePresence>
              {submitSuccess && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    background: '#27ae60', borderRadius: 16, padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16
                  }}>
                  <CheckCircle size={20} color="#fff" />
                  <span style={{ fontWeight: 800, color: '#fff' }}>Submitted for community voting!</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ background: C.card, padding: 24, borderRadius: 32 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 4, color: C.teal }}>
                Share a Tip or Resource
              </h3>
              <p style={{ fontSize: '0.8125rem', color: C.teal, opacity: 0.65, marginBottom: 20 }}>
                Help the community learn — share a useful tip, guide, or link.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: C.teal, display: 'block', marginBottom: 8 }}>World</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {WORLDS.map((w) => (
                      <button key={w.id} onClick={() => setForm((f) => ({ ...f, world: w.id }))}
                        style={{
                          flex: 1, padding: '12px 0', borderRadius: 16, fontSize: '1.25rem',
                          background: form.world === w.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                          border: form.world === w.id ? `2px solid ${C.teal}` : '2px solid transparent',
                          transition: 'all 0.2s', cursor: 'pointer'
                        }}>
                        {w.icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: C.teal, display: 'block', marginBottom: 8 }}>Title</label>
                  <input style={{
                    width: '100%', padding: '14px 16px', borderRadius: 16, border: 'none',
                    background: 'rgba(255,255,255,0.4)', fontSize: '1rem', color: C.teal,
                    fontWeight: 600, outline: 'none', boxSizing: 'border-box'
                  }}
                    placeholder="e.g. Best free budgeting app I've used"
                    value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: C.teal, display: 'block', marginBottom: 8 }}>Your Tip</label>
                  <textarea style={{
                    width: '100%', padding: '14px 16px', borderRadius: 16, border: 'none',
                    background: 'rgba(255,255,255,0.4)', fontSize: '1rem', color: C.teal,
                    fontWeight: 600, outline: 'none', minHeight: 100, resize: 'vertical', boxSizing: 'border-box'
                  }}
                    placeholder="Share what you know — the more specific, the better!"
                    value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: C.teal, display: 'block', marginBottom: 8 }}>
                    Resource Link <span style={{ fontWeight: 500, opacity: 0.6 }}>(optional)</span>
                  </label>
                  <input style={{
                    width: '100%', padding: '14px 16px', borderRadius: 16, border: 'none',
                    background: 'rgba(255,255,255,0.4)', fontSize: '1rem', color: C.teal,
                    fontWeight: 600, outline: 'none', boxSizing: 'border-box'
                  }}
                    placeholder="https://..."
                    value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
                </div>
                <button onClick={handleSubmit}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 20, background: C.teal,
                    color: C.bgLight, fontSize: '1.125rem', fontWeight: 900, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
                    opacity: form.title.trim() ? 1 : 0.5,
                    cursor: form.title.trim() ? 'pointer' : 'not-allowed'
                  }}>
                  <Send size={20} /> Submit for Voting
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {readerMode === 'loading' && <LoadingTips key="loading" />}
        {readerMode === 'tips' && activeSub && (
          <TipReader key="tips" sub={activeSub} tips={activeTips}
            alreadyRead={readIds.has(activeSub.id)}
            onMarkRead={handleMarkRead} onClose={handleCloseReader} />
        )}
        {readerMode === 'link' && activeSub && (
          <LinkReader key="link" sub={activeSub}
            alreadyRead={readIds.has(activeSub.id)}
            onMarkRead={handleMarkRead} onClose={handleCloseReader} />
        )}
      </AnimatePresence>
    </div>
  );
}