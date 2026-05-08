import { motion } from 'framer-motion'

type IngredientCheckboxProps = {
  checked: boolean
  theme?: 'light' | 'dark'
}

const IngredientCheckbox = ({ checked, theme = 'light' }: IngredientCheckboxProps) => (
  <motion.span
    initial={false}
    animate={{
      background: checked ? 'var(--bordeaux)' : 'transparent',
      borderColor: checked
        ? theme === 'dark'
          ? 'transparent'
          : 'var(--bordeaux)'
        : theme === 'dark'
          ? 'rgba(248,244,237,0.4)'
          : 'var(--stone-2)',
      scale: checked ? [1, 0.82, 1] : 1,
    }}
    transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
    style={{
      width: 22,
      height: 22,
      borderRadius: 6,
      border: '1.5px solid',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
      <motion.path
        d="M5 12l5 5L20 7"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  </motion.span>
)

export default IngredientCheckbox
