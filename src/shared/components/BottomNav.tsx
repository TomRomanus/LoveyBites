import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Calendar } from 'lucide-react'

const BottomNav = () => {
  const location = useLocation()
  const isCalendar = location.pathname === '/calendar'

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[80] flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
    >
      <div
        className="relative flex gap-0 p-[6px] rounded-[26px] border-[0.5px] border-ink/10 shadow-[0_4px_20px_rgba(31,29,26,0.08)] pointer-events-auto"
        style={{
          background: 'rgba(248, 244, 237, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <motion.div
          className="absolute top-[6px] bottom-[6px] rounded-[20px] bg-bordeaux z-0 pointer-events-none"
          animate={{ left: isCalendar ? '50%' : '6px' }}
          style={{ width: 'calc(50% - 6px)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />

        <Link
          to="/"
          className="relative flex-1 flex items-center justify-center h-10 px-[18px] rounded-[20px] text-[14px] font-medium font-sans no-underline tracking-[-0.01em]"
          style={{
            color: isCalendar ? 'var(--ink-2)' : 'var(--cream-card)',
            transition: 'color 0.18s cubic-bezier(0.2, 0, 0.2, 1)',
          }}
        >
          <span className="relative z-[1] flex items-center gap-[6px]">
            <BookOpen size={16} strokeWidth={1.6} />
            Boek
          </span>
        </Link>

        <Link
          to="/calendar"
          className="relative flex-1 flex items-center justify-center h-10 px-[18px] rounded-[20px] text-[14px] font-medium font-sans no-underline tracking-[-0.01em]"
          style={{
            color: isCalendar ? 'var(--cream-card)' : 'var(--ink-2)',
            transition: 'color 0.18s cubic-bezier(0.2, 0, 0.2, 1)',
          }}
        >
          <span className="relative z-[1] flex items-center gap-[6px]">
            <Calendar size={16} strokeWidth={1.6} />
            Menu
          </span>
        </Link>
      </div>
    </div>
  )
}

export default BottomNav
