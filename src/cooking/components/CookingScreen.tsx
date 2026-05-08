import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collectIngredientMap } from '../../recipe/utils/ingredientUtils'
import type { CookingScreenProps, CookTab } from '../types/cooking'
import { flattenCookSteps } from '../utils/cookingUtils'
import CookingHeader from './CookingHeader'
import CookingTabs from './CookingTabs'
import CookingStepsPanel from './CookingStepsPanel'
import CookingStepBottomControls from './CookingStepBottomControls'
import CookingIngredientsPanel from './CookingIngredientsPanel'
import CookingOverviewPanel from './CookingOverviewPanel'

const dark = { background: '#1f1d1a', color: '#f8f4ed' }

const CookingScreen = ({
  recipe,
  scaledIngredients,
  selectedPortions,
  onPortionsChange,
  checked,
  onToggle,
  onClose,
}: CookingScreenProps) => {
  const ingredientMap = collectIngredientMap(scaledIngredients)
  const steps = flattenCookSteps(recipe.steps)
  const total = steps.length

  const [currentIndex, setCurrentIndex] = useState(0)
  const [stepDir, setStepDir] = useState<'next' | 'prev' | null>(null)
  const [tab, setTab] = useState<CookTab>('step')
  const [portionDir, setPortionDir] = useState<'up' | 'down' | null>(null)

  const handlePortionsChange = (p: number) => {
    setPortionDir(p > selectedPortions ? 'up' : 'down')
    onPortionsChange(p)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

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
    .map((id) => ingredientMap.get(id))
    .filter((t): t is string => t !== undefined)

  return (
    <motion.div
      key="cook-mode"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, height: '100dvh', ...dark, display: 'flex', flexDirection: 'column', userSelect: 'none' }}
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, overflow: 'auto', paddingBottom: 40 }}
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
                onGoTo={(i) => { setCurrentIndex(i); setTab('step') }}
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
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default CookingScreen
