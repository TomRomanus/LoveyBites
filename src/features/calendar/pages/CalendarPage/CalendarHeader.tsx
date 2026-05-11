import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { titleVariants } from '@/features/calendar/utils/calendarAnimations'
import { NL_MONTHS, NL_MONTHS_SHORT } from '@/shared/constants/locale'
import { toISO } from '@/features/calendar/utils/dateUtils'
import IconButton from '@/shared/components/IconButton'

const MotionIconButton = motion(IconButton)

type CalendarHeaderProps = {
  view: 'week' | 'month'
  anchor: Date
  navDir: number
  onShoppingOpen: () => void
}

const CalendarHeader = ({ view, anchor, navDir, onShoppingOpen }: CalendarHeaderProps) => {
  return (
    <div className="pt-6 px-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="lb-eyebrow">HET MENU</div>
          <h1 className="lb-display mt-2 text-[34px]">
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
                    className="text-bordeaux inline-block"
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
                    className="text-bordeaux inline-block"
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
                    className="text-bordeaux inline-block"
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
                    className="inline-block"
                  >
                    {anchor.getFullYear()}
                  </motion.b>
                </AnimatePresence>
              </>
            )}
          </h1>
        </div>
        <MotionIconButton
          data-testid="shopping-list-btn"
          onClick={onShoppingOpen}
          whileTap={{ scale: 0.88 }}
          className="border-0 bg-paper shadow-[0_1px_2px_rgba(31,29,26,0.04),0_0_0_0.5px_var(--line)] text-bordeaux shrink-0"
        >
          <ShoppingBag size={15} strokeWidth={1.8} />
        </MotionIconButton>
      </div>
    </div>
  )
}

export default CalendarHeader
