import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { titleVariants } from '@/features/calendar/utils/calendarAnimations'
import { NL_MONTHS, NL_MONTHS_SHORT } from '@/shared/constants/locale'
import { toISO } from '@/features/calendar/utils/dateUtils'

type CalendarHeaderProps = {
  view: 'week' | 'month'
  anchor: Date
  navDir: number
  onShoppingOpen: () => void
}

const CalendarHeader = ({ view, anchor, navDir, onShoppingOpen }: CalendarHeaderProps) => {
  return (
    <div style={{ padding: '24px 20px 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div className="lb-eyebrow">HET MENU</div>
          <h1 className="lb-display" style={{ margin: '8px 0 0', fontSize: 34 }}>
            {view === 'week' ? (
              <>
                {'Week van '}
                <AnimatePresence mode="popLayout" custom={navDir}>
                  <motion.b
                    key={`wm-${anchor.getFullYear()}-${anchor.getMonth()}`}
                    custom={navDir}
                    variants={titleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                  >
                    {NL_MONTHS_SHORT[anchor.getMonth()]}
                  </motion.b>
                </AnimatePresence>{' '}
                <AnimatePresence mode="popLayout" custom={navDir}>
                  <motion.b
                    key={`wd-${toISO(anchor)}`}
                    custom={navDir}
                    variants={titleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                  >
                    {anchor.getDate()}
                  </motion.b>
                </AnimatePresence>
              </>
            ) : (
              <>
                <AnimatePresence mode="popLayout" custom={navDir}>
                  <motion.b
                    key={`month-${anchor.getFullYear()}-${anchor.getMonth()}`}
                    custom={navDir}
                    variants={titleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                  >
                    {NL_MONTHS[anchor.getMonth()]}
                  </motion.b>
                </AnimatePresence>{' '}
                <AnimatePresence mode="popLayout" custom={navDir}>
                  <motion.b
                    key={`year-${anchor.getFullYear()}`}
                    custom={navDir}
                    variants={titleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{ display: 'inline-block' }}
                  >
                    {anchor.getFullYear()}
                  </motion.b>
                </AnimatePresence>
              </>
            )}
          </h1>
        </div>
        <motion.button
          data-testid="shopping-list-btn"
          onClick={onShoppingOpen}
          whileTap={{ scale: 0.88 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            border: 0,
            background: 'var(--paper)',
            boxShadow: '0 1px 2px rgba(31,29,26,0.04), 0 0 0 0.5px var(--line)',
            color: 'var(--bordeaux)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ShoppingBag size={15} strokeWidth={1.8} />
        </motion.button>
      </div>
    </div>
  )
}

export default CalendarHeader
