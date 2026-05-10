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
      className="py-5 px-6"
    >
      <div className="lb-eyebrow mb-[14px] text-paper/50">
        TIK EEN STAP AAN OM ERNAAR TE SPRINGEN
      </div>
      {enriched.map((s, i) => {
        const isActive = i === currentIndex
        return (
          <div key={i} data-active={isActive}>
            {s.showSection && s.sectionTitle && (
              <div className={i > 0 ? 'mt-4' : ''}>
                <div className="font-serif italic text-[14px] font-medium mb-[3px] text-[#b8394e]">
                  {s.sectionTitle}
                </div>
                <div className="w-[22px] h-[1.5px] rounded-[1px] opacity-60 mb-2 bg-[#b8394e]" />
              </div>
            )}
            <button
              onClick={() => onGoTo(i)}
              className="flex items-start gap-[20px] py-2 w-full bg-transparent border-b-[0.5px] border-paper/[0.08] text-left cursor-pointer"
            >
              <div
                className="font-serif italic text-[22px] font-medium w-[22px] shrink-0 leading-[1.1] pt-[1px] text-right"
                style={{ color: isActive ? SECTION_HEADER_COLOR : 'rgba(248,244,237,0.5)' }}
              >
                {s.num}
              </div>
              <div className="flex-1" style={{ opacity: isActive ? 1 : 0.85 }}>
                {s.stepIngredients.length > 0 && (
                  <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-bordeaux-soft/90 mb-[5px]">
                    {s.stepIngredients.join(' · ')}
                  </div>
                )}
                <div className="text-[15px] text-paper leading-[1.55]">{s.text}</div>
              </div>
            </button>
          </div>
        )
      })}
    </motion.div>
  )
}

export default CookingOverviewPanel
