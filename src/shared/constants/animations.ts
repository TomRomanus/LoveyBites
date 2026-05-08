import type { Variants } from 'framer-motion'

export const sheetVariants: Variants = {
  hidden: {
    y: '100%',
    transition: { type: 'tween' as const, duration: 0.22, ease: [0.4, 0, 1, 1] as const },
  },
  visible: { y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 32 } },
}

export const backdropVariants: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.2 } },
  visible: { opacity: 1, transition: { duration: 0.24 } },
}
