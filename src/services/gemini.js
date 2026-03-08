import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
// We use import.meta.env for Vite environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Check if the API key is available, but don't crash the app if it's not
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('GEMINI ERROR:', error.message, error.status, error);  // change this line
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

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