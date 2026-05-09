import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Loader } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
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

type Mode = 'url' | 'text' | 'photo' | 'manual'

const isImportMode = (m: Mode | null): m is 'url' | 'text' | 'photo' =>
  m === 'url' || m === 'text' || m === 'photo'

const MODES_LABELS: Record<Mode, string> = {
  url: 'Vanuit URL',
  text: 'Vanuit tekst',
  photo: 'Vanuit foto',
  manual: 'Zelf invullen',
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -32, opacity: 0 }),
}
const slideTransition = { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.8 }

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  background: 'rgba(248, 244, 237, 0.92)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  zIndex: 10,
  padding: '24px 20px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '0.5px solid var(--line)',
}

const circleBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 20,
  background: 'transparent',
  border: '0.5px solid var(--line)',
  color: 'var(--ink)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
}

const monoTitle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--stone)',
  fontWeight: 500,
}

const RecipeFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
      navigate(`/recipe/${id}`, { replace: true })
    } else {
      const newId = await createRecipe(data)
      navigate(`/recipe/${newId}`, { replace: true })
    }
  }

  if (loading) {
    return <RecipeFormSkeleton />
  }

  return (
    <div className="lb-paper" style={{ minHeight: '100dvh', overflow: 'hidden' }}>
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
            <div style={headerStyle}>
              <button onClick={handleBack} style={circleBtn}>
                <X size={13} strokeWidth={2.2} />
              </button>
              <div style={monoTitle}>{mode ? MODES_LABELS[mode] : ''}</div>
              <div style={{ width: 40 }} />
            </div>
            <motion.div
              style={{ padding: '28px 22px' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
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
          >
            <div style={headerStyle}>
              {mode !== null && !isEdit ? (
                <button data-testid="form-close-btn" onClick={handleBack} style={circleBtn}>
                  <X size={13} strokeWidth={2.2} />
                </button>
              ) : isEdit ? (
                <button
                  data-testid="form-close-btn"
                  onClick={() => navigate(`/recipe/${id}`)}
                  style={circleBtn}
                >
                  <X size={13} strokeWidth={2.2} />
                </button>
              ) : (
                <Link
                  data-testid="form-close-btn"
                  to="/"
                  style={{ ...circleBtn, textDecoration: 'none' }}
                >
                  <X size={13} strokeWidth={2.2} />
                </Link>
              )}
              <div style={monoTitle}>{isEdit ? 'Bewerk recept' : 'Nieuw recept'}</div>
              {isEdit ? (
                <button
                  type="submit"
                  form="recipe-form"
                  disabled={saving}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: saving ? 'var(--stone-2)' : 'var(--bordeaux)',
                    border: 0,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: saving ? 'default' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {saving ? (
                    <Loader
                      size={13}
                      strokeWidth={2.2}
                      style={{ animation: 'lb-spin 1s linear infinite' }}
                    />
                  ) : (
                    <Check size={13} strokeWidth={2.5} />
                  )}
                </button>
              ) : (
                <div style={{ width: 40 }} />
              )}
            </div>
            <motion.div
              style={{ padding: '0 20px 32px' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
            >
              <RecipeForm
                initial={formInitial}
                onSubmit={handleSubmit}
                onSavingChange={setSaving}
                onTitleChange={setHasTitle}
                existingTags={existingTags}
              />
              {!isEdit && (
                <div style={{ paddingTop: 16 }}>
                  <button
                    type="submit"
                    form="recipe-form"
                    disabled={saving || !hasTitle}
                    className="lb-btn lb-btn--primary"
                    style={{ width: '100%', height: 40, borderRadius: 20, fontSize: 13 }}
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
