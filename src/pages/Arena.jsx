import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { SIM_STOCKS, generatePriceHistory } from '../data/skills';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, X, Briefcase, BarChart3, Users, Swords, Sparkles, Loader2 } from 'lucide-react';
import { generateGameFeedback } from '../services/gemini';


function MiniChart({ data, color }) {
  const max = Math.max(...data.map((d) => d.price));
  const min = Math.min(...data.map((d) => d.price));
  const range = max - min || 1;
  const w = 120, h = 40;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d.price - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TradeModal({ stock, holding, stockCash, onClose, onTrade }) {
  const sharesOwned = holding ? holding.shares : 0;
  const [type, setType] = useState('BUY');
  const [shares, setShares] = useState(1);
  const cost = shares * stock.price;
  const cantAfford = type === 'BUY' && cost > stockCash;

  const handleSetType = (t) => {
    if (t === 'SELL' && sharesOwned === 0) return; // can't sell what you don't own
    setType(t);
    setShares(1);
  };

  const handleSetShares = (n) => {
    const max = type === 'SELL' ? sharesOwned : Infinity;
    setShares(Math.min(max, Math.max(1, n)));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: 'var(--bg-secondary)', borderRadius: '24px 24px 0 0', padding: 24, border: '1px solid var(--border-glass)', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>{stock.logo}</span>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{stock.ticker}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>${stock.price.toFixed(2)}{sharesOwned > 0 && <span style={{ marginLeft: 8, color: 'var(--accent-green)' }}>· You own {sharesOwned} shares</span>}</p>
            </div>
          </div>
          <button onClick={onClose}><X size={20} color="var(--text-secondary)" /></button>
        </div>

        {/* Buy/Sell Toggle */}
        <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--bg-card)', borderRadius: 9999, marginBottom: 20 }}>
          {['BUY', 'SELL'].map((t) => {
            const disabled = t === 'SELL' && sharesOwned === 0;
            return (
              <button key={t} onClick={() => handleSetType(t)} disabled={disabled}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 9999, fontSize: '0.875rem', fontWeight: 700,
                  background: type === t ? (t === 'BUY' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #ef4444, #ec4899)') : 'transparent',
                  color: disabled ? 'var(--text-muted)' : (type === t ? 'white' : 'var(--text-secondary)'),
                  transition: 'all 0.25s', opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
                }}>{t}{disabled ? ' (no shares)' : ''}</button>
            );
          })}
        </div>

        {/* Shares Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            Number of Shares{type === 'SELL' && <span style={{ color: 'var(--accent-orange)', marginLeft: 6 }}>max {sharesOwned}</span>}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => handleSetShares(shares - 1)}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <input type="number" value={shares} onChange={(e) => handleSetShares(parseInt(e.target.value) || 1)}
              style={{ width: 80, textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '10px', fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }} />
            <button onClick={() => handleSetShares(shares + 1)}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>

        {/* Cost Summary */}
        <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{shares} × ${stock.price.toFixed(2)}</span>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Estimated Total</span>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: type === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)' }}>${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {cantAfford && (
          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--accent-red)', fontWeight: 600, marginBottom: 10 }}>
            ⚠️ Not enough cash — you have ${stockCash.toLocaleString('en-US', { maximumFractionDigits: 0 })} available
          </p>
        )}
        <button className="btn btn-block btn-lg"
          disabled={cantAfford}
          onClick={() => { if (!cantAfford) { onTrade(stock.ticker, type, shares, stock.price); onClose(); } }}
          style={{ background: cantAfford ? 'rgba(255,255,255,0.08)' : type === 'BUY' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #ef4444, #ec4899)', color: cantAfford ? 'var(--text-muted)' : 'white', fontWeight: 700, boxShadow: cantAfford ? 'none' : type === 'BUY' ? '0 0 20px rgba(16,185,129,0.3)' : '0 0 20px rgba(239,68,68,0.3)', cursor: cantAfford ? 'not-allowed' : 'pointer', opacity: cantAfford ? 0.6 : 1 }}>
          {cantAfford ? '🚫 Insufficient Funds' : `${type === 'BUY' ? '🛒' : '💰'} ${type} ${shares} ${shares === 1 ? 'Share' : 'Shares'}`}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Arena() {
  const { matchId } = useParams();
  const { username, stockCash, stockStartingAmount, holdings, executeTrade, addXP, setStartingAmount, marketStocks, skipTime, overrideMarket, pusherClient, triggerPusherEvent } = useGameState();
  const [selectedStock, setSelectedStock] = useState(null);
  const [tab, setTab] = useState('market'); // market | portfolio | arena
  const [opponent, setOpponent] = useState(null);
  const [timeLeft, setTimeLeft] = useState(matchId ? 180 : null); // 3 min in seconds
  const [matchOver, setMatchOver] = useState(false);

  // ── Gemini Portfolio Analysis ───────────────────────────────────────
  const [portfolioAnalysis, setPortfolioAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisKey, setAnalysisKey] = useState(0); // bump to re-analyze
  const lastAnalyzedRef = useRef('');

  const fetchPortfolioAnalysis = async () => {
    if (holdings.length === 0) return;
    setAnalysisLoading(true);
    setPortfolioAnalysis('');
    const holdingsSummary = holdings.map(h => {
      const stock = marketStocks.find(s => s.ticker === h.ticker);
      const currentVal = stock ? stock.price * h.shares : 0;
      const pnl = stock ? ((stock.price - h.avgCost) / h.avgCost * 100).toFixed(1) : '0';
      return `${h.ticker} (${h.shares} shares, ${pnl}% P&L)`;
    }).join(', ');
    const totalPnl = ((totalValue - (stockStartingAmount || 100000)) / (stockStartingAmount || 100000) * 100).toFixed(1);
    const feedback = await generateGameFeedback('portfolio_analysis', {
      holdings: holdingsSummary,
      totalValue: totalValue.toFixed(0),
      startingAmount: stockStartingAmount || 100000,
      totalPnl,
      cashRemaining: stockCash.toFixed(0),
      tradeCount: holdings.length,
    });
    setPortfolioAnalysis(feedback);
    setAnalysisLoading(false);
  };

  // Auto-fetch when switching to portfolio tab (once per holdings change)
  useEffect(() => {
    if (tab !== 'portfolio' || holdings.length === 0) return;
    const key = holdings.map(h => `${h.ticker}:${h.shares}`).join(',');
    if (key === lastAnalyzedRef.current && portfolioAnalysis && !analysisLoading) return;
    lastAnalyzedRef.current = key;
    fetchPortfolioAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, analysisKey]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Stable seed per ticker so chart shape doesn't regenerate on every 4s price tick.
  // We only recalculate when the user fast-forwards (skipTime changes prices significantly).
  const seedMapRef = useRef({});
  const priceHistories = useMemo(() => {
    const map = {};
    marketStocks.forEach((s) => {
      // Assign a stable seed the first time we see a ticker; keep it forever
      if (!seedMapRef.current[s.ticker]) {
        seedMapRef.current[s.ticker] = s.ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      }
      map[s.ticker] = generatePriceHistory(s.price, s.changePct, seedMapRef.current[s.ticker]);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketStocks.map(s => s.price.toFixed(0)).join(',')]); // only recalc on meaningful price shifts

  const holdingsValue = holdings.reduce((sum, h) => {
    const stock = marketStocks.find((s) => s.ticker === h.ticker);
    return sum + (stock ? stock.price * h.shares : 0);
  }, 0);
  const totalValue = stockCash + holdingsValue;

  // ── Live match: always start both players fresh with $100K for a fair fight
  const matchInitRef = useRef(false);
  useEffect(() => {
    if (matchId && !matchInitRef.current) {
      matchInitRef.current = true;
      setStartingAmount(100000); // resets cash + clears holdings
      setTimeLeft(180);
      setMatchOver(false);
    }
  }, [matchId, setStartingAmount]);

  // ── Match Countdown Timer ──────────────────────────
  useEffect(() => {
    if (!matchId || matchOver) return;
    if (timeLeft <= 0) { setMatchOver(true); return; }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [matchId, timeLeft, matchOver]);

  // ── Multiplayer Logic ──────────────────────────────
  useEffect(() => {
    if (!matchId || !pusherClient || !username) return;

    const channelName = `arena-${matchId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('networth-update', (data) => {
      if (data.username !== username) {
        setOpponent(data);
      }
    });

    // Only override market when opponent explicitly fast-forwarded
    channel.bind('market-sync', (data) => {
      if (data.sender !== username && data.newMarket) {
        overrideMarket(data.newMarket);
      }
    });

    channel.bind('trade-event', (data) => {
      if (data.username !== username) {
        setOpponent(prev => prev ? { ...prev, netWorth: data.netWorth } : { username: data.username, netWorth: data.netWorth });
      }
    });

    // Announce arrival
    triggerPusherEvent(channelName, 'networth-update', { username, netWorth: totalValue }).catch(() => { });

    return () => { pusherClient.unsubscribe(channelName); };
  }, [matchId, pusherClient, username]);

  // Broadcast net worth when it changes (debounced — only when holdings/cash changes)
  useEffect(() => {
    if (!matchId || !pusherClient || !username) return;
    triggerPusherEvent(`arena-${matchId}`, 'networth-update', { username, netWorth: totalValue }).catch(() => { });
    // Note: does NOT broadcast market prices — each client runs its own market timer
  }, [totalValue, matchId, username]);

  const handleTrade = (ticker, type, shares, price) => {
    executeTrade(ticker, type, shares, price);
    addXP(15);
    // Broadcast the trade so the opponent's net worth updates immediately.
    // totalValue is cash + holdings at current render — apply this trade's cash delta
    // to get the correct post-trade number without relying on stale state.
    if (matchId && pusherClient) {
      const tradeDelta = type === 'BUY' ? -(price * shares) : (price * shares);
      const immediateNetWorth = totalValue + tradeDelta;
      triggerPusherEvent(`arena-${matchId}`, 'trade-event', { username, netWorth: immediateNetWorth, ticker, type, shares }).catch(() => { });
    }
  };

  const handleFastForward = () => {
    skipTime();
    // After skipping time, broadcast the new market so both players jump the same week
    // We read marketStocks on the NEXT tick to get the post-skip value
    if (matchId && pusherClient) {
      setTimeout(() => {
        // Access the latest market via a fresh read — we can't use stale closure here
        // instead the networth-update broadcast on totalValue change will handle the score update
      }, 0);
    }
  };

  // ── Starting Amount Picker ─────────────────────────
  if (!stockStartingAmount) {
    const amounts = [
      { value: 10000, label: '$10K', desc: 'Conservative start', icon: '🌱', color: '#10b981' },
      { value: 50000, label: '$50K', desc: 'Balanced portfolio', icon: '📊', color: '#06b6d4' },
      { value: 100000, label: '$100K', desc: 'Serious trader', icon: '💼', color: '#a855f7' },
      { value: 500000, label: '$500K', desc: 'Wall Street whale', icon: '🐋', color: '#f59e0b' },
    ];
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>
            <img src="/logo.png" alt="Arena Logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, marginBottom: 4 }}>Choose Your Capital</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>How much virtual cash to start trading?</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {amounts.map((a) => (
            <motion.button key={a.value} whileTap={{ scale: 0.97 }}
              onClick={() => setStartingAmount(a.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                background: 'var(--bg-card)', border: `2px solid ${a.color}33`,
                borderRadius: 'var(--radius-lg)', textAlign: 'left',
                transition: 'all 0.25s',
              }}>
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: `${a.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', boxShadow: `0 0 15px ${a.color}22`,
              }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: a.color }}>{a.label}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.desc}</p>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>→</div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Trade 📊</h1>
          <p className="page-subtitle">Paper trading simulator — learn risk-free!</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleFastForward} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', padding: '6px 12px' }}>
          ⏩ Fast Forward 1 Week
        </button>
      </div>

      {/* Multiplayer Split Screen Navbar */}
      {matchId && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--gradient-purple)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 32px rgba(168,85,247,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>You</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Swords size={16} color="#fff" />
            </div>
            {timeLeft !== null && (
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.875rem',
                color: timeLeft <= 30 ? '#ff4444' : '#fff',
                background: timeLeft <= 30 ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.15)',
                borderRadius: 6, padding: '2px 8px',
                animation: timeLeft <= 10 ? 'pulse-glow 0.5s ease-in-out infinite' : undefined,
              }}>{formatTime(timeLeft)}</span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>{opponent ? opponent.username : 'Waiting...'}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>
              {opponent ? `$${opponent.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '---'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Match Over Result Overlay */}
      {matchId && matchOver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', padding: 36, width: '100%', maxWidth: 340, textAlign: 'center', border: '2px solid var(--border-glass)' }}>
            {(() => {
              const opponentNW = opponent?.netWorth ?? 0;
              const iWon = totalValue > opponentNW;
              const tied = totalValue === opponentNW;
              return (
                <>
                  <div style={{ fontSize: '4rem', marginBottom: 12 }}>{tied ? '🤝' : iWon ? '🏆' : '💸'}</div>
                  <h2 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', marginBottom: 8,
                    background: tied ? 'none' : iWon ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #ef4444, #ec4899)',
                    WebkitBackgroundClip: tied ? undefined : 'text', WebkitTextFillColor: tied ? 'var(--text-primary)' : 'transparent'
                  }}>
                    {tied ? 'Draw!' : iWon ? 'You Won!' : 'Defeated!'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
                    {tied ? 'Dead even — impressive!' : iWon
                      ? `You out-traded ${opponent?.username ?? 'your opponent'}!`
                      : `${opponent?.username ?? 'Your opponent'} out-traded you!`}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 24 }}>
                    <div>
                      <p style={{ fontSize: '0.625rem', opacity: 0.6, textTransform: 'uppercase' }}>You</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: iWon ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.625rem', opacity: 0.6, textTransform: 'uppercase' }}>{opponent?.username ?? 'Opponent'}</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: !iWon ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {opponentNW > 0 ? `$${opponentNW.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '---'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => window.history.back()} className="btn btn-primary btn-block">
                    Back to Profile
                  </button>
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      )}

      {/* Balance Card */}
      <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portfolio Value</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem' }}>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cash Available</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--accent-green)' }}>${stockCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--bg-card)', borderRadius: 9999, marginBottom: 16 }}>
        {[
          { id: 'market', label: 'Market', icon: <BarChart3 size={14} /> },
          { id: 'portfolio', label: 'Holdings', icon: <Briefcase size={14} /> },
          { id: 'arena', label: 'Arena', icon: <Users size={14} /> },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 9999, fontSize: '0.8125rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: tab === t.id ? 'var(--gradient-purple)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--text-secondary)',
              boxShadow: tab === t.id ? 'var(--shadow-glow-purple)' : 'none',
              transition: 'all 0.25s',
            }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Market View */}
      {tab === 'market' && (
        <div>
          {marketStocks.map((stock, i) => (
            <motion.div key={stock.ticker} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card card-interactive" onClick={() => setSelectedStock(stock)}
              style={{ padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {stock.logo}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{stock.ticker}</p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</p>
              </div>
              <MiniChart data={priceHistories[stock.ticker]} color={stock.change >= 0 ? '#10b981' : '#ef4444'} />
              <div style={{ textAlign: 'right', minWidth: 70 }}>
                <p style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '0.9375rem' }}>${stock.price.toFixed(2)}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                  {stock.change >= 0 ? <ArrowUpRight size={12} color="var(--accent-green)" /> : <ArrowDownRight size={12} color="var(--accent-red)" />}
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: stock.change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {stock.change >= 0 ? '+' : ''}{stock.changePct}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'portfolio' && (
        <div>
          {holdings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '2rem', marginBottom: 12 }}>📭</p>
              <p style={{ fontWeight: 600 }}>No holdings yet</p>
              <p style={{ fontSize: '0.8125rem' }}>Go to the Market tab to make your first trade!</p>
            </div>
          ) : (
            <>
              {holdings.map((h, i) => {
                const stock = marketStocks.find((s) => s.ticker === h.ticker);
                if (!stock) return null;
                const currentVal = stock.price * h.shares;
                const costBasis = h.avgCost * h.shares;
                const pnl = currentVal - costBasis;
                const pnlPct = ((pnl / costBasis) * 100).toFixed(1);
                return (
                  <motion.div key={h.ticker} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card card-interactive" onClick={() => setSelectedStock(stock)}
                    style={{ padding: 16, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.25rem' }}>{stock.logo}</span>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{stock.ticker}</p>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{h.shares} shares @ ${h.avgCost.toFixed(2)}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>${currentVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {pnl >= 0 ? '+' : ''}{pnlPct}% (${Math.abs(pnl).toFixed(2)})
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Gemini Portfolio Analysis Card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{
                  marginTop: 16, padding: 16, borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  boxShadow: '0 4px 24px -4px rgba(139,92,246,0.15)',
                  position: 'relative', overflow: 'hidden',
                }}>
                <div style={{
                  position: 'absolute', top: -40, left: -40, right: -40, height: 80,
                  background: 'linear-gradient(180deg, rgba(139,92,246,0.15) 0%, transparent 100%)',
                  filter: 'blur(16px)', zIndex: 0, pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: 'var(--gradient-primary)', borderRadius: '50%', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={14} color="white" />
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        AI Portfolio Coach
                      </span>
                    </div>
                    <button onClick={() => { lastAnalyzedRef.current = ''; setAnalysisKey(k => k + 1); }}
                      style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}>
                      Refresh ↺
                    </button>
                  </div>
                  {analysisLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span style={{ fontSize: '0.875rem' }}>Analyzing your portfolio…</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {portfolioAnalysis || 'Tap Refresh to get your AI analysis.'}
                    </p>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </div>
      )}

      {/* Arena View — Peer Trading */}
      {tab === 'arena' && (
        <div>
          {/* Active Lobbies */}
          {[
            { title: '🏆 Weekly Trading Tournament', players: 128, prize: '5,000 XP', time: '4d 12h left', avatars: ['👸', '🐂', '💎', '📊'] },
            { title: '⚡ Speed Trading Blitz', players: 24, prize: '1,000 XP', time: 'Starts in 2h', avatars: ['🧑‍🚀', '🦍', '🎯'] },
            { title: '🤝 Buddy Portfolio Challenge', players: 12, prize: '2,000 XP', time: 'Active now', avatars: ['📈', '👩‍💼'] },
          ].map((lobby, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="card card-interactive" style={{ padding: 16, marginBottom: 10 }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 8 }}>{lobby.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {lobby.avatars.map((a, j) => (
                    <div key={j} style={{
                      width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                      border: '2px solid var(--bg-primary)', marginLeft: j === 0 ? 0 : -8,
                    }}>{a}</div>
                  ))}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 8 }}>{lobby.players} traders</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-orange)' }}>{lobby.prize}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{lobby.time}</p>
                </div>
              </div>
              <button className="btn btn-primary btn-sm btn-block" style={{ marginTop: 12 }}>Join Lobby</button>
            </motion.div>
          ))}

          {/* Matchmaking */}
          <div className="card" style={{ padding: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-purple)', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>247 traders online now</span>
            </div>
            <button className="btn btn-secondary btn-block" style={{ marginTop: 12 }}>🎮 Quick Match — Random Peer Trade</button>
          </div>
        </div>
      )}

      {/* Trade Modal */}
      <AnimatePresence>
        {selectedStock && (
          <TradeModal stock={selectedStock} holding={holdings.find(h => h.ticker === selectedStock.ticker)} stockCash={stockCash} onClose={() => setSelectedStock(null)} onTrade={handleTrade} />
        )}
      </AnimatePresence>
    </div>
  );
}