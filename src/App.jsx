import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { GameProvider, useGameState } from './hooks/useGameState';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import WorldHub from './pages/WorldHub';
import QuestPlay from './pages/QuestPlay';
import BudgetGame from './pages/BudgetGame';
import Arena from './pages/Arena';
import CryptoGame from './pages/CryptoGame';
import Community from './pages/Community';
import Profile from './pages/Profile';

function AppContent() {
  const { isLoggedIn, onboarded, isInitializing, incomingChallenge, dismissChallenge } = useGameState();
  const location = useLocation();
  const navigate = useNavigate();

  if (isInitializing) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--bg-card-hover)', borderTopColor: 'var(--accent-purple)', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>Loading InvestQuest...</p>
      </div>
    );
  }

  // Not logged in → show login
  if (!isLoggedIn) return <Login />;

  // Logged in but not onboarded → show onboarding
  if (!onboarded) return <Onboarding />;

  const hideNav = ['/budget-game', '/crypto-game'].some((p) => location.pathname.startsWith(p)) ||
                  location.pathname.includes('/quest/');

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes location={location}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/world/:worldId" element={<WorldHub />} />
            <Route path="/quest/:worldId/:questId" element={<QuestPlay />} />
            <Route path="/budget-game" element={<BudgetGame />} />
            <Route path="/arena" element={<Arena />} />
            <Route path="/arena/:matchId" element={<Arena />} />
            <Route path="/crypto-game" element={<CryptoGame />} />
            <Route path="/community" element={<Community />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!hideNav && <BottomNav />}

      {/* ── Global Incoming Challenge Overlay ── */}
      {incomingChallenge && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
            style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', padding: 28, width: '100%', maxWidth: 320, border: '2px solid var(--accent-purple)', textAlign: 'center', boxShadow: 'var(--shadow-glow-purple)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(168,85,247,0.2)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Swords size={32} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: 8 }}>⚔️ Challenge Request!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24, lineHeight: 1.4 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{incomingChallenge.challenger}</strong> has challenged you to a 3-minute stock trading battle!
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={dismissChallenge}
                style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                Decline
              </button>
              <button onClick={() => { navigate(`/arena/${incomingChallenge.matchId}`); dismissChallenge(); }}
                style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--accent-purple)', color: '#fff', border: 'none', fontWeight: 700, boxShadow: '0 0 14px rgba(168,85,247,0.4)' }}>
                Accept
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GameProvider>
  );
}
