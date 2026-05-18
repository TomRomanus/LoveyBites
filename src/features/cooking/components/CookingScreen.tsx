import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_STANDARD } from '@/shared/constants/animations'
import { collectIngredientMap, formatStepIngredient } from '@/features/recipe/utils/ingredientUtils'
import type { CookingScreenProps, CookTab } from '@/features/cooking/types/cooking'
import { flattenCookSteps } from '@/features/cooking/utils/cookSteps'
import { scaleStepAmounts } from '@/features/recipe/utils/scaleIngredient'
import useBodyScrollLock from '@/shared/hooks/useBodyScrollLock'
import CookingHeader from '@/features/cooking/components/CookingHeader'
import CookingTabs from '@/features/cooking/components/CookingTabs'
import CookingStepsPanel from '@/features/cooking/components/CookingStepsPanel'
import CookingStepBottomControls from '@/features/cooking/components/CookingStepBottomControls'
import CookingIngredientsPanel from '@/features/cooking/components/CookingIngredientsPanel'
import CookingOverviewPanel from '@/features/cooking/components/CookingOverviewPanel'
import CookingCommentSheet from '@/features/cooking/components/CookingCommentSheet'
import { useCookTimers } from '@/features/cooking/context/TimerContext'

const CookingScreen = ({
  recipe,
  scaledIngredients,
  selectedPortions,
  onPortionsChange,
  checked,
  onToggle,
  onClose,
  onUpdateStepComment,
}: CookingScreenProps) => {
  const ingredientMap = useMemo(() => collectIngredientMap(scaledIngredients), [scaledIngredients])
  const ratio = selectedPortions / (recipe.portions ?? 4)
  const steps = useMemo(
    () => flattenCookSteps(scaleStepAmounts(recipe.steps, ratio, ingredientMap)),
    [recipe.steps, ratio, ingredientMap],
  )
  const total = steps.length

  const [currentIndex, setCurrentIndex] = useState(0)
  const [stepDir, setStepDir] = useState<'next' | 'prev' | null>(null)
  const [tab, setTab] = useState<CookTab>('step')
  const [portionDir, setPortionDir] = useState<'up' | 'down' | null>(null)
  const [commentSheetOpen, setCommentSheetOpen] = useState(false)

  const handlePortionsChange = (p: number) => {
    setPortionDir(p > selectedPortions ? 'up' : 'down')
    onPortionsChange(p)
  }

  useBodyScrollLock(true)

  const { registerCookModeReturn, unregisterCookModeReturn, closeSheet } = useCookTimers()
  useEffect(() => {
    registerCookModeReturn(closeSheet)
    return () => unregisterCookModeReturn()
  }, [registerCookModeReturn, unregisterCookModeReturn, closeSheet])

  if (total === 0) return null

  const current = steps[currentIndex]

  const goTo = (index: number) => {
    const newIndex = Math.max(0, Math.min(total - 1, index))
    if (newIndex === currentIndex) {
      setTab('step')
      return
    }
    setStepDir(newIndex > currentIndex ? 'next' : 'prev')
    setCurrentIndex(newIndex)
    setTab('step')
  }

  const currentIngredients = (current.ingredientRefs ?? [])
    .map((id) => {
      const text = ingredientMap.get(id)
      if (!text) return undefined
      return formatStepIngredient(text, current.ingredientAmounts?.[id] ?? '')
    })
    .filter((t): t is string => t !== undefined)

  const handleCommentSave = (text: string) => {
    onUpdateStepComment(current.globalIndex, text || undefined)
    setCommentSheetOpen(false)
  }

  const handleCommentDelete = () => {
    onUpdateStepComment(current.globalIndex, undefined)
    setCommentSheetOpen(false)
  }

  return (
    <motion.div
      key="cook-mode"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: EASE_STANDARD }}
      className="fixed inset-0 z-[100] h-[100dvh] bg-ink text-paper flex flex-col select-none"
    >
      <CookingHeader onClose={onClose} />

      <CookingTabs tab={tab} onTabChange={setTab} />

      <AnimatePresence mode="wait">
        {tab === 'step' && (
          <CookingStepsPanel
            steps={steps}
            currentIndex={currentIndex}
            stepDir={stepDir}
            currentIngredients={currentIngredients}
            onGoTo={goTo}
          />
        )}

        {tab !== 'step' && (
          <motion.div
            key="list-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-auto pb-10"
          >
            {tab === 'ingredients' && (
              <CookingIngredientsPanel
                recipe={recipe}
                scaledIngredients={scaledIngredients}
                selectedPortions={selectedPortions}
                portionDir={portionDir}
                checked={checked}
                onPortionsChange={handlePortionsChange}
                onToggle={onToggle}
              />
            )}

            {tab === 'overview' && (
              <CookingOverviewPanel
                steps={steps}
                currentIndex={currentIndex}
                ingredientMap={ingredientMap}
                onGoTo={(i) => {
                  setCurrentIndex(i)
                  setTab('step')
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tab === 'step' && (
          <CookingStepBottomControls
            currentIndex={currentIndex}
            total={total}
            stepDir={stepDir}
            onGoTo={goTo}
            hasComment={!!current.comment}
            onCommentOpen={() => setCommentSheetOpen(true)}
          />
        )}
      </AnimatePresence>

      <CookingCommentSheet
        open={commentSheetOpen}
        stepNumber={currentIndex + 1}
        comment={current.comment}
        onSave={handleCommentSave}
        onDelete={handleCommentDelete}
        onClose={() => setCommentSheetOpen(false)}
      />
    </motion.div>
  )
}

export default CookingScreen
