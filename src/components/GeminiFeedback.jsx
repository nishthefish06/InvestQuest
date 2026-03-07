import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateGameFeedback } from '../services/gemini';
import { Sparkles, Loader2 } from 'lucide-react';

export default function GeminiFeedback({ gameType, gameState }) {
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedback() {
      setIsLoading(true);
      const res = await generateGameFeedback(gameType, gameState);
      setFeedback(res);
      setIsLoading(false);
    }
    
    fetchFeedback();
  }, [gameType, gameState]);

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
        )}
      </div>
    </motion.div>
  );
}
