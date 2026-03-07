import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const GameContext = createContext();

const INITIAL_STATE = {
  onboarded: false,
  username: 'Trader',
  dailyGoal: 10,
  xp: 0,
  level: 1,
  xpToNext: 500,
  streak: 7,
  hearts: 5,
  lessonsCompleted: 0,
  virtualCash: 5000,

  worldProgress: { budget: 0, stocks: 0, crypto: 0 },

  budget: { income: 3500, savings: 1200, debt: 4500, creditScore: 680, month: 1 },

  stockCash: 100000,
  stockStartingAmount: null, // null = not chosen yet
  holdings: [],
  tradeHistory: [],

  cryptoHoldings: [],
  minesweeperBestScore: 0,

  buddyTransactions: [],

  achievements: [
    { id: 'first_lesson', name: 'First Lesson', icon: '⭐', color: '#f59e0b', earned: true },
    { id: 'streak3', name: '3-Day Streak', icon: '🔥', color: '#ef4444', earned: true },
    { id: 'first_trade', name: 'First Trade', icon: '📈', color: '#10b981', earned: false },
    { id: 'budget_master', name: 'Budget Pro', icon: '🏖️', color: '#06b6d4', earned: false },
    { id: 'crypto_miner', name: 'Crypto Miner', icon: '⛏️', color: '#f59e0b', earned: false },
    { id: 'all_worlds', name: 'Explorer', icon: '🌍', color: '#a855f7', earned: false },
    { id: 'generous', name: 'Generous', icon: '💝', color: '#ec4899', earned: false },
    { id: 'streak30', name: '30-Day Streak', icon: '👑', color: '#f59e0b', earned: false },
  ],
};

// ── API helpers ───────────────────────────────────────
const API = {
  async signup(username, password) {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    return data;
  },
  async login(username, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },
  async save(token, gameState) {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ gameState }),
    });
  },
};

export function GameProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);
  const [token, setToken] = useState(() => localStorage.getItem('iq_token'));
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('iq_token'));
  const saveTimer = useRef(null);

  // Auto-save debounced (save 2s after last state change)
  useEffect(() => {
    if (!token || !isLoggedIn) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const { achievements, ...saveable } = state;
      API.save(token, saveable).catch(() => {});
    }, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [state, token, isLoggedIn]);

  // ── Auth functions ──────────────────────────────────
  const signup = useCallback(async (username, password) => {
    const data = await API.signup(username, password);
    localStorage.setItem('iq_token', data.token);
    setToken(data.token);
    setIsLoggedIn(true);
    setState((s) => ({ ...s, username: data.username, onboarded: false }));
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await API.login(username, password);
    localStorage.setItem('iq_token', data.token);
    setToken(data.token);
    setIsLoggedIn(true);
    if (data.gameState) {
      setState((s) => ({
        ...INITIAL_STATE,
        ...data.gameState,
        achievements: s.achievements, // keep achievement structure
        username: data.username,
      }));
    } else {
      setState((s) => ({ ...s, username: data.username, onboarded: false }));
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('iq_token');
    setToken(null);
    setIsLoggedIn(false);
    setState(INITIAL_STATE);
  }, []);

  // ── Game functions ──────────────────────────────────
  const completeOnboarding = useCallback((data) => {
    setState((s) => ({ ...s, onboarded: true, username: data.username || s.username, dailyGoal: data.dailyGoal || s.dailyGoal }));
  }, []);

  const addXP = useCallback((amount) => {
    setState((s) => {
      let xp = s.xp + amount;
      let level = s.level;
      let xpToNext = s.xpToNext;
      while (xp >= xpToNext) {
        xp -= xpToNext;
        level++;
        xpToNext = Math.floor(xpToNext * 1.3);
      }
      return { ...s, xp, level, xpToNext };
    });
  }, []);

  const loseHeart = useCallback(() => {
    setState((s) => ({ ...s, hearts: Math.max(0, s.hearts - 1) }));
  }, []);

  const resetHearts = useCallback(() => {
    setState((s) => ({ ...s, hearts: 5 }));
  }, []);

  const completeLesson = useCallback((world) => {
    setState((s) => ({
      ...s,
      lessonsCompleted: s.lessonsCompleted + 1,
      worldProgress: { ...s.worldProgress, [world]: Math.min(100, s.worldProgress[world] + 12) },
    }));
  }, []);

  // ── Stock starting amount ──────────────────────────
  const setStartingAmount = useCallback((amount) => {
    setState((s) => ({
      ...s,
      stockCash: amount,
      stockStartingAmount: amount,
      holdings: [],
      tradeHistory: [],
      achievements: s.achievements.map((a) => a.id === 'first_trade' ? { ...a, earned: false } : a),
    }));
  }, []);

  const executeTrade = useCallback((ticker, type, shares, price) => {
    setState((s) => {
      const cost = shares * price;
      let newCash = s.stockCash;
      let newHoldings = [...s.holdings];

      if (type === 'BUY') {
        if (cost > newCash) return s;
        newCash -= cost;
        const existing = newHoldings.find((h) => h.ticker === ticker);
        if (existing) {
          const totalShares = existing.shares + shares;
          existing.avgCost = ((existing.avgCost * existing.shares) + cost) / totalShares;
          existing.shares = totalShares;
        } else {
          newHoldings.push({ ticker, shares, avgCost: price });
        }
      } else {
        const existing = newHoldings.find((h) => h.ticker === ticker);
        if (!existing || existing.shares < shares) return s;
        newCash += cost;
        existing.shares -= shares;
        if (existing.shares === 0) newHoldings = newHoldings.filter((h) => h.ticker !== ticker);
      }

      return {
        ...s,
        stockCash: newCash,
        holdings: newHoldings,
        tradeHistory: [...s.tradeHistory, { ticker, type, shares, price, time: Date.now() }],
        achievements: s.achievements.map((a) => a.id === 'first_trade' ? { ...a, earned: true } : a),
      };
    });
  }, []);

  const updateBudget = useCallback((changes) => {
    setState((s) => ({
      ...s,
      budget: { ...s.budget, ...changes },
      worldProgress: { ...s.worldProgress, budget: Math.min(100, s.worldProgress.budget + 8) },
    }));
  }, []);

  const setMinesweeperScore = useCallback((score) => {
    setState((s) => ({
      ...s,
      minesweeperBestScore: Math.max(s.minesweeperBestScore, score),
      worldProgress: { ...s.worldProgress, crypto: Math.min(100, s.worldProgress.crypto + 10) },
    }));
  }, []);

  const sendMoney = useCallback((buddyId, amount) => {
    setState((s) => {
      if (amount > s.virtualCash || amount <= 0) return s;
      return {
        ...s,
        virtualCash: s.virtualCash - amount,
        buddyTransactions: [...s.buddyTransactions, { to: buddyId, amount, time: Date.now() }],
        achievements: s.achievements.map((a) => a.id === 'generous' ? { ...a, earned: true } : a),
      };
    });
  }, []);

  const value = {
    ...state, isLoggedIn, token,
    login, signup, logout,
    completeOnboarding, addXP, loseHeart, resetHearts, completeLesson,
    setStartingAmount, executeTrade, updateBudget, setMinesweeperScore, sendMoney,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameState() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState must be inside GameProvider');
  return ctx;
}
