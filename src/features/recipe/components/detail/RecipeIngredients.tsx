import { motion, AnimatePresence } from 'framer-motion'
import PortionStepper from '@/features/recipe/components/PortionStepper'
import IngredientCheckbox from '@/shared/components/IngredientCheckbox'

type RecipeIngredientsProps = {
  sections: { section: string | null; items: string[] }[]
  portions: number
  portionDir: 'up' | 'down' | null
  portionsLabel?: string
  onPortionChange: (v: number) => void
  checked: Set<string>
  onToggle: (key: string) => void
}

const RecipeIngredients = ({
  sections,
  portions,
  portionDir,
  portionsLabel,
  onPortionChange,
  checked,
  onToggle,
}: RecipeIngredientsProps) => (
  <div style={{ padding: '28px 22px 0' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}
    >
      <div>
        <div className="lb-eyebrow">DEEL I</div>
        <h2
          style={{
            margin: '4px 0 0',
            fontSize: 24,
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          Ingrediënten
        </h2>
      </div>
      <PortionStepper
        value={portions}
        onChange={onPortionChange}
        label={portionsLabel || 'pers'}
        dir={portionDir}
      />
    </div>

    {sections.map((sec, si) => (
      <div key={si} style={{ marginBottom: 16 }}>
        {sec.section && (
          <>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--bordeaux)',
                marginBottom: 3,
                fontWeight: 500,
              }}
            >
              {sec.section}
            </div>
            <div
              style={{
                width: 22,
                height: 1.5,
                background: 'var(--bordeaux)',
                borderRadius: 1,
                opacity: 0.55,
                marginBottom: 8,
              }}
            />
          </>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sec.items.map((item, ii) => {
            const key = `${si}-${ii}`
            const isChecked = checked.has(key)
            return (
              <button
                key={ii}
                onClick={() => onToggle(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  background: 'transparent',
                  border: 0,
                  textAlign: 'left',
                  borderBottom: '0.5px solid var(--line-soft)',
                  cursor: 'pointer',
                }}
              >
                <IngredientCheckbox checked={isChecked} />
                <span
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: isChecked ? 'var(--stone)' : 'var(--ink)',
                    opacity: isChecked ? 0.5 : 1,
                    transitionProperty: 'color, opacity',
                    transition: 'color 0.2s ease, opacity 0.2s ease',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <AnimatePresence mode="popLayout" custom={portionDir}>
                    <motion.span
                      key={portions}
                      custom={portionDir}
                      variants={{
                        enter: (d: 'up' | 'down' | null) => ({
                          y: d === 'up' ? 8 : d === 'down' ? -8 : 0,
                          opacity: 0,
                        }),
                        center: { y: 0, opacity: 1 },
                        exit: (d: 'up' | 'down' | null) => ({
                          y: d === 'up' ? -8 : d === 'down' ? 8 : 0,
                          opacity: 0,
                        }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      style={{ display: 'block', position: 'relative', width: 'fit-content' }}
                    >
                      {item}
                      <motion.span
                        aria-hidden
                        initial={false}
                        animate={{ scaleX: isChecked ? 1 : 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: '50%',
                          height: 1.5,
                          background: 'currentColor',
                          transformOrigin: 'left',
                          pointerEvents: 'none',
                        }}
                      />
                    </motion.span>
                  </AnimatePresence>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    ))}
  </div>
)

export default RecipeIngredients
