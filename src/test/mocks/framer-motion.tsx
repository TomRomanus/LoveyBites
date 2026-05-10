import { createElement, forwardRef, type ReactNode } from 'react'

// Framer-motion props that must not be forwarded to DOM elements.
const MOTION_PROPS = new Set([
  'animate',
  'custom',
  'drag',
  'dragConstraints',
  'exit',
  'initial',
  'layout',
  'layoutId',
  'onAnimationComplete',
  'onDrag',
  'onDragEnd',
  'onDragStart',
  'transition',
  'variants',
  'whileDrag',
  'whileFocus',
  'whileHover',
  'whileInView',
  'whileTap',
])

const el = (tag: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = forwardRef<unknown, any>(({ children, ...rest }, ref) => {
    const filtered = Object.fromEntries(Object.entries(rest).filter(([k]) => !MOTION_PROPS.has(k)))
    return createElement(tag, { ...filtered, ref }, children)
  })
  Component.displayName = `motion.${tag}`
  return Component
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const motion = new Proxy({} as any, { get: (_: any, tag: string) => el(tag) })

const AnimatePresence = forwardRef<unknown, { children?: ReactNode }>(({ children }, _ref) => children ?? null)

const LayoutGroup = ({ children }: { children?: ReactNode }) => children ?? null

const animate = () => {}

export { motion, AnimatePresence, LayoutGroup, animate }
