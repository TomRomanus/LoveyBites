import { Link, useLocation } from 'react-router-dom'
import { motion, LayoutGroup } from 'framer-motion'
import { BookOpen, Calendar } from 'lucide-react'

const BottomNav = () => {
  const location = useLocation()
  const isCalendar = location.pathname === '/calendar'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        zIndex: 80,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <LayoutGroup>
        <div
          style={{
            display: 'flex',
            gap: 0,
            padding: 6,
            background: 'rgba(248, 244, 237, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 26,
            border: '0.5px solid var(--line)',
            boxShadow: '0 4px 20px rgba(31, 29, 26, 0.08)',
            pointerEvents: 'auto',
          }}
        >
          <Link
            to="/"
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
              padding: '0 18px',
              borderRadius: 20,
              color: isCalendar ? 'var(--ink-2)' : 'var(--cream-card)',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'var(--sans)',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              transition: 'color 0.18s cubic-bezier(0.2, 0, 0.2, 1)',
            }}
          >
            {!isCalendar && (
              <motion.div
                layoutId="nav-pill"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 20,
                  background: 'var(--bordeaux)',
                  zIndex: 0,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <BookOpen size={16} strokeWidth={1.6} />
              Boek
            </span>
          </Link>

          <Link
            to="/calendar"
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
              padding: '0 18px',
              borderRadius: 20,
              color: isCalendar ? 'var(--cream-card)' : 'var(--ink-2)',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'var(--sans)',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              transition: 'color 0.18s cubic-bezier(0.2, 0, 0.2, 1)',
            }}
          >
            {isCalendar && (
              <motion.div
                layoutId="nav-pill"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 20,
                  background: 'var(--bordeaux)',
                  zIndex: 0,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Calendar size={16} strokeWidth={1.6} />
              Menu
            </span>
          </Link>
        </div>
      </LayoutGroup>
    </div>
  )
}

export default BottomNav
