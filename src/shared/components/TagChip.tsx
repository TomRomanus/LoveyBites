import { motion } from 'framer-motion'

type TagChipProps = {
  label: string
  active: boolean
  disabled?: boolean
  layout?: boolean
  onClick?: () => void
}

const TagChip = ({ label, active, disabled = false, layout = false, onClick }: TagChipProps) => (
  <motion.button
    type="button"
    className={`lb-tag ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    data-active={active ? 'true' : 'false'}
    onClick={disabled ? undefined : onClick}
    layout={layout}
    transition={layout ? { layout: { type: 'spring', stiffness: 400, damping: 32 } } : undefined}
  >
    {label}
  </motion.button>
)

export default TagChip
