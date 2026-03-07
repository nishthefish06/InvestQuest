import { NavLink } from 'react-router-dom';
import { Home, Map, Users, User } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      background: 'rgba(10, 10, 26, 0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '8px 16px calc(8px + env(safe-area-inset-bottom))',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100,
    }}>
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 16px', borderRadius: 12, textDecoration: 'none', position: 'relative', minWidth: 60 }}>
          {({ isActive }) => (
            <>
              {isActive && <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 20, height: 3, background: 'var(--accent-purple)', borderRadius: '0 0 4px 4px', boxShadow: '0 0 10px rgba(168,85,247,0.5)' }} />}
              <tab.icon size={22} style={{ color: isActive ? 'var(--accent-purple)' : 'var(--text-muted)', filter: isActive ? 'drop-shadow(0 0 8px rgba(168,85,247,0.5))' : 'none', transition: 'all 0.25s' }} />
              <span style={{ fontSize: '0.625rem', fontWeight: 500, color: isActive ? 'var(--accent-purple)' : 'var(--text-muted)' }}>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
