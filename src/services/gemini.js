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
    } else if (gameType === 'crypto') {
      const { pnlPct, pnlAmount, cashedOut, moves } = gameState;
      
      const outcomeContext = cashedOut 
        ? `They cashed out with a ${pnlPct}% return (${pnlAmount >= 0 ? '+' : ''}$${pnlAmount.toLocaleString()}) after ${moves} moves.` 
        : `They hit a "rug pull" (a scam coin) and lost their whole portfolio after ${moves} moves.`;

      prompt = `
You are a hype-centric, positive, but educational 'Crypto Guru' character in an educational app called InvestQuest.
The user just finished playing a minesweeper-style risk-management game ('Crypto Caverns').

Here is what happened:
${outcomeContext}

Instructions:
1. Give them a short, punchy piece of feedback (2-3 sentences max).
2. Keep the tone extremely fun, hyped-up, and somewhat 'internet culture' aware, but strictly positive and educational. 
3. If they cashed out in profit, hype them up as a smart investor who knows when to take gains!
4. If they hit a rug pull, be a comforting friend. Tell them "It happens to the best of us in Web3!" and give a quick tip about risk management or doing their own research (DYOR). 
5. Include emojis!
      `;
    } else {
      throw new Error('Unknown game type');
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error generating AI feedback:', error);
    return "Looks like my AI brain is taking a quick nap! 😴 Try again later!";
  }
}
