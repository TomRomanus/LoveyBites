import { motion } from 'framer-motion'
import { EASE_STANDARD } from '@/shared/constants/animations'

const NL_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const NL_MONTHS = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
]

const todayFull = () => {
  const d = new Date()
  return `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const AuthMasthead = () => (
  <>
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_STANDARD }}
      className="pt-[70px] px-7 shrink-0"
    >
      <div className="lb-eyebrow mb-[14px]">SINDS 2026</div>
      <h1 className="m-0 text-[58px] leading-none tracking-[-0.025em]">
        <span className="font-serif italic font-semibold text-bordeaux">Lovey</span>
        <span className="font-serif italic font-semibold text-ink">Bites</span>
      </h1>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_STANDARD, delay: 0.12 }}
      className="px-7 mt-5"
    >
      <div className="flex items-center gap-[14px]">
        <div className="flex-1 h-[0.5px] bg-[var(--line)]" />
        <div className="text-center">
          <div className="lb-eyebrow mb-[3px]">{todayFull()}</div>
          <div className="font-serif italic font-medium text-[28px] text-ink tracking-[-0.02em] leading-[1.05]">
            Smakelijk
          </div>
        </div>
        <div className="flex-1 h-[0.5px] bg-[var(--line)]" />
      </div>
    </motion.div>
  </>
)

export default AuthMasthead
