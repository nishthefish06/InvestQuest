# InvestQuest 🪙
### Gamified financial literacy, powered by Gemini AI

> **HackAI 2026** — NRVE Track · Best Use of Gemini API · Best Hack Built with Google Antigravity · Best Use of MongoDB Atlas

**[🚀 Live Demo](https://invest-quest-five.vercel.app/)** · Built with React, Gemini 2.5 Flash, MongoDB Atlas, and Pusher

---

InvestQuest teaches real financial skills — budgeting, stock trading, crypto — through games, not lectures. Every lesson is generated live by Gemini, every quiz is built from what you just learned, and every game session ends with personalised AI coaching on your actual results.

---

## How Gemini Powers the Experience

Gemini isn't a chatbot here — it's the engine behind five distinct gameplay features:

| Feature | What Gemini does |
|---|---|
| **AI Lesson Tutor** | Generates a unique interactive lesson per quest: streaming chat bubbles, tap-to-reveal facts, polls with personalised reactions |
| **AI Quiz Generator** | Builds quiz questions from the lesson content just taught — not a static bank |
| **AI Life Event Engine** | Before each budget round, generates a contextual life event (medical bill, job bonus, car repair) based on the player's current savings, debt, and event history |
| **AI Game Coach** | After each mini-game, delivers feedback referencing the player's actual numbers |
| **AI Portfolio Analyst** | Reviews live stock holdings in the trading simulator, flags concentration risk, suggests a next move |

All AI calls live in `src/services/gemini.js`. Every function has a static fallback so the app never breaks without an API key.

---

## The Three Worlds

**🏖️ Budget Boardwalk** — Gemini generates a surprise life event, you decide how to handle it, then allocate your monthly income across needs/wants/savings. Scored against the 50/30/20 rule.

**📊 Stock Market Shore** — Paper trading simulator with 10 parody stocks, live price ticks, and real-time 1v1 multiplayer battles via Pusher. AI analyses your holdings on demand.

**⛏️ Crypto Caverns** — Minesweeper-style crash game set in real historical scenarios (FTX Collapse, BTC Halving, DeFi Summer). Reveal cells to grow your multiplier, cash out before the rug pull.

---

## Tech Stack

| | |
|---|---|
| Frontend | React 19, React Router v7, Framer Motion |
| AI | Google Gemini 2.5 Flash |
| Database | MongoDB Atlas (auth + persistent game state) |
| Realtime | Pusher (1v1 multiplayer Arena) |
| Backend | Vercel Serverless Functions |
| Deployment | Vercel |

---

## Running Locally

```bash
npm install
```

Create `.env`:

```env
VITE_GEMINI_API_KEY=your_key
MONGODB_URI=your_atlas_uri
JWT_SECRET=any_secret
VITE_PUSHER_APP_KEY=your_key
VITE_PUSHER_CLUSTER=your_cluster
PUSHER_APP_ID=your_id
PUSHER_SECRET=your_secret
```

```bash
npm run dev          # frontend at localhost:5173
vercel dev           # frontend + API functions together
```