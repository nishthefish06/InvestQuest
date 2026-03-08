import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { BUDGET_SCENARIOS, ALL_BUDGET_CATEGORIES } from '../data/skills';
import { ArrowLeft, ArrowRight, RotateCcw, AlertCircle, Sparkles, Loader2, X } from 'lucide-react';
import GeminiFeedback from '../components/GeminiFeedback';
import { generateSimEvent } from '../services/gemini';

export default function BudgetGame() {
  const navigate = useNavigate();
  const { budgetScenarioLevel, updateBudgetScenario, addXP } = useGameState();
  const [phase, setPhase] = useState('intro'); // intro | dashboard | event | allocate | result

  // ── Life Event (Gemini-generated) state ──────────────────────────────
  const [simEvent, setSimEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventChosen, setEventChosen] = useState(null); // chosen choice index
  const [recentEvents, setRecentEvents] = useState([]);
  const [savings, setSavings] = useState(1200);
  const [debt, setDebt] = useState(4500);

  // Get active scenario or fallback to the last one if they beat the game
  const activeScenario = BUDGET_SCENARIOS.find((s) => s.id === budgetScenarioLevel) || BUDGET_SCENARIOS[BUDGET_SCENARIOS.length - 1];

  // Initialize sliders with minimums (including mandatory expenses)
  const defaultAllocations = useMemo(() => {
    const alloc = {};
    ALL_BUDGET_CATEGORIES.forEach((cat) => { alloc[cat.id] = 0; });
    activeScenario.mandatory.forEach((m) => {
      // Find matching category type for mandatory expenses so they bucket correctly
      const baseType = m.id === 'rent' || m.id === 'car' || m.id === 'groceries' ? 'need' : 'want';
      alloc[`${baseType}_${m.id}`] = m.amount;
    });
    return alloc;
  }, [activeScenario]);

  const [allocations, setAllocations] = useState(defaultAllocations);
  const [result, setResult] = useState(null);

  // Fetch a Gemini-generated life event when entering the event phase
  const fetchSimEvent = async () => {
    setEventLoading(true);
    setSimEvent(null);
    setEventChosen(null);
    const event = await generateSimEvent({
      balance: activeScenario.income - (savings + debt * 0.1),
      monthlyIncome: activeScenario.income,
      monthlyExpenses: Math.round(activeScenario.income * 0.75),
      savings,
      debt,
      month: budgetScenarioLevel,
      recentEvents,
    });
    setSimEvent(event);
    setEventLoading(false);
  };

  const handleStartEvent = () => {
    setPhase('dashboard');
  };

  const handleContinueToEvent = () => {
    setPhase('event');
    fetchSimEvent();
  };

  const handleEventChoice = (choice, idx) => {
    setEventChosen(idx);
    // Apply the financial impact
    if (choice.action === 'savings') setSavings(s => Math.max(0, s + choice.savingsImpact));
    if (choice.action === 'debt') setDebt(d => d + Math.abs(choice.cost || 200));
    if (choice.action === 'income') setSavings(s => s + Math.abs(choice.savingsImpact || 0));
    setRecentEvents(prev => [...prev.slice(-4), simEvent?.title || 'event']);
    // Advance to budgeting after a short pause
    setTimeout(() => setPhase('allocate'), 1800);
  };

  // Derive Buckets
  const getBuckets = () => {
    let needs = 0; let wants = 0; let saves = 0;
    Object.entries(allocations).forEach(([key, val]) => {
      if (key.startsWith('need')) needs += val;
      else if (key.startsWith('want')) wants += val;
      else if (key.startsWith('save')) saves += val;
    });
    return { needs, wants, saves };
  };

  const { needs, wants, saves } = getBuckets();
  const totalAllocated = needs + wants + saves;
  const remaining = activeScenario.income - totalAllocated;

  const targetNeeds = activeScenario.income * 0.50;
  const targetWants = activeScenario.income * 0.30;
  const targetSaves = activeScenario.income * 0.20;

  const adjustAllocation = (catId, delta) => {
    setAllocations((a) => {
      const current = a[catId];
      // Prevent adjusting mandatory expenses below their requirement
      let minAllowed = 0;
      const isMandatory = activeScenario.mandatory.find((m) => `need_${m.id}` === catId || `want_${m.id}` === catId);
      if (isMandatory) minAllowed = isMandatory.amount;

      return { ...a, [catId]: Math.max(minAllowed, current + delta) };
    });
  };

  const evaluateBudget = () => {
    // Prevent submission if budget is over
    if (remaining < 0) {
      alert('❌ Budget Error: You have allocated more than your income! Please reduce your spending to stay within your budget.');
      return;
    }

    const nPct = (needs / activeScenario.income) * 100;
    const wPct = (wants / activeScenario.income) * 100;
    const sPct = (saves / activeScenario.income) * 100;

    let score = 100;
    let feedback = [];

    if (remaining > 50) {
      score -= 10;
      feedback.push('You left money unassigned. Every dollar needs a job (even if that job is savings).');
    }

    if (nPct > 55) { score -= 15; feedback.push('Your Needs were too high. Look for ways to lower fixed costs.'); }
    else if (nPct < 45) { feedback.push('Great job keeping Needs under 50%!'); }

    if (wPct > 35) { score -= 20; feedback.push('You spent too much on Wants. You need to delay gratification.'); }
    if (sPct < 15) { score -= 25; feedback.push('Your Savings were too low. Always pay yourself first!'); }
    else if (sPct >= 20) { feedback.push('Perfect! You hit the 20% Savings goal. Future you is happy.'); }

    score = Math.max(10, score);
    const xp = Math.floor(score * 2.5);

    setResult({ score, xp, feedback, needsPct: nPct.toFixed(1), wantsPct: wPct.toFixed(1), savesPct: sPct.toFixed(1) });
    addXP(xp);
    if (score >= 70 && budgetScenarioLevel < BUDGET_SCENARIOS.length) {
      updateBudgetScenario(budgetScenarioLevel + 1);
    }
    setPhase('result');
  };

  const resetPhase = () => {
    setAllocations(defaultAllocations);
    setPhase('allocate');
  };

  // ── Render ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', justifyContent: 'center', position: 'relative' }}>
        {/* Back button */}
        <button 
          onClick={() => navigate('/world/budget')}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>{activeScenario.id === 1 ? '🏖️' : '🚨'}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>{activeScenario.title}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{activeScenario.desc}</p>

          <div style={{ background: 'rgba(82,128,94,0.1)', padding: 16, borderRadius: 12, marginBottom: 24 }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Income</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: '#52805e' }}>${activeScenario.income.toLocaleString()}</p>
          </div>

          <button className="btn btn-budget btn-block btn-lg" onClick={handleStartEvent}>
            Start Budgeting <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard Phase (Show Financial Overview) ──────────────────────
  if (phase === 'dashboard') {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', justifyContent: 'center', paddingBottom: 40, position: 'relative' }}>
        <button 
          onClick={() => navigate('/world/budget')}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, textAlign: 'center', marginBottom: 24 }}>Your Financial Dashboard</h1>
          
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-glass)' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Monthly Income</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', color: '#52805e' }}>${activeScenario.income.toLocaleString()}</p>
              </div>
              <div style={{ fontSize: '2.5rem' }}>💵</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'rgba(82,128,94,0.1)', padding: 14, borderRadius: 12, border: '1px solid rgba(82,128,94,0.2)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>💰 Savings</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.375rem', color: '#52805e' }}>${savings.toLocaleString()}</p>
              </div>
              <div style={{ background: 'rgba(220,38,38,0.1)', padding: 14, borderRadius: 12, border: '1px solid rgba(220,38,38,0.2)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>💳 Debt</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.375rem', color: '#dc2626' }}>${debt.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20, marginBottom: 24, background: 'rgba(6,182,212,0.08)', border: '1.5px solid rgba(6,182,212,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlertCircle size={18} color="var(--accent-cyan)" />
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--accent-cyan)' }}>A new month begins...</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>Life is unpredictable. An unexpected event is waiting for you. Are you ready to handle it?</p>
          </div>

          <button className="btn btn-budget btn-block btn-lg" onClick={handleContinueToEvent}>
            Continue to Event <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Event Phase (Gemini Life Event) ─────────────────────────────────
  if (phase === 'event') {
    const urgencyColors = { immediate: '#dc2626', this_week: 'var(--accent-orange)', optional: 'var(--accent-cyan)' };
    const categoryColors = { emergency: '#dc2626', opportunity: '#52805e', routine: '#385c43', social: '#fbb03b' };

    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', justifyContent: 'center', paddingBottom: 40, position: 'relative' }}>
        {/* Remaining Cash Display */}
        <div style={{
          position: 'absolute',
          top: 16,
          right: 60,
          textAlign: 'right',
          zIndex: 10,
        }}>
          <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 2 }}>Remaining Cash</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', color: '#52805e' }}>
            ${(activeScenario.income - (savings + debt * 0.1)).toLocaleString()}
          </p>
        </div>

        {/* Exit button */}
        <button 
          onClick={() => navigate('/world/budget')}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Exit game"
        >
          <X size={18} color="var(--text-secondary)" />
        </button>
        <AnimatePresence mode="wait">
          {eventLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: 40 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}>
                <img src="/coin.png" alt="" style={{ width: 48, height: 48 }} />
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', marginBottom: 8 }}>
                Life happens…
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Loader2 size={14} className="animate-spin" /> Gemini is generating your monthly event
              </p>
            </motion.div>
          ) : simEvent ? (
            <motion.div key="event" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Header badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: `${categoryColors[simEvent.category] || '#385c43'}22`,
                  color: categoryColors[simEvent.category] || '#385c43',
                  border: `1px solid ${categoryColors[simEvent.category] || '#385c43'}44`,
                }}>
                  {simEvent.category}
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: `${urgencyColors[simEvent.urgency] || 'var(--accent-orange)'}22`,
                  color: urgencyColors[simEvent.urgency] || 'var(--accent-orange)',
                  border: `1px solid ${urgencyColors[simEvent.urgency] || 'var(--accent-orange)'}44`,
                }}>
                  {simEvent.urgency?.replace('_', ' ')}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <Sparkles size={14} /> AI Generated
                </div>
              </div>

              {/* Event card */}
              <div className="card" style={{ padding: 24, marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>{simEvent.emoji || '⚡'}</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 900, marginBottom: 10 }}>
                  {simEvent.title}
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                  {simEvent.description}
                </p>
              </div>

              {/* Choices */}
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                How do you handle it?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(simEvent.choices || []).map((choice, idx) => {
                  const chosen = eventChosen === idx;
                  const unchosen = eventChosen !== null && !chosen;
                  const actionColors = { savings: '#dc2626', debt: 'var(--accent-orange)', income: '#52805e', skip: 'var(--text-secondary)' };
                  return (
                    <motion.button key={idx} whileTap={{ scale: 0.98 }}
                      disabled={eventChosen !== null}
                      onClick={() => handleEventChoice(choice, idx)}
                      style={{
                        background: chosen ? 'rgba(6,182,212,0.12)' : 'var(--bg-card)',
                        border: `1.5px solid ${chosen ? 'var(--accent-cyan)' : unchosen ? 'var(--border-glass)' : 'var(--border-glass)'}`,
                        borderRadius: 'var(--radius-md)', padding: '14px 16px',
                        textAlign: 'left', cursor: eventChosen !== null ? 'default' : 'pointer',
                        opacity: unchosen ? 0.45 : 1,
                        transition: 'all 0.2s',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{choice.label}</span>
                        {choice.cost !== 0 && (
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: actionColors[choice.action] || 'var(--accent-orange)' }}>
                            {choice.action === 'income' ? '+' : '-'}${Math.abs(choice.cost || Math.abs(choice.savingsImpact || 0)).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {chosen && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                          {choice.consequence}
                        </motion.p>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {eventChosen !== null && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: 16 }}>
                  Moving to your budget…
                </motion.p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', paddingBottom: 40, position: 'relative' }}>
        {/* Back button */}
        <button 
          onClick={() => navigate('/world/budget')}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
            style={{ width: 80, height: 80, borderRadius: '50%', background: result.score >= 70 ? 'var(--gradient-budget)' : 'var(--gradient-crypto)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px', boxShadow: 'var(--w-budget-glow)' }}>
            {result.score >= 70 ? '🎯' : '📉'}
          </motion.div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900 }}>Budget Score: {result.score}/100</h1>
          <p style={{ color: 'var(--accent-orange)', fontWeight: 700, fontSize: '1.125rem', marginTop: 8 }}>+{result.xp} XP Earned!</p>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 16 }}>The 50/30/20 Breakdown</h3>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Needs (Goal: 50%)</span>
              <span style={{ fontSize: '0.875rem', color: (needs / activeScenario.income) > 0.55 ? '#fbb03b' : '#52805e' }}>{((needs / activeScenario.income) * 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-primary)', borderRadius: 999 }}>
              <div style={{ height: '100%', borderRadius: 999, background: '#dc2626', width: `${Math.min(100, (needs / activeScenario.income) * 100)}%` }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Wants (Goal: 30%)</span>
              <span style={{ fontSize: '0.875rem', color: (wants / activeScenario.income) > 0.35 ? '#fbb03b' : '#52805e' }}>{((wants / activeScenario.income) * 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-primary)', borderRadius: 999 }}>
              <div style={{ height: '100%', borderRadius: 999, background: 'var(--accent-cyan)', width: `${Math.min(100, (wants / activeScenario.income) * 100)}%` }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Savings (Goal: 20%)</span>
              <span style={{ fontSize: '0.875rem', color: (saves / activeScenario.income) < 0.15 ? '#fbb03b' : '#52805e' }}>{((saves / activeScenario.income) * 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-primary)', borderRadius: 999 }}>
              <div style={{ height: '100%', borderRadius: 999, background: '#52805e', width: `${Math.min(100, (saves / activeScenario.income) * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 12 }}>Feedback</h3>
          <ul style={{ paddingLeft: 20, margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            {result.feedback.map((f, i) => <li key={i} style={{ marginBottom: 8 }}>{f}</li>)}
          </ul>
        </div>

        <GeminiFeedback
          gameType="budget_scenario"
          gameState={{
            score: result.score,
            scenarioTitle: activeScenario.title,
            needsPct: result.needsPct,
            wantsPct: result.wantsPct,
            savesPct: result.savesPct,
            income: activeScenario.income,
            feedback: result.feedback,
          }}
        />

        <div style={{ display: 'flex', gap: 12 }}>
          {result.score >= 70 && budgetScenarioLevel <= BUDGET_SCENARIOS.length ? (
            <button className="btn btn-budget btn-block btn-lg" onClick={() => { setPhase('intro'); setAllocations(defaultAllocations); }}>
              Next Scenario <ArrowRight size={18} />
            </button>
          ) : (
            <button className="btn btn-secondary btn-block btn-lg" onClick={resetPhase}>
              <RotateCcw size={18} /> Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active Map of Categories to render grouped
  const renderGroup = (title, prefix, color, targetAmt) => {
    const availableCats = ALL_BUDGET_CATEGORIES.filter(c => c.type === prefix);
    const mandatoryTotal = activeScenario.mandatory.reduce((sum, m) => {
      const key = `${prefix}_${m.id}`;
      return key in allocations ? sum + m.amount : sum;
    }, 0);
    const choicesTotal = availableCats.reduce((sum, cat) => sum + (allocations[cat.id] || 0), 0);

    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', color }}>{title}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target: ${targetAmt}</span>
        </div>

        {/* Render mandatory bills for this group first */}
        {activeScenario.mandatory.map(m => {
          if (!((`${prefix}_${m.id}`) in allocations)) return null;

          return (
            <div key={m.id} className="budget-category" style={{ background: m.isSurprise ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)' }}>
              <span style={{ fontSize: '1.25rem' }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {m.name} {m.isSurprise && <AlertCircle size={12} color="#fbb03b" />}
                </p>
                <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>MANDATORY BILL</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 60, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color }}>${m.amount}</span>
              </div>
            </div>
          );
        })}

        {/* Render interactive categories */}
        {availableCats.map((cat) => (
          <div key={cat.id} className="budget-category">
            <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cat.name}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => adjustAllocation(cat.id, -50)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-card-hover)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ width: 50, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem' }}>${allocations[cat.id]}</span>
              <button onClick={() => adjustAllocation(cat.id, 50)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-card-hover)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
        ))}

        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Fixed costs</span>
            <span>${mandatoryTotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Your choices</span>
            <span>${choicesTotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: (mandatoryTotal + choicesTotal) > targetAmt ? '#fbb03b' : 'var(--text-primary)', marginTop: 4, borderTop: '1px solid var(--border-glass)', paddingTop: 4 }}>
            <span style={{ fontWeight: 800 }}>Total</span>
            <span style={{ fontWeight: 800 }}>${mandatoryTotal + choicesTotal} / ${targetAmt}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-content" style={{ paddingBottom: 100 }}>
      {/* Tracker Bar Header Fixed */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, paddingTop: 16, paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => navigate('/world/budget')} style={{ padding: 4 }}><ArrowLeft size={22} color="var(--text-secondary)" /></button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>{activeScenario.title}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Remaining Cash</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: remaining >= 0 ? '#52805e' : '#fbb03b' }}>
              ${Math.abs(remaining).toLocaleString()}{remaining < 0 && ' over'}
            </p>
          </div>
        </div>

        {/* 50/30/20 Progress Bar */}
        <div style={{ height: 16, borderRadius: 8, display: 'flex', overflow: 'hidden', border: '2px solid #1e3a28' }}>
          <div style={{ width: `${(needs / activeScenario.income) * 100}%`, background: '#dc2626', transition: 'width 0.3s ease' }} />
          <div style={{ width: `${(wants / activeScenario.income) * 100}%`, background: '#06b6d4', transition: 'width 0.3s ease' }} />
          <div style={{ width: `${(saves / activeScenario.income) * 100}%`, background: 'transparent', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 6, textTransform: 'uppercase' }}>
          <span>Needs 50%</span>
          <span>Wants 30%</span>
          <span>Savings 20%</span>
        </div>
      </div>

      <div style={{ paddingTop: 24 }}>
        {renderGroup('Essentials (Needs)', 'need', '#fbb03b', targetNeeds)}
        {renderGroup('Lifestyle (Wants)', 'want', '#06b6d4', targetWants)}
        {renderGroup('Future (Savings)', 'save', '#52805e', targetSaves)}

        <button 
          className="btn btn-budget btn-block btn-lg" 
          onClick={evaluateBudget} 
          disabled={remaining < 0}
          style={{ 
            marginTop: 24,
            opacity: remaining < 0 ? 0.5 : 1,
            cursor: remaining < 0 ? 'not-allowed' : 'pointer',
          }}>
          {remaining < 0 ? '⚠️ Budget Over - Reduce Spending' : 'Submit Budget'} {remaining >= 0 && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
}