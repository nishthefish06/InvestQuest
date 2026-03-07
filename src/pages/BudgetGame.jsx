import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { BUDGET_SCENARIOS, ALL_BUDGET_CATEGORIES } from '../data/skills';
import { ArrowLeft, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';
import GeminiFeedback from '../components/GeminiFeedback';

export default function BudgetGame() {
  const navigate = useNavigate();
  const { budgetScenarioLevel, updateBudgetScenario, addXP } = useGameState();
  const [phase, setPhase] = useState('intro'); // intro | allocate | result

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
    const nPct = (needs / activeScenario.income) * 100;
    const wPct = (wants / activeScenario.income) * 100;
    const sPct = (saves / activeScenario.income) * 100;

    let score = 100;
    let feedback = [];

    if (remaining < 0) {
      score -= 50;
      feedback.push('You overspent your income! This leads straight to credit card debt.');
    } else if (remaining > 50) {
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
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>{activeScenario.id === 1 ? '🏖️' : '🚨'}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>{activeScenario.title}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{activeScenario.desc}</p>

          <div style={{ background: 'rgba(6,182,212,0.1)', padding: 16, borderRadius: 12, marginBottom: 24 }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Income</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--accent-cyan)' }}>${activeScenario.income.toLocaleString()}</p>
          </div>

          <button className="btn btn-budget btn-block btn-lg" onClick={() => setPhase('allocate')}>
            Start Budgeting <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', paddingBottom: 40 }}>
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
              <span style={{ fontSize: '0.875rem', color: (needs / activeScenario.income) > 0.55 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{((needs / activeScenario.income) * 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-primary)', borderRadius: 999 }}>
              <div style={{ height: '100%', borderRadius: 999, background: 'var(--accent-red)', width: `${Math.min(100, (needs / activeScenario.income) * 100)}%` }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Wants (Goal: 30%)</span>
              <span style={{ fontSize: '0.875rem', color: (wants / activeScenario.income) > 0.35 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{((wants / activeScenario.income) * 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-primary)', borderRadius: 999 }}>
              <div style={{ height: '100%', borderRadius: 999, background: 'var(--accent-cyan)', width: `${Math.min(100, (wants / activeScenario.income) * 100)}%` }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Savings (Goal: 20%)</span>
              <span style={{ fontSize: '0.875rem', color: (saves / activeScenario.income) < 0.15 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{((saves / activeScenario.income) * 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-primary)', borderRadius: 999 }}>
              <div style={{ height: '100%', borderRadius: 999, background: 'var(--accent-green)', width: `${Math.min(100, (saves / activeScenario.income) * 100)}%` }} />
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
    const activeAllocations = Object.entries(allocations).filter(([k]) => k.startsWith(prefix));
    const groupTotal = activeAllocations.reduce((sum, [, val]) => sum + val, 0);
    const availableCats = ALL_BUDGET_CATEGORIES.filter(c => c.type === prefix);

    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', color }}>{title}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target: ${targetAmt}</span>
        </div>

        {/* Render mandatory bills for this group first */}
        {activeScenario.mandatory.map(m => {
          if ((prefix === 'need' && m.id !== 'repair' && !m.isSurprise) || (prefix === 'want' && m.isSurprise)) return null; // Very basic bucketing for demo
          if (!allocations[`${prefix}_${m.id}`] && allocations[`${prefix}_${m.id}`] !== 0) return null;

          return (
            <div key={m.id} className="budget-category" style={{ background: m.isSurprise ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)' }}>
              <span style={{ fontSize: '1.25rem' }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {m.name} {m.isSurprise && <AlertCircle size={12} color="var(--accent-red)" />}
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

        <div style={{ textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, color: groupTotal > targetAmt ? 'var(--accent-red)' : 'var(--text-secondary)', marginTop: 8 }}>
          Group Total: ${groupTotal} / ${targetAmt}
        </div>
      </div>
    );
  };

  return (
    <div className="page-content" style={{ paddingBottom: 100 }}>
      {/* Tracker Bar Header Fixed */}
      <div style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10, paddingTop: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => navigate('/world/budget')} style={{ padding: 4 }}><ArrowLeft size={22} color="var(--text-secondary)" /></button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 800 }}>{activeScenario.title}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Remaining Cash</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: remaining >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              ${Math.abs(remaining).toLocaleString()}{remaining < 0 && ' over'}
            </p>
          </div>
        </div>

        {/* 50/30/20 Progress Bar */}
        <div style={{ height: 16, background: 'var(--bg-card)', borderRadius: 8, display: 'flex', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
          <div style={{ width: `${(needs / activeScenario.income) * 100}%`, background: 'var(--accent-red)', transition: 'width 0.3s ease' }} />
          <div style={{ width: `${(wants / activeScenario.income) * 100}%`, background: 'var(--accent-cyan)', transition: 'width 0.3s ease' }} />
          <div style={{ width: `${(saves / activeScenario.income) * 100}%`, background: 'var(--accent-green)', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 6, textTransform: 'uppercase' }}>
          <span>Needs 50%</span>
          <span>Wants 30%</span>
          <span>Savings 20%</span>
        </div>
      </div>

      <div style={{ paddingTop: 24 }}>
        {renderGroup('Essentials (Needs)', 'need', 'var(--accent-red)', targetNeeds)}
        {renderGroup('Lifestyle (Wants)', 'want', 'var(--accent-cyan)', targetWants)}
        {renderGroup('Future (Savings)', 'save', 'var(--accent-green)', targetSaves)}

        <button className="btn btn-budget btn-block btn-lg" onClick={evaluateBudget} style={{ marginTop: 24 }}>
          Submit Budget <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
