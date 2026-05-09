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
}

function AnimatedTabBar<T extends string>({
  layoutId,
  tabs,
  active,
  onChange,
  variant = 'pill',
}: AnimatedTabBarProps<T>) {
  if (variant === 'underline') {
    return (
      <LayoutGroup id={layoutId}>
        <div className="flex border-b border-[0.5px] border-ink/10 gap-5">
          {tabs.map(({ key, label }) => (
            <motion.button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              animate={{ color: active === key ? 'var(--bordeaux)' : 'var(--stone)' }}
              transition={{ duration: 0.2 }}
              className="relative bg-transparent border-0 px-[2px] pb-[7px] -mb-[0.5px] font-mono text-[11.5px] tracking-[0.1em] uppercase cursor-pointer"
              style={{ fontWeight: active === key ? 700 : 600 }}
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

  return (
    <LayoutGroup id={layoutId}>
      <div className="flex bg-[var(--paper-2)] p-[3px] rounded-[20px]">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="relative flex-1 h-8 rounded-[16px] border-0 bg-transparent text-[13px] font-medium font-sans cursor-pointer"
            style={{ color: active === key ? 'var(--ink)' : 'var(--stone)' }}
          >
            {active === key && (
              <motion.div
                layoutId={`${layoutId}-pill`}
                className="absolute inset-0 rounded-[16px] bg-[var(--cream-card)] z-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
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
