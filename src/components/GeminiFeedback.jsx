import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { generateGameFeedback } from '../services/gemini';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';

export default function GeminiFeedback({ gameType, gameState }) {
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchedRef = useRef(null);

  // Stable key derived from game inputs — only changes when game results actually change
  const stateKey = JSON.stringify({ gameType, gameState });

  useEffect(() => {
    // Skip if we already fetched for this exact game result
    if (lastFetchedRef.current === stateKey) return;
    lastFetchedRef.current = stateKey;

    let cancelled = false;
    setIsLoading(true);
    setFeedback('');
    console.log(`[Gemini] Fetching feedback for ${gameType}...`);

    generateGameFeedback(gameType, gameState).then(res => {
      if (!cancelled) setFeedback(res);
    }).catch(err => {
      if (!cancelled) setFeedback("Couldn't reach the AI. Try again!");
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    // Cleanup: ignore stale responses if component unmounts
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey]);

  const handleRetry = () => {
    lastFetchedRef.current = null;
    setIsLoading(true);
    setFeedback('');
    generateGameFeedback(gameType, gameState).then(res => {
      setFeedback(res);
    }).catch(() => {
      setFeedback("Still busy! Wait 60 seconds and try again. ⏳");
    }).finally(() => setIsLoading(false));
  };

  const isRateLimited = feedback.includes('breather') || feedback.includes('nap') || feedback.includes('60 second') || feedback.includes('busy');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      style={{
        width: '100%',
        maxWidth: 400,
        marginTop: 24,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 4px 24px -4px rgba(139, 92, 246, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative gradient glow behind the text */}
      <div style={{
        position: 'absolute',
        top: -50,
        left: -50,
        right: -50,
        height: 100,
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%)',
        filter: 'blur(20px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ 
            background: 'var(--gradient-primary)', 
            borderRadius: '50%', 
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={14} color="white" />
          </div>
          <span style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 700, 
            fontSize: '0.875rem',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI Coach
          </span>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: '0.875rem' }}>Analyzing your strategic brilliance...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ 
                fontSize: '0.9375rem', 
                lineHeight: 1.6, 
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {feedback}
            </motion.p>
            
            {isRateLimited && (
              <button 
                onClick={handleRetry}
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#a78bfa',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
              >
                <RefreshCw size={12} /> Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
