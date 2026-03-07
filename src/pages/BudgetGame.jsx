import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { BUDGET_EVENTS, BUDGET_CATEGORIES } from '../data/skills';
import { ArrowLeft, DollarSign, PiggyBank, CreditCard, Heart, RotateCcw } from 'lucide-react';

export default function BudgetGame() {
  const navigate = useNavigate();
  const { budget, updateBudget, addXP } = useGameState();
  const [phase, setPhase] = useState('allocate'); // allocate | event | result
  const [allocations, setAllocations] = useState({
    rent: 1200, food: 400, transport: 200, utilities: 150, savings: 500, fun: 200,
  });
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventHistory, setEventHistory] = useState([]);
  const [monthResult, setMonthResult] = useState(null);
  const income = budget.income;

  const totalAllocated = Object.values(allocations).reduce((s, v) => s + v, 0);
  const remaining = income - totalAllocated;

  const adjustAllocation = (cat, delta) => {
    setAllocations((a) => ({ ...a, [cat]: Math.max(0, a[cat] + delta) }));
  };

  const submitBudget = () => {
    // Pick 2-3 random events
    const shuffled = [...BUDGET_EVENTS].sort(() => Math.random() - 0.5);
    const events = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
    setEventHistory(events);
    setCurrentEvent(events[0]);
    setPhase('event');
  };

  const handleEvent = (action) => {
    // Process the event
    const evt = currentEvent;
    let newSavings = budget.savings;
    let newDebt = budget.debt;

    if (evt.cost < 0) {
      // Income event — money comes in
      newSavings += Math.abs(evt.cost);
    } else if (action === 'savings') {
      newSavings -= evt.cost;
      if (newSavings < 0) { newDebt += Math.abs(newSavings); newSavings = 0; }
    } else {
      newDebt += evt.cost;
    }

    updateBudget({ savings: newSavings, debt: newDebt, month: budget.month + 1 });

    const nextIdx = eventHistory.indexOf(evt) + 1;
    if (nextIdx < eventHistory.length) {
      setCurrentEvent(eventHistory[nextIdx]);
    } else {
      // Show result
      const savingsRate = (allocations.savings / income * 100).toFixed(0);
      const score = Math.min(100, parseInt(savingsRate) * 2 + (remaining >= 0 ? 30 : 0) + (newDebt < budget.debt ? 20 : 0));
      const earnedXP = Math.floor(score * 1.5);
      addXP(earnedXP);
      setMonthResult({ savings: newSavings, debt: newDebt, score, xp: earnedXP, savingsRate });
      setPhase('result');
    }
  };

  if (phase === 'result' && monthResult) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          style={{ width: 90, height: 90, borderRadius: '50%', background: monthResult.score >= 60 ? 'var(--gradient-budget)' : 'linear-gradient(135deg, #ef4444, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.25rem', marginBottom: 20, boxShadow: 'var(--w-budget-glow)' }}>
          {monthResult.score >= 60 ? '🏖️' : '😬'}
        </motion.div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, marginBottom: 4 }}>
          Month {budget.month} Complete!
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Budget Score: {monthResult.score}/100</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, width: '100%', maxWidth: 300, marginBottom: 24 }}>
          <div className="card" style={{ padding: 14, textAlign: 'center' }}>
            <PiggyBank size={18} color="var(--accent-green)" style={{ margin: '0 auto 4px' }} />
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-green)' }}>${monthResult.savings.toLocaleString()}</p>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>SAVINGS</p>
          </div>
          <div className="card" style={{ padding: 14, textAlign: 'center' }}>
            <CreditCard size={18} color="var(--accent-red)" style={{ margin: '0 auto 4px' }} />
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-red)' }}>${monthResult.debt.toLocaleString()}</p>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>DEBT</p>
          </div>
        </div>

        <div style={{ padding: '10px 20px', background: 'rgba(245,158,11,0.1)', borderRadius: 9999, border: '1px solid rgba(245,158,11,0.2)', marginBottom: 24 }}>
          <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-orange)', fontSize: '1.125rem' }}>+{monthResult.xp} XP</span>
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 300 }}>
          <button className="btn btn-budget btn-lg" onClick={() => { setPhase('allocate'); }} style={{ flex: 1 }}>
            <RotateCcw size={16} /> Next Month
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/world/budget')} style={{ flex: 1 }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => navigate('/world/budget')} style={{ padding: 4 }}><ArrowLeft size={22} color="var(--text-secondary)" /></button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800 }}>🏖️ Budget Boardwalk</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Month {budget.month} — Allocate your ${income.toLocaleString()} income</p>
        </div>
      </div>

      {phase === 'allocate' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Income Display */}
          <div className="card" style={{ padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Monthly Income</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.375rem' }}>${income.toLocaleString()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Remaining</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', color: remaining >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                ${Math.abs(remaining).toLocaleString()}
                {remaining < 0 && ' over'}
              </p>
            </div>
          </div>

          {/* Category Allocations */}
          {BUDGET_CATEGORIES.map((cat) => (
            <div key={cat.id} className="budget-category">
              <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cat.name}</p>
                <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Suggested: ${cat.suggested}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => adjustAllocation(cat.id, -50)}
                  style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ width: 60, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem' }}>${allocations[cat.id]}</span>
                <button onClick={() => adjustAllocation(cat.id, 50)}
                  style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
          ))}

          <button className="btn btn-budget btn-block btn-lg" onClick={submitBudget}
            style={{ marginTop: 16 }} disabled={remaining < 0}>
            🎲 Submit & See What Happens
          </button>
        </motion.div>
      )}

      {phase === 'event' && currentEvent && (
        <AnimatePresence mode="wait">
          <motion.div key={currentEvent.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '0 12px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'float 2s ease-in-out infinite' }}>{currentEvent.emoji}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 800, marginBottom: 8 }}>{currentEvent.title}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{currentEvent.desc}</p>
            <div style={{
              padding: '10px 20px', borderRadius: 9999, marginBottom: 24,
              background: currentEvent.cost > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
              border: `1px solid ${currentEvent.cost > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem',
                color: currentEvent.cost > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
              }}>
                {currentEvent.cost > 0 ? `-$${currentEvent.cost}` : `+$${Math.abs(currentEvent.cost)}`}
              </span>
            </div>

            {currentEvent.cost > 0 ? (
              <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 300 }}>
                <button className="btn btn-lg" onClick={() => handleEvent('savings')}
                  style={{ flex: 1, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--accent-green)' }}>
                  <PiggyBank size={16} /> Use Savings
                </button>
                <button className="btn btn-lg" onClick={() => handleEvent('debt')}
                  style={{ flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}>
                  <CreditCard size={16} /> Add to Debt
                </button>
              </div>
            ) : (
              <button className="btn btn-budget btn-lg" onClick={() => handleEvent('savings')}>
                💰 Collect!
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
