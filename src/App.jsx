import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
  const { isLoggedIn, onboarded, isInitializing } = useGameState();
  const location = useLocation();

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
