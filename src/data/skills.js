// ── WORLDS ──────────────────────────────────────────────
export const WORLDS = [
  {
    id: 'budget', name: 'Budget Boardwalk', icon: '🏖️',
    color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    desc: 'Master daily budgeting, saving & emergencies',
    multiplayer: false, tagline: 'Simulate real life finances',
  },
  {
    id: 'stocks', name: 'Stock Market Shore', icon: '📊',
    color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)',
    desc: 'Research companies, pick stocks & manage risk',
    multiplayer: true, tagline: 'Trade & compete with peers',
  },
  {
    id: 'crypto', name: 'Crypto Caverns', icon: '⛏️',
    color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    desc: 'Navigate volatile crypto markets & avoid rug pulls',
    multiplayer: true, tagline: 'Mine profits, dodge crashes',
  },
];

// ── QUESTS PER WORLD ────────────────────────────────────
export const QUESTS = {
  budget: [
    { id: 'b1', title: 'What is a Budget?', desc: 'Income vs expenses basics', xp: 50, type: 'solo', status: 'available', module: 'basics' },
    { id: 'b2', title: 'Needs vs Wants', desc: 'Prioritize your spending', xp: 50, type: 'solo', status: 'available', module: 'basics' },
    { id: 'b3', title: 'Emergency Fund 101', desc: 'Why you need 3-6 months saved', xp: 60, type: 'solo', status: 'available', module: 'basics' },
    { id: 'b4', title: '50/30/20 Rule', desc: 'The classic budgeting formula', xp: 70, type: 'solo', status: 'locked', module: 'basics' },
    { id: 'b5', title: 'Life Sim: Month 1', desc: 'Play Budget Boardwalk!', xp: 120, type: 'sim', status: 'locked', module: 'basics' },
    { id: 'b6', title: 'Debt Snowball', desc: 'Strategies to crush debt', xp: 80, type: 'solo', status: 'locked', module: 'advanced' },
    { id: 'b7', title: 'Credit Score Secrets', desc: 'Build & protect your score', xp: 80, type: 'solo', status: 'locked', module: 'advanced' },
    { id: 'b8', title: 'Insurance Basics', desc: 'Health, auto, renters & more', xp: 70, type: 'solo', status: 'locked', module: 'advanced' },
  ],
  stocks: [
    { id: 's1', title: 'What is a Stock?', desc: 'Equity ownership explained', xp: 50, type: 'solo', status: 'available', module: 'basics' },
    { id: 's2', title: 'Bulls & Bears', desc: 'Market directions & cycles', xp: 50, type: 'solo', status: 'available', module: 'basics' },
    { id: 's3', title: 'How Exchanges Work', desc: 'NYSE, NASDAQ & order types', xp: 60, type: 'solo', status: 'available', module: 'basics' },
    { id: 's4', title: 'Group: Stock Pitch', desc: 'Research & pitch to peers', xp: 120, type: 'group', status: 'locked', module: 'basics' },
    { id: 's5', title: 'Your First Trade', desc: 'Paper trade simulation', xp: 100, type: 'sim', status: 'locked', module: 'basics' },
    { id: 's6', title: 'Reading Charts', desc: 'Candlesticks, volume, trends', xp: 80, type: 'solo', status: 'locked', module: 'analysis' },
    { id: 's7', title: 'P/E Ratios', desc: 'Fundamental analysis basics', xp: 80, type: 'solo', status: 'locked', module: 'analysis' },
    { id: 's8', title: 'Portfolio Theory', desc: 'Diversification & allocation', xp: 90, type: 'solo', status: 'locked', module: 'strategy' },
  ],
  crypto: [
    { id: 'c1', title: 'What is Crypto?', desc: 'Blockchain & decentralization', xp: 50, type: 'solo', status: 'available', module: 'basics' },
    { id: 'c2', title: 'Bitcoin vs Altcoins', desc: 'The crypto landscape', xp: 50, type: 'solo', status: 'available', module: 'basics' },
    { id: 'c3', title: 'Wallets & Keys', desc: 'Not your keys, not your coins', xp: 60, type: 'solo', status: 'available', module: 'basics' },
    { id: 'c4', title: 'Spot the Rug Pull', desc: 'Red flags & scam detection', xp: 100, type: 'solo', status: 'locked', module: 'basics' },
    { id: 'c5', title: 'Crypto Minesweeper', desc: 'Play Crypto Caverns!', xp: 150, type: 'sim', status: 'locked', module: 'basics' },
    { id: 'c6', title: 'DeFi Explained', desc: 'Lending, staking & yield', xp: 80, type: 'solo', status: 'locked', module: 'advanced' },
    { id: 'c7', title: 'NFTs & Tokens', desc: 'Beyond currency', xp: 70, type: 'solo', status: 'locked', module: 'advanced' },
    { id: 'c8', title: 'Cavern Raid', desc: 'Multiplayer minesweeper', xp: 200, type: 'group', status: 'locked', module: 'advanced' },
  ],
};

// ── QUIZ DATA PER WORLD ─────────────────────────────────
export const QUIZ_DATA = {
  budget: [
    { question: 'The 50/30/20 rule suggests what % for needs?', options: ['50%', '30%', '20%', '40%'], correct: 0, xp: 15 },
    { question: 'What is an emergency fund?', options: ['3-6 months of expenses saved', 'A credit card for emergencies', 'Money in stocks', 'A type of insurance'], correct: 0, xp: 15 },
    { question: 'Which debt payoff method targets smallest balances first?', options: ['Debt Avalanche', 'Debt Snowball', 'Debt Consolidation', 'Debt Spiral'], correct: 1, xp: 20 },
    { question: 'What hurts your credit score the most?', options: ['Checking your score', 'Late payments', 'Having multiple cards', 'Paying in full'], correct: 1, xp: 15 },
    { question: 'Which is a "need" vs a "want"?', options: ['Netflix subscription', 'Designer sneakers', 'Rent payment', 'Concert tickets'], correct: 2, xp: 10 },
  ],
  stocks: [
    { question: 'What does IPO stand for?', options: ['Initial Public Offering', 'Internal Profit Operation', 'Investment Portfolio Option', 'Index Price Order'], correct: 0, xp: 15 },
    { question: 'A "bear market" means prices are...', options: ['Rising', 'Falling', 'Stable', 'Volatile'], correct: 1, xp: 15 },
    { question: 'What does P/E ratio measure?', options: ['Profit / Equity', 'Price / Earnings', 'Portfolio / Expenses', 'Potential / Estimate'], correct: 1, xp: 20 },
    { question: 'Diversification helps reduce...', options: ['Returns', 'Risk', 'Taxes', 'Volume'], correct: 1, xp: 15 },
    { question: 'What is a dividend?', options: ['A stock split', 'A company\'s profit paid to shareholders', 'A trading fee', 'A type of bond'], correct: 1, xp: 15 },
  ],
  crypto: [
    { question: 'What technology powers Bitcoin?', options: ['AI', 'Blockchain', 'Cloud computing', 'Quantum computing'], correct: 1, xp: 15 },
    { question: 'What is a "rug pull" in crypto?', options: ['A market correction', 'Developers abandoning a project & taking funds', 'A mining technique', 'A trading strategy'], correct: 1, xp: 20 },
    { question: '"Not your keys, not your coins" refers to...', options: ['Mining difficulty', 'Wallet security & ownership', 'Trading limits', 'Token supply'], correct: 1, xp: 15 },
    { question: 'What is DeFi?', options: ['Definite Finance', 'Decentralized Finance', 'Deficit Financing', 'Default Insurance'], correct: 1, xp: 15 },
    { question: 'Which is the largest crypto by market cap?', options: ['Ethereum', 'Solana', 'Bitcoin', 'Dogecoin'], correct: 2, xp: 10 },
  ],
};

// ── STOCK MARKET DATA (parody names) ────────────────────
export const SIM_STOCKS = [
  { ticker: 'BNAN', name: 'Banana Inc.', logo: '🍌', price: 178.52, change: 2.35, changePct: 1.33 },
  { ticker: 'MHRD', name: 'Megahard Corp.', logo: '🪟', price: 412.18, change: -1.56, changePct: -0.38 },
  { ticker: 'GOGL', name: 'Goggle Inc.', logo: '🥽', price: 175.98, change: 3.22, changePct: 1.86 },
  { ticker: 'RAIN', name: 'Rainforest.com', logo: '🌧️', price: 198.45, change: 4.12, changePct: 2.12 },
  { ticker: 'VOLT', name: 'Voltage Motors', logo: '⚡', price: 248.76, change: -8.32, changePct: -3.23 },
  { ticker: 'GPUU', name: 'GigaChip Corp.', logo: '🧠', price: 875.30, change: 15.42, changePct: 1.79 },
  { ticker: 'BNKS', name: 'BigBank & Sons', logo: '🏛️', price: 198.44, change: 1.22, changePct: 0.62 },
  { ticker: 'SWPE', name: 'SwipePay Inc.', logo: '💳', price: 282.10, change: 0.89, changePct: 0.32 },
  { ticker: 'HLTH', name: 'HealthyBros Co.', logo: '💊', price: 156.32, change: -0.45, changePct: -0.29 },
  { ticker: 'FIZZ', name: 'FizzBuzz Cola', logo: '🥤', price: 61.25, change: 0.18, changePct: 0.29 },
];

export function generatePriceHistory(basePrice, changePct = 0) {
  const data = [];
  const days = 30;
  // Start price derived from current price and the % change so the chart ends at basePrice
  const startPrice = basePrice / (1 + changePct / 100);
  const drift = (basePrice - startPrice) / days; // per-day drift toward current price
  let p = startPrice;
  for (let i = 0; i < days; i++) {
    // Add the drift + small random noise (capped so it doesn't overwhelm the trend)
    const noise = (Math.random() - 0.5) * (basePrice * 0.005);
    p += drift + noise;
    p = Math.max(p, startPrice * 0.9); // floor to prevent crazy dips
    data.push({ day: i, price: p });
  }
  // Ensure the last point is exactly the current price
  data[days - 1].price = basePrice;
  return data;
}

// ── CRYPTO DATA ──────────────────────────────────────────
export const CRYPTO_TOKENS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: '₿', price: 67420, change: 2.1, color: '#f7931a' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: '◆', price: 3580, change: -0.8, color: '#627eea' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', icon: '◎', price: 148.5, change: 5.2, color: '#9945ff' },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', icon: '🐕', price: 0.162, change: -3.1, color: '#c3a634' },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', icon: '⬡', price: 0.58, change: 1.4, color: '#0033ad' },
  { id: 'rug1', name: 'MoonCoin', symbol: 'MOON', icon: '🌙', price: 0.0042, change: 420.0, color: '#ff4444', isRug: true },
  { id: 'rug2', name: 'SafeYield', symbol: 'SAFE', icon: '🛡️', price: 0.89, change: 85.0, color: '#ff4444', isRug: true },
];

// ── BUDGET EVENTS ────────────────────────────────────────
export const BUDGET_EVENTS = [
  { id: 'e1', title: '🚗 Car Broke Down', desc: 'Transmission repair needed', cost: 1200, type: 'emergency', emoji: '🔧' },
  { id: 'e2', title: '🎉 Birthday Gift', desc: 'Your friend\'s birthday is coming', cost: 75, type: 'want', emoji: '🎁' },
  { id: 'e3', title: '💰 Tax Refund!', desc: 'IRS sent your refund', cost: -850, type: 'income', emoji: '💸' },
  { id: 'e4', title: '🏥 Medical Bill', desc: 'Unexpected doctor visit', cost: 350, type: 'emergency', emoji: '💉' },
  { id: 'e5', title: '📱 Phone Cracked', desc: 'Screen replacement needed', cost: 250, type: 'emergency', emoji: '📱' },
  { id: 'e6', title: '🎵 Concert Tickets', desc: 'Your favorite artist is in town!', cost: 120, type: 'want', emoji: '🎶' },
  { id: 'e7', title: '💼 Side Gig Income', desc: 'Freelance project payment', cost: -500, type: 'income', emoji: '💼' },
  { id: 'e8', title: '🏠 Rent Increase', desc: 'Landlord raised rent by $100/mo', cost: 100, type: 'need', emoji: '🏠' },
  { id: 'e9', title: '🛒 Grocery Sale', desc: 'Stock up on bulk deals', cost: -40, type: 'savings', emoji: '🛒' },
  { id: 'e10', title: '⚡ Utility Spike', desc: 'Summer AC bill is brutal', cost: 180, type: 'need', emoji: '⚡' },
];

export const BUDGET_CATEGORIES = [
  { id: 'rent', name: 'Rent/Housing', icon: '🏠', suggested: 1200 },
  { id: 'food', name: 'Food/Groceries', icon: '🛒', suggested: 400 },
  { id: 'transport', name: 'Transport', icon: '🚗', suggested: 200 },
  { id: 'utilities', name: 'Utilities', icon: '⚡', suggested: 150 },
  { id: 'savings', name: 'Savings', icon: '🏦', suggested: 500 },
  { id: 'fun', name: 'Fun/Entertainment', icon: '🎮', suggested: 200 },
];

// ── PEER / SOCIAL ────────────────────────────────────────
export const BUDDY_LIST = [
  { id: 1, name: 'Alex_Trader', avatar: '🧑‍🚀', level: 12, streak: 14, xp: 4200, online: true, worlds: { budget: 65, stocks: 40, crypto: 25 } },
  { id: 2, name: 'NiaSaves', avatar: '👸', level: 9, streak: 7, xp: 2800, online: true, worlds: { budget: 80, stocks: 20, crypto: 10 } },
  { id: 3, name: 'CryptoKid_J', avatar: '🦍', level: 15, streak: 21, xp: 6100, online: false, worlds: { budget: 30, stocks: 55, crypto: 90 } },
  { id: 4, name: 'DividendDan', avatar: '💎', level: 7, streak: 3, xp: 1900, online: false, worlds: { budget: 45, stocks: 70, crypto: 15 } },
];

// ── DAILY GOALS ──────────────────────────────────────────
export const DAILY_GOALS = [
  { id: 1, label: '5 min/day', icon: '🌱', minutes: 5 },
  { id: 2, label: '10 min/day', icon: '🌿', minutes: 10 },
  { id: 3, label: '15 min/day', icon: '🌳', minutes: 15 },
  { id: 4, label: '20 min/day', icon: '🔥', minutes: 20 },
];

// ── MODULES PER WORLD ────────────────────────────────────
export const MODULES = {
  budget: [
    { id: 'basics', name: 'Budgeting 101', icon: '🏖️' },
    { id: 'advanced', name: 'Advanced Money', icon: '💳' },
  ],
  stocks: [
    { id: 'basics', name: 'Market Basics', icon: '📊' },
    { id: 'analysis', name: 'Chart Analysis', icon: '📈' },
    { id: 'strategy', name: 'Strategies', icon: '🎯' },
  ],
  crypto: [
    { id: 'basics', name: 'Crypto 101', icon: '⛏️' },
    { id: 'advanced', name: 'DeFi & Beyond', icon: '🌐' },
  ],
};
