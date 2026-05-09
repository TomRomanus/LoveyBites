import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { FlatStep } from '@/features/cooking/types/cooking'

const SECTION_HEADER_COLOR = '#b8394e'

type CookingOverviewPanelProps = {
  steps: FlatStep[]
  currentIndex: number
  ingredientMap: Map<string, string>
  onGoTo: (index: number) => void
}

type EnrichedStep = FlatStep & {
  num: number
  showSection: boolean
  stepIngredients: string[]
}

const enrichSteps = (steps: FlatStep[], ingredientMap: Map<string, string>): EnrichedStep[] => {
  let prevSection = ''
  let num = 0
  return steps.map((s) => {
    num++
    const showSection = s.sectionTitle !== prevSection
    if (showSection) prevSection = s.sectionTitle ?? ''
    const stepIngredients = (s.ingredientRefs ?? [])
      .map((id) => ingredientMap.get(id))
      .filter((t): t is string => t !== undefined)
    return { ...s, num, showSection, stepIngredients }
  })
}

const CookingOverviewPanel = ({
  steps,
  currentIndex,
  ingredientMap,
  onGoTo,
}: CookingOverviewPanelProps) => {
  const overviewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (overviewRef.current) {
      const active = overviewRef.current.querySelector('[data-active="true"]')
      active?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [])

  const enriched = enrichSteps(steps, ingredientMap)

  return (
    <motion.div
      ref={overviewRef}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      style={{ padding: '20px 24px' }}
    >
      <div className="lb-eyebrow" style={{ color: 'rgba(248,244,237,0.5)', marginBottom: 14 }}>
        TIK EEN STAP AAN OM ERNAAR TE SPRINGEN
      </div>
      {enriched.map((s, i) => {
        const isActive = i === currentIndex
        return (
          <div key={i} data-active={isActive}>
            {s.showSection && s.sectionTitle && (
              <div style={{ marginTop: i > 0 ? 16 : 0 }}>
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
                  {s.sectionTitle}
                </div>
                <div
                  style={{
                    width: 22,
                    height: 1.5,
                    background: SECTION_HEADER_COLOR,
                    borderRadius: 1,
                    opacity: 0.6,
                    marginBottom: 8,
                  }}
                />
              </div>
            )}
            <button
              onClick={() => onGoTo(i)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '8px 0',
                width: '100%',
                background: 'transparent',
                border: 0,
                borderBottom: '0.5px solid rgba(248,244,237,0.08)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 22,
                  color: isActive ? SECTION_HEADER_COLOR : 'rgba(248,244,237,0.5)',
                  fontWeight: 500,
                  width: 22,
                  flexShrink: 0,
                  lineHeight: 1.1,
                  paddingTop: 1,
                }}
              >
                {s.num}
              </div>
              <div style={{ flex: 1, opacity: isActive ? 1 : 0.85 }}>
                {s.stepIngredients.length > 0 && (
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(243,222,224,0.5)',
                      marginBottom: 5,
                    }}
                  >
                    {s.stepIngredients.join(' · ')}
                  </div>
                )}
                <div style={{ fontSize: 15, color: '#f8f4ed', lineHeight: 1.55 }}>{s.text}</div>
              </div>
            </button>
          </div>
        )
      })}
    </motion.div>
  )
}

export default CookingOverviewPanel
