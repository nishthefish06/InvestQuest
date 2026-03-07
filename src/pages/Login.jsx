import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { LogIn, UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, signup } = useGameState();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await signup(username.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', padding: 24, justifyContent: 'center' }}>
      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>💰</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>InvestQuest</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>Master money through games</p>
      </motion.div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-card)', borderRadius: 9999, marginBottom: 24 }}>
        {[
          { id: 'login', label: 'Log In', icon: <LogIn size={16} /> },
          { id: 'signup', label: 'Sign Up', icon: <UserPlus size={16} /> },
        ].map((t) => (
          <button key={t.id} onClick={() => { setMode(t.id); setError(''); }}
            style={{
              flex: 1, padding: '12px 8px', borderRadius: 9999, fontSize: '0.875rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: mode === t.id ? 'var(--gradient-purple)' : 'transparent',
              color: mode === t.id ? 'white' : 'var(--text-secondary)',
              boxShadow: mode === t.id ? 'var(--shadow-glow-purple)' : 'none',
              transition: 'all 0.25s',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Username</label>
            <input className="input-field" placeholder="e.g. WallStreetWiz"
              value={username} onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{ fontSize: '1rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input-field" type={showPass ? 'text' : 'password'} placeholder="••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                style={{ fontSize: '1rem', paddingRight: 44 }} />
              <button onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                {showPass ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', marginTop: 14 }}>
            <AlertCircle size={16} color="var(--accent-red)" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--accent-red)' }}>{error}</span>
          </motion.div>
        )}

        {/* Submit */}
        <motion.button className="btn btn-primary btn-block btn-lg" onClick={handleSubmit}
          whileTap={{ scale: 0.96 }}
          disabled={loading}
          style={{ marginTop: 20, opacity: loading ? 0.7 : 1 }}>
          {loading ? '...' : mode === 'login' ? '🔓 Log In' : '🚀 Create Account'}
        </motion.button>

        {mode === 'signup' && (
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.4 }}>
            You'll start with <strong style={{ color: 'var(--accent-green)' }}>$5,000</strong> virtual cash and access to all three worlds
          </p>
        )}
      </motion.div>
    </div>
  );
}
