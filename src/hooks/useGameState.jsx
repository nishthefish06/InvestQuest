import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { SIM_STOCKS } from '../data/skills';

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

  worldProgress: { budget: 0, stocks: 0, crypto: 0 },

  budgetScenarioLevel: 1, // tracks user's current scenario

  marketStocks: SIM_STOCKS, // dynamic market data
  stockCash: 100000,
  stockStartingAmount: null, // null = not chosen yet
  holdings: [],
  tradeHistory: [],

  cryptoHoldings: [],
  cryptoCrashBestMultiplier: 0,

  friends: [],
  friendRequests: [],

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
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch(e) { throw new Error(`Server returned non-JSON: ${text.slice(0, 50)}`); }
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    return data;
  },
  async login(username, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch(e) { throw new Error(`Server returned non-JSON: ${text.slice(0, 50)}`); }
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },
  async me(token) {
    const res = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },
  async save(token, gameState) {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ gameState }),
    });
    if (!res.ok) console.error('Save failed', res.status);
  },
  async searchUser(token, username) {
    const res = await fetch(`/api/friends/search?q=${encodeURIComponent(username)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed');
    return data.user;
  },
  async handleFriendRequest(token, action, targetUsername) {
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, targetUsername }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Friend action failed');
    return data;
  }
};

export function GameProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);
  const [token, setToken] = useState(() => localStorage.getItem('iq_token'));
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('iq_token'));
  const [isInitializing, setIsInitializing] = useState(() => !!localStorage.getItem('iq_token'));
  const saveTimer = useRef(null);

  // ── Session Restore & Periodic Sync ─────────────────
  const fetchSessionData = useCallback(async () => {
    const storedToken = localStorage.getItem('iq_token');
    if (!storedToken) {
      setIsInitializing(false);
      return;
    }
    try {
      const data = await API.me(storedToken);
      if (data.gameState) {
         setState((s) => ({
           ...INITIAL_STATE,
           ...data.gameState,
           achievements: s.achievements,
           username: data.username || s.username,
         }));
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem('iq_token');
      setToken(null);
      setIsLoggedIn(false);
      setState(INITIAL_STATE);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Periodic background sync (e.g. for friend request acceptance)
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      fetchSessionData();
    }, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [isLoggedIn, fetchSessionData]);

  // ── Auto-save debounced (save 2s after last state change) ─
  useEffect(() => {
    if (!token || !isLoggedIn) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // achievements, friends, and friendRequests are handled by specific DB requests or atomic ops
      const { achievements, friends, friendRequests, ...saveable } = state;
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

  // ── Market Simulation ──────────────────────────────
  useEffect(() => {
    // Only tick the market if the user is in the Arena (we'll assume the browser timer covers this)
    const timer = setInterval(() => {
      setState((s) => {
        const newMarket = s.marketStocks.map((stock) => {
          // Add -0.5% to +0.5% random fluctuation
          const fluctuation = (Math.random() - 0.5) * 0.01;
          let newPrice = stock.price * (1 + fluctuation);
          newPrice = Math.max(0.01, newPrice); // never go below 1 cent
          
          const newChange = stock.change + (newPrice - stock.price);
          const basePrice = stock.price - stock.change; // rough estimate of yesterday's open
          const newChangePct = ((newChange / basePrice) * 100).toFixed(2);

          return {
            ...stock,
            price: newPrice,
            change: newChange,
            changePct: parseFloat(newChangePct)
          };
        });
        return { ...s, marketStocks: newMarket };
      });
    }, 4000); // Update every 4 seconds

    return () => clearInterval(timer);
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

  const updateBudgetScenario = useCallback((nextLevel) => {
    setState((s) => ({
      ...s,
      budgetScenarioLevel: nextLevel,
      worldProgress: { ...s.worldProgress, budget: Math.min(100, s.worldProgress.budget + 20) },
    }));
  }, []);

  const setCrashBestMultiplier = useCallback((multiplier) => {
    setState((s) => ({
      ...s,
      cryptoCrashBestMultiplier: Math.max(s.cryptoCrashBestMultiplier || 0, multiplier),
      worldProgress: { ...s.worldProgress, crypto: Math.min(100, s.worldProgress.crypto + 15) },
    }));
  }, []);

  // ── Social & Shop Actions ───────────────────────────
  const searchUser = useCallback(async (username) => {
    if (!token) throw new Error('Not authenticated');
    return await API.searchUser(token, username);
  }, [token]);

  const sendFriendRequest = useCallback(async (targetUsername) => {
    if (!token) throw new Error('Not authenticated');
    await API.handleFriendRequest(token, 'send', targetUsername);
  }, [token]);

  const acceptFriendRequest = useCallback(async (targetUsername) => {
    if (!token) throw new Error('Not authenticated');
    const data = await API.handleFriendRequest(token, 'accept', targetUsername);
    setState((s) => ({
      ...s,
      friendRequests: s.friendRequests.filter(req => req !== targetUsername),
      friends: [...s.friends, data.friend]
    }));
  }, [token]);

  const rejectFriendRequest = useCallback(async (targetUsername) => {
    if (!token) throw new Error('Not authenticated');
    await API.handleFriendRequest(token, 'reject', targetUsername);
    setState((s) => ({
      ...s,
      friendRequests: s.friendRequests.filter(req => req !== targetUsername)
    }));
  }, [token]);

  const removeFriend = useCallback(async (targetUsername) => {
    if (!token) throw new Error('Not authenticated');
    await API.handleFriendRequest(token, 'remove', targetUsername);
    setState((s) => ({
      ...s,
      friends: s.friends.filter(f => f.username !== targetUsername)
    }));
  }, [token]);

  // ── Stock Game Additions ───────────────────────────
  const skipTime = useCallback(() => {
    setState((s) => {
      const newMarket = s.marketStocks.map((stock) => {
        // Fast forward effect: simulated 1-week volatility (-10% to +10%)
        const fluctuation = (Math.random() - 0.5) * 0.2;
        let newPrice = stock.price * (1 + fluctuation);
        newPrice = Math.max(0.01, newPrice);
        
        const newChange = stock.change + (newPrice - stock.price);
        const basePrice = stock.price - stock.change;
        const newChangePct = ((newChange / basePrice) * 100).toFixed(2);

        return {
          ...stock,
          price: newPrice,
          change: newChange,
          changePct: parseFloat(newChangePct)
        };
      });
      return { ...s, marketStocks: newMarket, worldProgress: { ...s.worldProgress, stocks: Math.min(100, s.worldProgress.stocks + 2) } };
    });
  }, []);

  const value = {
    ...state, isLoggedIn, token, isInitializing,
    login, signup, logout,
    completeOnboarding, addXP, loseHeart, resetHearts, completeLesson,
    setStartingAmount, executeTrade, updateBudgetScenario, setCrashBestMultiplier, skipTime,
    searchUser, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameState() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState must be inside GameProvider');
  return ctx;
}
