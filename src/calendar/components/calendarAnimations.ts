export const titleVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir === 2 ? 60 : dir === -2 ? -60 : 0,
    y: dir === 1 ? 16 : dir === -1 ? -16 : 0,
    transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.22, ease: [0.2, 0, 0, 1] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir === 2 ? -60 : dir === -2 ? 60 : 0,
    y: dir === 1 ? -16 : dir === -1 ? 16 : 0,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  }),
}

export const pageVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir > 0 ? 28 : -28,
    scale: dir === 0 ? 0.97 : 1,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.2, 0, 0, 1] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir > 0 ? -28 : 28,
    scale: dir === 0 ? 0.97 : 1,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  }),
}

export const weekContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
}

export const weekRowVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
}
