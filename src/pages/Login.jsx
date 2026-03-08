import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';

export default function Login() {
  const { login, signup } = useGameState();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) { setError('Please fill in both fields'); return; }
    setLoading(true); setError('');
    try {
      if (mode === 'login') await login(username.trim(), password);
      else await signup(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const bgLight = '#4d7f5c'; // Darker sage green base
  const bgDark = '#416a4d';  // Even darker sage for gradient
  const headerTeal = '#dceddd'; // Lighter text color to contrast dark background
  const inputBg = 'rgba(255, 255, 255, 0.2)';
  const amber = '#f39c12';
  const amberDark = '#d68910';

  return (
    <div style={{
      minHeight: '100dvh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'fixed', top: 0, left: 0, overflowY: 'auto'
    }}>
      <div style={{
        width: '100%', maxWidth: 480, height: '100dvh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', padding: 28, boxSizing: 'border-box'
      }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Big Coin Illustration */}
          <div style={{ marginBottom: 32 }}>
            <img src="/coin.png" alt="" style={{ width: 160, height: 160, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))' }} />
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, color: headerTeal, marginBottom: 4, letterSpacing: '-0.02em' }}>
              Welcome to InvestQuest!
            </h1>
          </div>

          {/* Input area */}
          <div style={{ width: '100%', maxWidth: 320 }}>
            {/* Mode Toggle (Subtle) */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, justifyContent: 'center' }}>
              <button onClick={() => { setMode('login'); setError(''); }}
                style={{
                  fontSize: '1rem', fontWeight: 800, background: 'none', border: 'none',
                  color: mode === 'login' ? headerTeal : 'rgba(255,255,255,0.4)',
                  borderBottom: mode === 'login' ? `3px solid ${headerTeal}` : '3px solid transparent',
                  padding: '6px 12px', cursor: 'pointer', transition: 'all 0.2s'
                }}>Login</button>
              <button onClick={() => { setMode('signup'); setError(''); }}
                style={{
                  fontSize: '1rem', fontWeight: 800, background: 'none', border: 'none',
                  color: mode === 'signup' ? headerTeal : 'rgba(255,255,255,0.4)',
                  borderBottom: mode === 'signup' ? `3px solid ${headerTeal}` : '3px solid transparent',
                  padding: '6px 12px', cursor: 'pointer', transition: 'all 0.2s'
                }}>Sign Up</button>
            </div>

            {/* Username */}
            <input placeholder="Enter your username" value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', padding: '18px 22px', borderRadius: 16, border: 'none', outline: 'none',
                background: inputBg, color: headerTeal, fontSize: '1.25rem', fontWeight: 600, marginBottom: 14, boxSizing: 'border-box',
                '::placeholder': { color: 'rgba(255,255,255,0.5)' },
              }} />

            {/* Password */}
            <input placeholder="Enter your password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', padding: '18px 22px', borderRadius: 16, border: 'none', outline: 'none',
                background: inputBg, color: headerTeal, fontSize: '1.25rem', fontWeight: 600, marginBottom: 24, boxSizing: 'border-box',
                '::placeholder': { color: 'rgba(255,255,255,0.5)' },
              }} />

            {error && (
              <p style={{ color: '#b71c1c', fontSize: '0.875rem', marginBottom: 16, textAlign: 'center', fontWeight: 'bold' }}>{error}</p>
            )}

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
              style={{
                width: '100%', padding: '18px', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${amber}, ${amberDark})`,
                color: '#fff', fontWeight: 900, fontSize: '1.25rem',
                boxShadow: `0 8px 24px rgba(243,156,18,0.35)`,
                opacity: loading ? 0.7 : 1,
              }}>
              {loading ? '...' : mode === 'login' ? 'Let\'s Go!' : 'Create Account'}
            </motion.button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 32, fontSize: '0.9375rem', color: headerTeal, fontWeight: 600 }}>
            {mode === 'login'
              ? <>Don't have a login? <button onClick={() => setMode('signup')} style={{ color: '#1565c0', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Sign up</button></>
              : <>Already have an account? <button onClick={() => setMode('login')} style={{ color: '#1565c0', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Log in</button></>
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
}
