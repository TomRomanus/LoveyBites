import { motion, AnimatePresence } from 'framer-motion'
import type { FlatStep } from '@/features/cooking/types/cooking'

const SECTION_HEADER_COLOR = '#b8394e'

type CookingStepsPanelProps = {
  steps: FlatStep[]
  currentIndex: number
  stepDir: 'next' | 'prev' | null
  currentIngredients: string[]
  onGoTo: (index: number) => void
}

const CookingStepsPanel = ({
  steps,
  currentIndex,
  stepDir,
  currentIngredients,
  onGoTo,
}: CookingStepsPanelProps) => {
  const current = steps[currentIndex]

  return (
    <motion.div
      key="step-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        flex: 1,
        overflow: 'hidden',
        minHeight: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <AnimatePresence mode="popLayout" custom={stepDir}>
        <motion.div
          key={currentIndex}
          custom={stepDir}
          variants={{
            enter: (dir: 'next' | 'prev' | null) => ({
              x: dir === 'next' ? 40 : dir === 'prev' ? -40 : 0,
              opacity: 0,
            }),
            center: { x: 0, opacity: 1 },
            exit: (dir: 'next' | 'prev' | null) => ({
              x: dir === 'next' ? -40 : dir === 'prev' ? 40 : 0,
              opacity: 0,
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 400, damping: 38, mass: 0.8 }}
        >
          {/* Prev step */}
          {steps[currentIndex - 1] && (
            <>
              <button
                onClick={() => onGoTo(currentIndex - 1)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0 22px',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  opacity: 0.3,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#f8f4ed',
                    marginBottom: 6,
                  }}
                >
                  ← Vorige
                </div>
                <div
                  style={
                    {
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontSize: 18,
                      lineHeight: 1.35,
                      color: '#f8f4ed',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    } as React.CSSProperties
                  }
                >
                  {steps[currentIndex - 1].text}
                </div>
              </button>
              <div
                style={{
                  height: '0.5px',
                  margin: '0 22px 24px',
                  background: 'rgba(248,244,237,0.1)',
                }}
              />
            </>
          )}

          {/* Current step */}
          <div style={{ padding: '0 22px' }}>
            {current.sectionTitle && (
              <>
                <div
                  style={{
                    fontFamily: 'var(--serif)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: SECTION_HEADER_COLOR,
                    fontWeight: 500,
                    marginBottom: 3,
                  }}
                >
                  {current.sectionTitle}
                </div>
                <div
                  style={{
                    width: 22,
                    height: 1.5,
                    background: SECTION_HEADER_COLOR,
                    borderRadius: 1,
                    opacity: 0.6,
                    marginBottom: 10,
                  }}
                />
              </>
            )}
            {currentIngredients.length > 0 && (
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 15,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: 'rgba(243,222,224,0.9)',
                  marginBottom: 10,
                }}
              >
                {currentIngredients.join(' · ')}
              </div>
            )}
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontWeight: 500,
                fontSize: 28,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                color: '#f8f4ed',
              }}
            >
              {current.text}
            </div>
          </div>

          {/* Next step */}
          {steps[currentIndex + 1] && (
            <>
              <div
                style={{
                  height: '0.5px',
                  margin: '24px 22px 24px',
                  background: 'rgba(248,244,237,0.1)',
                }}
              />
              <button
                onClick={() => onGoTo(currentIndex + 1)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0 22px',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  opacity: 0.3,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#f8f4ed',
                    marginBottom: 6,
                  }}
                >
                  Volgende →
                </div>
                <div
                  style={
                    {
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontSize: 18,
                      lineHeight: 1.35,
                      color: '#f8f4ed',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    } as React.CSSProperties
                  }
                >
                  {steps[currentIndex + 1].text}
                </div>
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient fades */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          background: 'linear-gradient(to bottom, #1f1d1a, transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 48,
          background: 'linear-gradient(to top, #1f1d1a, transparent)',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  )
}

export default CookingStepsPanel
