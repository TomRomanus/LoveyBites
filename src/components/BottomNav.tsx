import { Link, useLocation } from 'react-router-dom'
import { motion, LayoutGroup } from 'framer-motion'

export default function BottomNav() {
  const location = useLocation()
  const isCalendar = location.pathname === '/calendar'

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
      zIndex: 80, display: 'flex', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <LayoutGroup>
        <div style={{
          display: 'flex', gap: 0, padding: 6,
          background: 'rgba(248, 244, 237, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: 30, border: '0.5px solid var(--line)',
          boxShadow: '0 4px 20px rgba(31, 29, 26, 0.08)',
          pointerEvents: 'auto',
        }}>
          <Link to="/" style={{
            position: 'relative', flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '10px 18px', borderRadius: 22,
            color: isCalendar ? 'var(--ink-2)' : 'var(--cream-card)',
            fontSize: 14, fontWeight: 500,
            fontFamily: 'var(--sans)', textDecoration: 'none', letterSpacing: '-0.01em',
            transition: 'color 0.18s cubic-bezier(0.2, 0, 0.2, 1)',
          }}>
            {!isCalendar && (
              <motion.div
                layoutId="nav-pill"
                style={{ position: 'absolute', inset: 0, borderRadius: 22, background: 'var(--bordeaux)', zIndex: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
                <path d="M4 5a2 2 0 012-2h13v18H6a2 2 0 01-2-2V5z" />
                <path d="M4 17a2 2 0 012-2h13" />
              </svg>
              Boek
            </span>
          </Link>

          <Link to="/calendar" style={{
            position: 'relative', flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '10px 18px', borderRadius: 22,
            color: isCalendar ? 'var(--cream-card)' : 'var(--ink-2)',
            fontSize: 14, fontWeight: 500,
            fontFamily: 'var(--sans)', textDecoration: 'none', letterSpacing: '-0.01em',
            transition: 'color 0.18s cubic-bezier(0.2, 0, 0.2, 1)',
          }}>
            {isCalendar && (
              <motion.div
                layoutId="nav-pill"
                style={{ position: 'absolute', inset: 0, borderRadius: 22, background: 'var(--bordeaux)', zIndex: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                <rect x="3.5" y="5" width="17" height="15" rx="2" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
              </svg>
              Menu
            </span>
          </Link>
        </div>
      </LayoutGroup>
    </div>
  )
}
