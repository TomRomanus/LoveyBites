import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Link as LinkIcon, AlignLeft, Image, Pencil, ChevronRight, Check, Loader } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import RecipeForm from '../components/RecipeForm'
import RecipeUrlImport from '../components/RecipeUrlImport'
import RecipeTextImport from '../components/RecipeTextImport'
import RecipePhotoImport from '../components/RecipePhotoImport'
import { createRecipe, updateRecipe, getRecipes } from '../services/recipes'
import { recipeKeys } from '../services/queryKeys'
import useRecipeLoad from '../hooks/useRecipeLoad'
import type { RecipeInput } from '../types/recipe'

type Mode = 'url' | 'text' | 'photo' | 'manual'

const MODES: { id: Mode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'url',
    label: 'Vanuit URL',
    description: 'Plak een receptlink of TikTok-video',
    icon: <LinkIcon size={20} strokeWidth={1.6} />,
  },
  {
    id: 'text',
    label: 'Vanuit tekst',
    description: 'Plak ruwe tekst van waar dan ook',
    icon: <AlignLeft size={20} strokeWidth={1.6} />,
  },
  {
    id: 'photo',
    label: 'Vanuit foto',
    description: 'Upload een foto uit een kookboek',
    icon: <Image size={20} strokeWidth={1.6} />,
  },
  {
    id: 'manual',
    label: 'Zelf invullen',
    description: 'Tik het zelf in',
    icon: <Pencil size={20} strokeWidth={1.6} />,
  },
]

const isImportMode = (m: Mode | null): m is 'url' | 'text' | 'photo' =>
  m === 'url' || m === 'text' || m === 'photo'

const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
const listItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -32, opacity: 0 }),
}
const slideTransition = { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.8 }

const headerStyle: React.CSSProperties = {
  position: 'sticky', top: 0,
  background: 'rgba(248, 244, 237, 0.92)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  zIndex: 10,
  padding: '24px 20px 14px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  borderBottom: '0.5px solid var(--line)',
}

const circleBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 20,
  background: 'transparent', border: '0.5px solid var(--line)',
  color: 'var(--ink)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
}

const monoTitle: React.CSSProperties = {
  fontFamily: 'var(--mono)', fontSize: 11,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--stone)', fontWeight: 500,
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
    [allRecipes]
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
    return (
      <div className="lb-paper" style={{ minHeight: '100dvh' }}>
        {/* Header */}
        <div style={{ ...headerStyle, position: 'static' }}>
          <div className="lb-skeleton" style={{ width: 40, height: 40, borderRadius: 20 }} />
          <div className="lb-skeleton" style={{ width: 100, height: 10, borderRadius: 4 }} />
          <div className="lb-skeleton" style={{ width: 40, height: 40, borderRadius: 20 }} />
        </div>
        {/* Form body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div className="lb-skeleton" style={{ height: 48, borderRadius: 14 }} />
          {/* Color row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="lb-skeleton" style={{ width: 32, height: 32, borderRadius: 16, flexShrink: 0 }} />
            ))}
          </div>
          {/* Description */}
          <div className="lb-skeleton" style={{ height: 80, borderRadius: 14 }} />
          {/* Section label */}
          <div className="lb-skeleton" style={{ height: 9, width: '22%', borderRadius: 3 }} />
          {/* Ingredients */}
          {[75, 60, 82, 55].map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 12, borderBottom: '0.5px solid var(--line-soft)' }}>
              <div className="lb-skeleton" style={{ flex: 1, height: 40, borderRadius: 12 }} />
              <div className="lb-skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
            </div>
          ))}
          {/* Section label */}
          <div className="lb-skeleton" style={{ height: 9, width: '18%', borderRadius: 3, marginTop: 4 }} />
          {/* Steps */}
          {[65, 80, 50].map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 12, borderBottom: '0.5px solid var(--line-soft)' }}>
              <div className="lb-skeleton" style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, marginTop: 2 }} />
              <div className="lb-skeleton" style={{ height: 60, flex: 1, borderRadius: 12 }} />
            </div>
          ))}
        </div>
      </div>
    )
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
            <div style={headerStyle}>
              <button onClick={() => navigate(-1)} style={circleBtn}><X size={13} strokeWidth={2.2} /></button>
              <div style={monoTitle}>Nieuw recept</div>
              <div style={{ width: 40 }} />
            </div>
            <motion.div
              style={{ padding: '8px 20px 40px' }}
              variants={listContainer}
              initial="hidden"
              animate="visible"
            >
              {MODES.map(({ id: modeId, label, description, icon }, index) => (
                <motion.button
                  key={modeId}
                  variants={listItem}
                  onClick={() => handleSelectMode(modeId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 4px', textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: index < MODES.length - 1 ? '0.5px solid var(--line)' : 'none' }}
                >
                  <div style={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bordeaux)' }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--stone)', marginTop: 2 }}>{description}</div>
                  </div>
                  <ChevronRight size={14} strokeWidth={1.6} color="var(--stone-2)" />
                </motion.button>
              ))}
            </motion.div>
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
              <button onClick={handleBack} style={circleBtn}><X size={13} strokeWidth={2.2} /></button>
              <div style={monoTitle}>{MODES.find(m => m.id === mode)?.label}</div>
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
                <button onClick={handleBack} style={circleBtn}><X size={13} strokeWidth={2.2} /></button>
              ) : isEdit ? (
                <button onClick={() => navigate(`/recipe/${id}`)} style={circleBtn}><X size={13} strokeWidth={2.2} /></button>
              ) : (
                <Link to="/" style={{ ...circleBtn, textDecoration: 'none' }}><X size={13} strokeWidth={2.2} /></Link>
              )}
              <div style={monoTitle}>{isEdit ? 'Bewerk recept' : 'Nieuw recept'}</div>
              {isEdit ? (
                <button
                  type="submit"
                  form="recipe-form"
                  disabled={saving}
                  style={{ width: 40, height: 40, borderRadius: 20, background: saving ? 'var(--stone-2)' : 'var(--bordeaux)', border: 0, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saving ? 'default' : 'pointer', flexShrink: 0 }}>
                  {saving
                    ? <Loader size={13} strokeWidth={2.2} style={{ animation: 'lb-spin 1s linear infinite' }} />
                    : <Check size={13} strokeWidth={2.5} />
                  }
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
