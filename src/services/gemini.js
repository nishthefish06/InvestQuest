import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Fetches a structured interactive lesson as a JSON array of blocks.
 * Block types: 'bubble' | 'reveal' | 'poll'
 * @returns {Promise<Array>} array of blocks
 */
export async function fetchLesson(questTitle, worldId) {
  const worldContext = {
    budget: 'personal finance, budgeting, saving, debt management, and the 50/30/20 rule',
    stocks: 'stock market investing, trading, equities, market analysis, and portfolio management',
    crypto: 'cryptocurrency, blockchain technology, decentralized finance, and crypto security',
  }[worldId] || 'personal finance';

  if (!genAI) {
    return getFallbackLesson(questTitle, worldContext);
  }

  const prompt = `You are a fun, Gen-Z-friendly financial tutor inside InvestQuest, a gamified finance learning app.
Create an interactive lesson about "${questTitle}" (context: ${worldContext}).

Return a JSON array of blocks. Use exactly this structure — no extra keys, no markdown fences:

[
  { "type": "bubble", "text": "...", "emoji": "💡" },
  { "type": "reveal", "hint": "Tap to reveal a key fact", "fact": "...", "emoji": "🔑" },
  { "type": "bubble", "text": "...", "emoji": "📊" },
  { "type": "poll", "question": "Quick check — what do YOU think?", "options": ["Option A", "Option B"], "reactions": ["Gemini reaction to A (1 sentence, fun)", "Gemini reaction to B (1 sentence, fun)"] },
  { "type": "bubble", "text": "...", "emoji": "🚀" }
]

Rules:
- 5 to 8 blocks total
- Start with a bubble that hooks them with a surprising fact or relatable scenario
- Include 1 to 3 polls (gut-checks, NOT graded — just get them thinking)
- Include 1 to 2 reveal cards for key terms or surprising stats
- Each bubble is 1-3 short punchy sentences max — like a friend texting you
- Poll options should be 2-3 words each, casual and fun
- Poll reactions must directly acknowledge their choice and connect to the lesson
- End with a bubble that hypes them up for the quiz
- Emojis should feel natural, not forced
- Write like a smart encouraging friend, NEVER like a textbook
- Return ONLY the JSON array, nothing else`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await withRetry(() => model.generateContent(prompt));
    const raw = result.response.text().replace(/```json|```/g, '').trim();
    const blocks = JSON.parse(raw);
    if (!Array.isArray(blocks) || blocks.length === 0) throw new Error('Invalid lesson format');
    return blocks;
  } catch (error) {
    console.error('fetchLesson error:', error);
    return getFallbackLesson(questTitle, worldContext);
  }
}

function getFallbackLesson(questTitle, worldContext) {
  return [
    { type: 'bubble', text: `Let's talk about ${questTitle}! 🎓 This is one of the most important concepts in ${worldContext}.`, emoji: '👋' },
    { type: 'reveal', hint: 'Tap to reveal why this matters', fact: `Understanding ${questTitle} can save — or make — you thousands of dollars over your lifetime.`, emoji: '💰' },
    { type: 'bubble', text: "The key idea is simple once you see it. Most people overcomplicate this stuff — you won't. 💪", emoji: '💡' },
    { type: 'poll', question: 'Have you ever thought about this before?', options: ['Yep, totally', 'New to me!'], reactions: ["Love it — prior knowledge makes this click even faster! 🧠", "Perfect time to learn — no bad habits to unlearn! 🌱"] },
    { type: 'bubble', text: "Now that you've got the concept, let's lock it in with the quiz. You've got this! 🚀", emoji: '🏆' },
  ];
}


/**
 * Generates quiz questions based on the lesson content for a specific quest.
 * @param {string} questTitle - the quest/lesson name
 * @param {string} lessonText - the AI lesson content that was just taught
 * @param {string} worldId - 'budget' | 'stocks' | 'crypto'
 * @returns {Promise<Array<{question, options, correct, xp}>>}
 */
export async function generateQuizQuestions(questTitle, lessonText, worldId) {
  if (!genAI) {
    return getFallbackQuestions(worldId);
  }

  const prompt = `You are a quiz generator for InvestQuest, a gamified finance learning app.
Based on this lesson about "${questTitle}":

---
${lessonText}
---

Generate exactly 4 multiple-choice quiz questions that test understanding of this specific content.

Rules:
- Questions must be directly based on the lesson above — not generic finance trivia
- Each question has exactly 4 answer options (A, B, C, D)
- Exactly 1 correct answer per question
- Wrong answers should be plausible, not obviously silly
- Questions should range from recall (1-2) to application/understanding (2-3)
- xp: award 15 for recall questions, 20 for application questions

Return ONLY valid JSON, no markdown fences, no explanation:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correct": 0,
    "xp": 15
  }
]`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await withRetry(() => model.generateContent(prompt));
    const raw = result.response.text().replace(/```json|```/g, '').trim();
    const questions = JSON.parse(raw);
    if (!Array.isArray(questions) || questions.length === 0) throw new Error('Invalid questions format');
    return questions;
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    return getFallbackQuestions(worldId);
  }
}

function getFallbackQuestions(worldId) {
  const fallbacks = {
    budget: [
      { question: 'What does the 50/30/20 rule recommend for savings?', options: ['50%', '30%', '20%', '10%'], correct: 2, xp: 15 },
      { question: 'An emergency fund should ideally cover how many months of expenses?', options: ['1 month', '3-6 months', '12 months', '2 weeks'], correct: 1, xp: 15 },
      { question: 'Which of these is a "need" in a budget?', options: ['Streaming services', 'Rent', 'Dining out', 'New shoes'], correct: 1, xp: 15 },
      { question: 'What is the debt snowball method?', options: ['Pay highest interest first', 'Pay smallest balance first', 'Pay minimum on all debts', 'Consolidate all loans'], correct: 1, xp: 20 },
    ],
    stocks: [
      { question: 'What does owning a stock mean?', options: ['You lent money to a company', 'You own a small piece of a company', 'You have a fixed interest return', 'You manage the company'], correct: 1, xp: 15 },
      { question: 'A bear market is characterized by:', options: ['Rising prices', 'Stable prices', 'Falling prices', 'High volume'], correct: 2, xp: 15 },
      { question: 'What does P/E ratio stand for?', options: ['Profit / Equity', 'Price / Earnings', 'Portfolio / Expenses', 'Potential Earnings'], correct: 1, xp: 20 },
      { question: 'Diversification is a strategy to:', options: ['Maximize returns', 'Reduce risk', 'Increase volatility', 'Pick winning stocks'], correct: 1, xp: 15 },
    ],
    crypto: [
      { question: 'What is the core technology behind Bitcoin?', options: ['AI', 'Blockchain', 'Cloud computing', 'The internet'], correct: 1, xp: 15 },
      { question: 'What is a crypto "rug pull"?', options: ['A market crash', 'Developers abandoning a project with funds', 'A trading fee', 'A mining reward'], correct: 1, xp: 20 },
      { question: '"Not your keys, not your coins" means:', options: ['Physical coins are real', 'You need private keys to truly own crypto', 'Exchanges are safe', 'Mining is required'], correct: 1, xp: 15 },
      { question: 'What is DeFi short for?', options: ['Defined Finance', 'Decentralized Finance', 'Deficit Financing', 'Default Insurance'], correct: 1, xp: 15 },
    ],
  };
  return fallbacks[worldId] || fallbacks.stocks;
}

/**
 * Wraps an async fn with exponential backoff for 429 rate-limit errors.
 * Caps wait time to 8s and limits retries to 1 so the UI never freezes.
 */
async function withRetry(fn, maxRetries = 1) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.message?.includes('429') || err.message?.includes('Resource has been exhausted') || err.message?.includes('Please retry');
      if (isRateLimit && attempt < maxRetries) {
        // Cap at 8s regardless of what Google says — we can't freeze the UI
        const waitMs = 8000;
        console.warn(`[Gemini] Rate limited. Waiting 8s before retry...`);
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Generates personalized, engaging feedback based on the player's minigame results.
 * @param {string} gameType - The type of game ('budget' or 'crypto')
 * @param {object} gameState - The current state/results of the game
 * @returns {Promise<string>} The AI's response text
 */
export async function generateGameFeedback(gameType, gameState) {
  if (!genAI) {
    return "Whoops! The Gemini API key hasn't been set up yet. Add it to your .env file to unlock my AI insights! ✨";
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt = '';

    if (gameType === 'budget') {
      const { score, savings, debt, savingsRate } = gameState;
      prompt = `
You are a fun, enthusiastic, and highly encouraging financial advisor character in an educational app called InvestQuest. 
The user just finished a round of a budgeting minigame ('Budget Boardwalk').

Here are their results for the month:
- Overall Score: ${score}/100
- Total Savings: $${savings.toLocaleString()}
- Total Debt: $${debt.toLocaleString()}
- Savings Rate: ${savingsRate}%

Instructions:
1. Give them a short, punchy piece of feedback (2-3 sentences max).
2. Keep the tone very positive, uplifting, and hype-focused. Even if they have a lot of debt, frame it as a learning opportunity or cheer them on for trying!
3. Include emojis to make it fun.
4. Give one very specific, actionable tip based on their results (e.g., if their debt is high, mention paying it down; if savings are high, praise their discipline).
      `;
    } else if (gameType === 'budget_scenario') {
      const { score, scenarioTitle, needsPct, wantsPct, savesPct, income, feedback } = gameState;
      prompt = `
You are a fun, encouraging financial coach in InvestQuest, a finance learning app.
The player just completed a budget scenario called "${scenarioTitle}" with income of $${income}/month.

Their 50/30/20 breakdown:
- Needs: ${needsPct}% (goal: 50%)
- Wants: ${wantsPct}% (goal: 30%)
- Savings: ${savesPct}% (goal: 20%)
- Score: ${score}/100

The game already told them: ${feedback.length > 0 ? feedback.join(' | ') : 'no specific issues flagged'}

Instructions:
1. 2-3 sentences max. Be punchy and specific — reference their actual percentages.
2. If savings < 15%: warn them warmly but urgently about the savings gap.
3. If needs > 55%: acknowledge cost-of-living pressure and suggest one real strategy (meal prep, refinancing, etc.)
4. If wants > 35%: gently call it out with a relatable analogy.
5. If score >= 80: hype them up genuinely, don't be generic.
6. End with one concrete real-world tip they can use TODAY. Include emojis.
      `;
    } else if (gameType === 'crypto') {
      const { pnlPct, pnlAmount, cashedOut, moves, scenarioName, scenarioYear, lesson } = gameState;

      const outcomeContext = cashedOut
        ? `They cashed out with a ${pnlPct}% return (${pnlAmount >= 0 ? '+' : ''}$${pnlAmount.toLocaleString()}) after ${moves} safe cells.`
        : `They hit a rug pull and lost their bet after ${moves} safe cells.`;

      prompt = `
You are a hype-centric, positive, but educational 'Crypto Guru' character in an educational app called InvestQuest.
The user just played a scenario called "${scenarioName || 'Crypto'}" (${scenarioYear || ''}).

What happened in the game: ${outcomeContext}

The real-world context for this scenario: ${lesson || ''}

Instructions:
1. 3-4 sentences total. Start with their game outcome, then connect it to the real-world event naturally.
2. If they cashed out: hype their decision-making AND tie it to what smart investors did in the real event.
3. If they got rugged: be a comforting friend, then explain what the real-world lesson means for avoiding this in real life.
4. End with one concrete takeaway they can apply to real crypto investing. Include emojis!
      `;
    } else {
      throw new Error('Unknown game type');
    }

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT: Gemini took too long. Please retry.')), 15000)
    );
    const result = await Promise.race([
      withRetry(() => model.generateContent(prompt)),
      timeout,
    ]);
    const response = await result.response;
    return response.text();

  } catch (error) {
    const msg = error.message || '';
    const isRateLimit =
      error.status === 429 ||
      msg.includes('429') ||
      msg.includes('rate-limit') ||
      msg.includes('rate limit') ||
      msg.includes('Resource has been exhausted') ||
      msg.includes('Please retry') ||
      msg.includes('quota');

    if (isRateLimit) {
      console.error('GEMINI ERROR: Rate limited.', msg.slice(0, 100));
      return "Wow! You've got me thinking too hard. 🧠 Google's rate limit is holding on — click Try Again in 30 seconds!";
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
      console.error('GEMINI ERROR: Invalid API Key.');
      return "Whoops! It looks like my API key is invalid or has been revoked. 🔐 Please update the VITE_GEMINI_API_KEY in your .env file!";
    }
    if (msg.includes('TIMEOUT')) {
      return "Wow! You've got me thinking too hard. 🧠 The request timed out — click Try Again in a moment!";
    }
    console.error('GEMINI ERROR:', msg.slice(0, 200));
    return "Looks like my AI brain is taking a quick nap! 😴 Try again later!";
  }
}

/**
 * Generates a dynamic budget simulation event tailored to the player's current state.
 * Returns structured JSON — not freeform text — ready to render as a game card.
 * @param {object} playerState - { balance, monthlyIncome, monthlyExpenses, savings, debt, month, recentEvents }
 * @returns {Promise<{title, description, category, urgency, choices: Array<{label, cost, action, consequence, savingsImpact}>}>}
 */
export async function generateSimEvent(playerState) {
  if (!genAI) {
    // Fallback so the game still works without an API key
    return {
      title: "Surprise Expense",
      description: "Something unexpected came up. How will you handle it?",
      category: "emergency",
      urgency: "immediate",
      emoji: "⚡",
      choices: [
        { label: "Pay from savings", cost: 300, action: "savings", consequence: "Handled it cleanly.", savingsImpact: -300 },
        { label: "Put it on debt", cost: 0, action: "debt", consequence: "Adds $300 to your debt.", savingsImpact: 0 },
        { label: "Negotiate it down", cost: 150, action: "savings", consequence: "Partial win — paid half.", savingsImpact: -150 },
      ],
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const recent = (playerState.recentEvents || []).join(', ') || 'none';

    const prompt = `
You are a financial simulation engine for InvestQuest, a gamified finance learning app.
Generate a realistic life event for this player:

Month: ${playerState.month || 1}
Balance: $${playerState.balance || 2000}
Monthly income: $${playerState.monthlyIncome || 3500}
Monthly expenses: $${playerState.monthlyExpenses || 2650}
Current savings: $${playerState.savings || 1200}
Current debt: $${playerState.debt || 4500}
Recent events (do not repeat): ${recent}

Rules:
- Costs must feel realistic relative to their income — not always devastating, not always trivial
- Make choices meaningfully different from each other (not just "pay more" vs "pay less")
- At least one choice should teach a real financial concept (emergency fund, negotiating, insurance, etc.)
- savingsImpact: how much savings changes (negative = depletes, positive = grows)
- category: "emergency" ~25%, "opportunity" ~25%, "routine" ~35%, "social" ~15%
- emoji: one relevant emoji for the event

Return ONLY valid JSON, no markdown fences, no explanation:
{
  "title": "short punchy title (max 5 words)",
  "description": "2 sentences describing what happened",
  "category": "emergency|opportunity|routine|social",
  "urgency": "immediate|this_week|optional",
  "emoji": "🔧",
  "choices": [
    {
      "label": "action label (max 5 words)",
      "cost": 0,
      "action": "savings|debt|income|skip",
      "consequence": "1 sentence: what happens next",
      "savingsImpact": 0
    }
  ]
}
Exactly 3 choices. The "action" field controls game logic: "savings" = pay from savings, "debt" = add to debt, "income" = receive money, "skip" = do nothing.
`.trim();

    const result = await model.generateContent(prompt);
    const raw = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error generating sim event:', error);
    // Return a valid fallback so the game never breaks
    return {
      title: "Unexpected Bill",
      description: "A bill arrived that you weren't expecting. Time to make a call.",
      category: "routine",
      urgency: "this_week",
      emoji: "📄",
      choices: [
        { label: "Pay from savings", cost: 200, action: "savings", consequence: "Done. No stress, no interest.", savingsImpact: -200 },
        { label: "Add to debt", cost: 0, action: "debt", consequence: "Kicks the can — with interest.", savingsImpact: 0 },
        { label: "Call & negotiate", cost: 100, action: "savings", consequence: "They agreed to half. Nice work.", savingsImpact: -100 },
      ],
    };
  }
}

/**
 * Generates a personalized weekly performance recap for the social/profile screen.
 * Uses gemini-1.5-pro for higher quality — intended to be called once per week, not per action.
 * @param {object} weekData - { playerName, streakDays, worldsFocused, playerStats, friends }
 * @returns {Promise<{headline, subheadline, highlights, roast, tip, friendRanking, nextWeekChallenge, moodEmoji}>}
 */
export async function generateWeeklyRecap(weekData) {
  if (!genAI) {
    return { error: "Add VITE_GEMINI_API_KEY to .env to unlock weekly recaps." };
  }

  try {
    // Use Pro for the weekly recap — quality matters, and it's called infrequently
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const stats = weekData.playerStats || {};
    const friends = weekData.friends || [];
    const netChange = stats.netWorthChange || 0;
    const savingsChange = stats.savingsChange || 0;

    const friendsStr = friends.length
      ? friends.map((f) => `- ${f.name}: ${f.netWorthChange >= 0 ? '+' : ''}$${f.netWorthChange}`).join('\n')
      : '- No friends added yet';

    const prompt = `
You are writing a weekly performance recap for InvestQuest, a gamified finance learning app.
Be punchy, personality-filled, and slightly irreverent — like a finance-savvy friend, not a textbook.

Player: ${weekData.playerName || 'Player'}
Streak: ${weekData.streakDays || 0} days
Worlds played this week: ${weekData.worldsFocused || 'Budget Boardwalk'}
Net worth change: ${netChange >= 0 ? '+' : ''}$${netChange}
Savings change: ${savingsChange >= 0 ? '+' : ''}$${savingsChange}
Biggest mistake: ${stats.biggestMistake || 'none recorded'}
Biggest win: ${stats.biggestWin || 'none recorded'}
Events completed: ${stats.eventsCount || 0}

Friends this week:
${friendsStr}

Rules:
- headline: punchy newspaper-style title about their SPECIFIC week (never generic like "Great Week!")
- roast: must reference something specific from their stats — never generic
- tip: one actionable real-world financial tip tied to their biggest mistake
- nextWeekChallenge: feels like a game quest with a fun title
- friendRanking: rank all players including the current player by netWorthChange descending (rank 1 = best); include delta as formatted string like "+$420" or "-$80"
- moodEmoji: single emoji capturing the week's overall vibe

Return ONLY valid JSON, no markdown fences:
{
  "headline": "...",
  "subheadline": "...",
  "highlights": ["...", "...", "..."],
  "roast": "...",
  "tip": "...",
  "friendRanking": [
    { "name": "...", "rank": 1, "delta": "+$420" }
  ],
  "nextWeekChallenge": {
    "title": "...",
    "description": "...",
    "reward": "..."
  },
  "moodEmoji": "..."
}
`.trim();

    const result = await model.generateContent(prompt);
    const raw = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error generating weekly recap:', error);
    return { error: "Recap generation failed. Try again later." };
  }
}