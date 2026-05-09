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
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--line)', gap: 20 }}>
          {tabs.map(({ key, label }) => (
            <motion.button
              key={key}
              onClick={() => onChange(key)}
              animate={{ color: active === key ? 'var(--bordeaux)' : 'var(--stone)' }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'relative',
                background: 'none',
                border: 0,
                padding: '0 2px 7px',
                marginBottom: -0.5,
                fontFamily: 'var(--mono)',
                fontSize: 11.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: active === key ? 700 : 600,
                cursor: 'pointer',
              }}
            >
              {label}
              {active === key && (
                <motion.div
                  layoutId={`${layoutId}-indicator`}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    background: 'var(--bordeaux)',
                    borderRadius: '2px 2px 0 0',
                  }}
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
      <div
        style={{
          display: 'flex',
          background: 'var(--paper-2)',
          padding: 3,
          borderRadius: 20,
        }}
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              position: 'relative',
              flex: 1,
              height: 32,
              borderRadius: 16,
              border: 0,
              background: 'transparent',
              fontSize: 13,
              fontWeight: 500,
              color: active === key ? 'var(--ink)' : 'var(--stone)',
              fontFamily: 'var(--sans)',
              cursor: 'pointer',
            }}
          >
            {active === key && (
              <motion.div
                layoutId={`${layoutId}-pill`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 16,
                  background: 'var(--cream-card)',
                  zIndex: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  )
}

export default AnimatedTabBar
