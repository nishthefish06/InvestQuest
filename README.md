# InvestQuest 🪙
### Gamified financial literacy, powered by Gemini AI

> **HackAI 2026** — NRVE Track · Best Use of Gemini API · Best Hack Built with Google Antigravity · Best Use of MongoDB Atlas

**[🚀 Live Demo](https://invest-quest-five.vercel.app/)** · React · Gemini 2.5 Flash · MongoDB Atlas · Pusher

---

InvestQuest teaches real financial skills — budgeting, stock trading, crypto — through games, not lectures. Every lesson is generated live by Gemini, every quiz is built from what you just learned, and every game ends with personalised AI coaching on your actual results.

---

## How Gemini Powers the Experience

Gemini isn't a chatbot here — it's the engine behind six distinct gameplay features:

| Feature | What Gemini does |
|---|---|
| **Interactive Lesson Tutor** | Generates a unique lesson per quest as streaming chat bubbles, tap-to-reveal fact cards, and mid-lesson polls with personalised reactions |
| **Dynamic Quiz Generator** | Builds 4 quiz questions directly from the lesson content just taught — not a static bank |
| **Life Event Engine** | Before each budget round, generates a contextual life event (medical bill, job bonus, car repair) based on the player's current savings, debt, and event history |
| **Game Coach** | After each mini-game, delivers feedback referencing the player's actual numbers and decisions |
| **Community Tip Generator** | For peer-submitted courses without a resource link, generates 5 punchy swipeable tip cards on demand |
| **Weekly Recap** | Produces a personalised weekly performance summary with highlights, a roast, friend rankings, and a next-week challenge |

All AI calls live in `src/services/gemini.js`. Every function has a static fallback so the app never breaks without an API key.

---

## The Three Worlds

**🏖️ Budget Boardwalk** — Gemini generates a surprise life event each round; you decide how to handle it, then drag-allocate your monthly income across needs, wants, and savings. Scored against the 50/30/20 rule with AI coaching at the end.

**📊 Stock Market Shore** — Paper trading simulator with 10 parody stocks and live 4-second price ticks. Pick your starting capital ($10K–$500K), build a portfolio, fast-forward weeks, and challenge friends to real-time 3-minute 1v1 trading battles.

**⛏️ Crypto Caverns** — Minesweeper-style crash game set in real historical scenarios (FTX Collapse, BTC Halving, DeFi Summer). Reveal cells to grow your multiplier, cash out before the rug pull. AI explains what actually happened after each round.

---

## Backend Architecture

The backend runs as Vercel Serverless Functions. MongoDB Atlas is the primary data store — it handles everything from auth to game state to social features. Pusher is used purely for real-time event delivery in the Arena.

### MongoDB collections

| Collection | What's stored |
|---|---|
| `users` | Auth credentials (bcrypt), display name, full game state (XP, progress, holdings, friends) |
| `arenaMatches` | Live match state — players, net worths, join timestamps |
| `challenges` | Pending 1v1 challenge invitations with TTL (5 min expiry) |

### API routes (`/api/`)

| Route | Purpose |
|---|---|
| `POST /api/signup` | Create account — hashes password, stores user, returns JWT |
| `POST /api/login` | Verify credentials, return JWT + full game state |
| `GET /api/me` | Restore session from JWT, return latest game state |
| `POST /api/save` | Debounced game state persistence (fires 2s after last change) |
| `GET /api/friends/search` | Look up a user by username |
| `POST /api/friends/request` | Send, accept, reject, or remove a friend |
| `POST /api/arena?action=join` | Register player in an arena match |
| `GET /api/arena?action=status` | Poll match state |
| `POST /api/arena?action=networth` | Update player's net worth in a match |
| `POST /api/challenge?action=send` | Send a 1v1 challenge via DB + Pusher |
| `GET /api/challenge?action=incoming` | Poll for pending incoming challenges |
| `POST /api/pusher/trigger` | Server-side Pusher event relay (JWT-authenticated) |
| `POST /api/pusher/auth` | Pusher channel authorisation for private/presence channels |

### Auth flow

JWT tokens (30-day expiry) are stored in `localStorage`. Every API request includes `Authorization: Bearer <token>`. Game state auto-saves to MongoDB 2 seconds after any state change.

---

## Tech Stack

| | |
|---|---|
| Frontend | React 19, React Router v7, Framer Motion, Lucide React |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Database | MongoDB Atlas (`mongodb` driver) |
| Auth | bcryptjs + jsonwebtoken |
| Realtime | Pusher (arena battles + challenge notifications) |
| Backend | Vercel Serverless Functions |
| Deployment | Vercel |

---

## Running Locally

```bash
npm install
```

Create `.env`:

```env
VITE_GEMINI_API_KEY=your_gemini_key

MONGODB_URI=your_atlas_connection_string
JWT_SECRET=any_random_secret

VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=your_cluster
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_cluster
```

> Note: Pusher requires both `VITE_PUSHER_*` (client-side) and `PUSHER_*` (server-side) vars. The app works without Pusher — multiplayer features just won't connect.

```bash
npm run dev       # Vite dev server at localhost:5173 (frontend only)
vercel dev        # Frontend + all /api serverless functions together
```

The app is fully usable without a Gemini key — every AI feature falls back to static content. Without MongoDB, auth won't work but the UI still loads.