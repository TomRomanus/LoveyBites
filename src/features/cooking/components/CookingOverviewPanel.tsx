import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircleHeart } from 'lucide-react'
import type { FlatStep } from '@/features/cooking/types/cooking'
import { formatStepIngredient } from '@/features/recipe/utils/ingredientUtils'
import GroupLabel from '@/shared/components/GroupLabel'

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
      .map((id) => {
        const text = ingredientMap.get(id)
        if (!text) return undefined
        return formatStepIngredient(text, s.ingredientAmounts?.[id] ?? '')
      })
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
              <div className={`mb-2${i > 0 ? ' mt-4' : ''}`}>
                <GroupLabel theme="dark">{s.sectionTitle}</GroupLabel>
              </div>
            )}
            <button
              onClick={() => onGoTo(i)}
              className="flex items-start gap-[20px] py-2 w-full bg-transparent border-b-[0.5px] border-paper/[0.08] text-left cursor-pointer"
            >
              <div
                className="font-serif italic text-[22px] font-medium w-[22px] shrink-0 leading-[1.1] pt-[1px] text-right"
                style={{ color: isActive ? 'var(--bordeaux-mid)' : 'rgba(248,244,237,0.5)' }}
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
                {s.comment && (
                  <div className="mt-2 flex gap-[7px] items-start">
                    <MessageCircleHeart size={16} className="shrink-0 mt-[8px] text-honey-700/75" strokeWidth={1.5} />
                    <div className="flex-1 rounded-md px-[10px] py-[6px] bg-honey-700/15 text-[13px] leading-[1.5] text-paper/75">
                      {s.comment}
                    </div>
                  </div>
                )}
              </div>
            </button>
          </div>
        )
      })}
    </motion.div>
  )
}

export default CookingOverviewPanel
