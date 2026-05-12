import type { Variants } from 'framer-motion'

export const EASE_OUT: [number, number, number, number] = [0.2, 0, 0, 1]
export const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1]
export const EASE_STANDARD: [number, number, number, number] = [0.2, 0, 0.2, 1]
export const EASE_SUBTLE: [number, number, number, number] = [0.25, 0, 0, 1]
export const EASE_OVERSHOOT: [number, number, number, number] = [0.34, 1.56, 0.64, 1]
export const EASE_IN_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1]

export const sheetVariants: Variants = {
  hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: EASE_IN } },
  visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
}

export const backdropVariants: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.2 } },
  visible: { opacity: 1, transition: { duration: 0.24 } },
}

export const emptyStateVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const SPRING_UI = { type: 'spring', stiffness: 420, damping: 32 } as const
