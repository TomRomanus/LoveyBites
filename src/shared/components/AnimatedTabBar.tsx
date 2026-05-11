import { motion, LayoutGroup } from 'framer-motion'

type Tab<T extends string> = {
  key: T
  label: string
}

type AnimatedTabBarProps<T extends string> = {
  layoutId: string
  tabs: Tab<T>[]
  active: T
  onChange: (key: T) => void
  variant?: 'underline' | 'pill'
  weight?: 'strong' | 'soft'
  theme?: 'light' | 'dark'
}

function AnimatedTabBar<T extends string>({
  layoutId,
  tabs,
  active,
  onChange,
  variant = 'pill',
  weight = 'strong',
  theme = 'light',
}: AnimatedTabBarProps<T>) {
  if (variant === 'underline') {
    const activeWeight = weight === 'soft' ? 500 : 700
    const inactiveWeight = weight === 'soft' ? 400 : 600
    return (
      <LayoutGroup id={layoutId}>
        <div className="flex border-b-[0.5px] border-ink/10 gap-5">
          {tabs.map(({ key, label }) => (
            <motion.button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              animate={{ color: active === key ? 'var(--bordeaux)' : 'var(--stone)' }}
              transition={{ duration: 0.2 }}
              className="relative bg-transparent border-0 px-[2px] pb-[7px] -mb-[0.5px] font-mono text-[11.5px] tracking-[0.1em] uppercase cursor-pointer"
              style={{ fontWeight: active === key ? activeWeight : inactiveWeight }}
            >
              {label}
              {active === key && (
                <motion.div
                  layoutId={`${layoutId}-indicator`}
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-bordeaux rounded-[2px_2px_0_0]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </LayoutGroup>
    )
  }

  const isDark = theme === 'dark'
  const activeColor = isDark ? '#f8f4ed' : 'var(--ink)'
  const inactiveColor = isDark ? 'rgba(248,244,237,0.5)' : 'var(--stone)'
  const trackCls = isDark
    ? 'flex gap-1 justify-center'
    : 'flex bg-[var(--paper-2)] p-[3px] rounded-[20px]'
  const btnCls = isDark
    ? 'relative bg-transparent border-0 py-2 px-[14px] rounded-[16px] text-[13px] font-medium font-sans cursor-pointer'
    : 'relative flex-1 h-8 rounded-[16px] border-0 bg-transparent text-[13px] font-medium font-sans cursor-pointer'
  const pillCls = isDark
    ? 'absolute inset-0 rounded-[16px] z-0 bg-paper/[0.12]'
    : 'absolute inset-0 rounded-[16px] bg-[var(--cream-card)] z-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'

  return (
    <LayoutGroup id={layoutId}>
      <div className={trackCls}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={btnCls}
            style={{ color: active === key ? activeColor : inactiveColor }}
          >
            {active === key && (
              <motion.div
                layoutId={`${layoutId}-pill`}
                className={pillCls}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-[1]">{label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  )
}

export default AnimatedTabBar
