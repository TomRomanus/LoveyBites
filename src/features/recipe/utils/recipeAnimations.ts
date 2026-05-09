import type { Variants } from 'framer-motion'

export const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir * 32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -32, opacity: 0 }),
}

export const slideTransition = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 36,
  mass: 0.8,
}
