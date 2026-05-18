import { useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { FlatStep } from '@/features/cooking/types/cooking'
import { formatStepIngredient } from '@/features/recipe/utils/ingredientUtils'
import { detectTimers } from '@/features/cooking/utils/detectTimers'
import type { DetectedTimer } from '@/features/cooking/utils/detectTimers'
import { useCookTimers } from '@/features/cooking/context/TimerContext'
import TimerStartButton from '@/features/cooking/components/TimerStartButton'
import GroupLabel from '@/shared/components/GroupLabel'
import StepComment from '@/shared/components/StepComment'

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
  detectedTimers: DetectedTimer[]
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
    return { ...s, num, showSection, stepIngredients, detectedTimers: detectTimers(s.text) }
  })
}

const CookingOverviewPanel = ({
  steps,
  currentIndex,
  ingredientMap,
  onGoTo,
}: CookingOverviewPanelProps) => {
  const overviewRef = useRef<HTMLDivElement>(null)
  const { startTimer, timers } = useCookTimers()

  useEffect(() => {
    if (overviewRef.current) {
      const active = overviewRef.current.querySelector('[data-active="true"]')
      active?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [])

  const enriched = useMemo(() => enrichSteps(steps, ingredientMap), [steps, ingredientMap])

  const activeTimerLabels = useMemo(
    () => new Set(timers.filter(t => t.status !== 'finished').map(t => t.label)),
    [timers],
  )

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
            <div className="border-b-[0.5px] border-paper/[0.08]">
              <button
                onClick={() => onGoTo(i)}
                className="flex items-start gap-[20px] py-2 w-full bg-transparent border-0 text-left cursor-pointer"
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
                  {s.comment && <StepComment comment={s.comment} theme="dark" className="mt-2" />}
                </div>
              </button>
              {s.detectedTimers.length > 0 && (
                <div className="pl-[42px] pb-3 flex flex-col gap-2 items-start">
                  {s.detectedTimers.map((dt, j) => {
                    const label = `Stap ${s.num} · ${dt.displayTime}`
                    return (
                      <TimerStartButton
                        key={j}
                        active={activeTimerLabels.has(label)}
                        displayTime={dt.displayTime}
                        onStart={() => startTimer(label, dt.durationSecs)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

export default CookingOverviewPanel
