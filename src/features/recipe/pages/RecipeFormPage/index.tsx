import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_STANDARD } from '@/shared/constants/animations'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import RecipeForm from '@/features/recipe/components/RecipeForm'
import RecipeUrlImport from '@/features/recipe/components/RecipeUrlImport'
import RecipeTextImport from '@/features/recipe/components/RecipeTextImport'
import RecipePhotoImport from '@/features/recipe/components/RecipePhotoImport'
import { createRecipe, updateRecipe, getRecipes } from '@/features/recipe/api/recipes'
import { recipeKeys } from '@/features/recipe/api/queryKeys'
import useRecipeLoad from '@/features/recipe/hooks/useRecipeLoad'
import type { RecipeInput } from '@/features/recipe/types/recipe'
import RecipeFormSkeleton from '@/features/recipe/pages/RecipeFormPage/RecipeFormSkeleton'
import ModeChooser from '@/features/recipe/pages/RecipeFormPage/ModeChooser'
import RecipeFormHeader from '@/features/recipe/pages/RecipeFormPage/RecipeFormHeader'
import { slideVariants, slideTransition } from '@/features/recipe/utils/recipeAnimations'

type Mode = 'url' | 'text' | 'photo' | 'manual'

const isImportMode = (m: Mode | null): m is 'url' | 'text' | 'photo' =>
  m === 'url' || m === 'text' || m === 'photo'

const MODES_LABELS: Record<Mode, string> = {
  url: 'Vanuit URL',
  text: 'Vanuit tekst',
  photo: 'Vanuit foto',
  manual: 'Zelf invullen',
}

const RecipeFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const [mode, setMode] = useState<Mode | null>(null)
  const [extracted, setExtracted] = useState(false)
  const [importedData, setImportedData] = useState<Partial<RecipeInput> | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [hasTitle, setHasTitle] = useState(false)
  const [direction, setDirection] = useState(1)

  const { data: fetchedRecipe, isLoading: loading } = useRecipeLoad(id)

  const { data: allRecipes = [] } = useQuery({
    queryKey: recipeKeys.list(),
    queryFn: getRecipes,
  })

  const existingTags = useMemo(
    () => [...new Set(allRecipes.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b)),
    [allRecipes],
  )

  const formInitial = isEdit ? (fetchedRecipe ?? undefined) : importedData

  const handleSelectMode = (m: Mode) => {
    setDirection(1)
    setMode(m)
    setExtracted(false)
  }

  const handleBack = () => {
    setDirection(-1)
    setMode(null)
    setExtracted(false)
  }

  const handleExtracted = (data: Partial<RecipeInput>) => {
    setDirection(1)
    setImportedData(data)
    setExtracted(true)
  }

  const handleSubmit = async (data: RecipeInput) => {
    if (id) {
      await updateRecipe(id, data)
      if (fetchedRecipe) {
        queryClient.setQueryData(recipeKeys.detail(id), { ...fetchedRecipe, ...data })
      }
      navigate(-1)
    } else {
      const newId = await createRecipe(data)
      navigate(`/recipe/${newId}`, { replace: true })
    }
  }

  if (loading) {
    return <RecipeFormSkeleton />
  }

  return (
    <div className="lb-paper min-h-[100dvh] overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        {/* ── Chooser ── */}
        {!isEdit && mode === null && (
          <motion.div
            key="chooser"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
          >
            <ModeChooser onSelect={handleSelectMode} onClose={() => navigate(-1)} />
          </motion.div>
        )}

        {/* ── Import flows ── */}
        {!isEdit && isImportMode(mode) && !extracted && (
          <motion.div
            key={`import-${mode}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
          >
            <RecipeFormHeader
              isEdit={false}
              mode={mode}
              saving={false}
              title={mode ? MODES_LABELS[mode] : ''}
              onBack={handleBack}
            />
            <motion.div
              className="px-[22px] py-7"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.22, ease: EASE_STANDARD }}
            >
              {mode === 'url' && <RecipeUrlImport onExtracted={handleExtracted} />}
              {mode === 'text' && <RecipeTextImport onExtracted={handleExtracted} />}
              {mode === 'photo' && <RecipePhotoImport onExtracted={handleExtracted} />}
            </motion.div>
          </motion.div>
        )}

        {/* ── Form ── */}
        {(isEdit || mode === 'manual' || extracted) && (
          <motion.div
            key="form"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className={isEdit ? 'h-[100dvh] overflow-y-auto' : undefined}
          >
            <RecipeFormHeader
              isEdit={isEdit}
              mode={mode}
              saving={saving}
              title={isEdit ? 'Bewerk recept' : 'Nieuw recept'}
              onBack={isEdit ? () => navigate(-1) : handleBack}
            />
            <motion.div
              className="px-5 pb-8"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.22, ease: EASE_STANDARD }}
            >
              <RecipeForm
                initial={formInitial}
                onSubmit={handleSubmit}
                onSavingChange={setSaving}
                onTitleChange={setHasTitle}
                existingTags={existingTags}
              />
              {!isEdit && (
                <div className="pt-4">
                  <button
                    type="submit"
                    form="recipe-form"
                    disabled={saving || !hasTitle}
                    className="lb-btn lb-btn--primary w-full h-10 rounded-[20px] text-[13px]"
                  >
                    {saving ? 'Opslaan…' : 'Toevoegen'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RecipeFormPage
