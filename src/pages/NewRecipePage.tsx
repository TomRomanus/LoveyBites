import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import RecipeForm from '../components/RecipeForm'
import RecipeImport from '../components/RecipeImport'
import RecipeTextImport from '../components/RecipeTextImport'
import RecipePhotoImport from '../components/RecipePhotoImport'
import LoadingLogo from '../components/LoadingLogo'
import { createRecipe, updateRecipe, getRecipe, getRecipes } from '../services/recipes'
import type { RecipeInput } from '../types/recipe'

type Mode = 'url' | 'text' | 'photo' | 'manual'

const MODES: { id: Mode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'url',
    label: 'Vanuit URL',
    description: 'Plak een receptlink of TikTok-video',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" />
      </svg>
    ),
  },
  {
    id: 'text',
    label: 'Vanuit tekst',
    description: 'Plak ruwe tekst van waar dan ook',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
        <path d="M5 6h14M5 12h14M5 18h9" />
      </svg>
    ),
  },
  {
    id: 'photo',
    label: 'Vanuit foto',
    description: 'Upload een foto uit een kookboek',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
        <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M3 17l5-5 4 4 3-3 6 6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'manual',
    label: 'Zelf invullen',
    description: 'Tik het zelf in',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
        <path d="M3 21l3.5-1L20 6.5 17.5 4 4 17.5 3 21z" />
      </svg>
    ),
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

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

export default function NewRecipePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [mode, setMode] = useState<Mode | null>(null)
  const [extracted, setExtracted] = useState(false)
  const [initial, setInitial] = useState<Partial<RecipeInput> | undefined>(undefined)
  const [formKey, setFormKey] = useState(0)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [hasTitle, setHasTitle] = useState(() => Boolean(initial?.title?.trim()))
  const [existingTags, setExistingTags] = useState<string[]>([])
  const direction = useRef(1)

  useEffect(() => {
    if (!id) return
    getRecipe(id).then((r) => {
      if (r) setInitial(r)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    getRecipes().then((recipes) => {
      const tags = [...new Set(recipes.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b))
      setExistingTags(tags)
    })
  }, [])

  function handleSelectMode(m: Mode) {
    direction.current = 1
    setMode(m)
    setExtracted(false)
  }

  function handleBack() {
    direction.current = -1
    setMode(null)
    setExtracted(false)
  }

  function handleExtracted(data: Partial<RecipeInput>) {
    direction.current = 1
    setInitial(data)
    setFormKey((k) => k + 1)
    setExtracted(true)
  }

  async function handleSubmit(data: RecipeInput) {
    if (id) {
      await updateRecipe(id, data)
      navigate(`/recipe/${id}`)
    } else {
      const newId = await createRecipe(data)
      navigate(`/recipe/${newId}`)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--paper)' }}>
        <LoadingLogo />
      </div>
    )
  }

  const screenKey = mode === null ? 'chooser' : isImportMode(mode) && !extracted ? `import-${mode}` : 'form'

  return (
    <div className="lb-paper" style={{ minHeight: '100dvh', overflow: 'hidden' }}>
      <AnimatePresence mode="wait" custom={direction.current}>
        {/* ── Chooser ── */}
        {!isEdit && mode === null && (
          <motion.div
            key="chooser"
            custom={direction.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
          >
            <div style={headerStyle}>
              <button onClick={() => navigate(-1)} style={circleBtn}><XIcon /></button>
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--stone-2)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ── Import flows ── */}
        {!isEdit && isImportMode(mode) && !extracted && (
          <motion.div
            key={`import-${mode}`}
            custom={direction.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
          >
            <div style={headerStyle}>
              <button onClick={handleBack} style={circleBtn}><XIcon /></button>
              <div style={monoTitle}>{MODES.find(m => m.id === mode)?.label}</div>
              <div style={{ width: 40 }} />
            </div>
            <motion.div
              style={{ padding: '28px 22px' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
            >
              {mode === 'url' && <RecipeImport onExtracted={handleExtracted} />}
              {mode === 'text' && <RecipeTextImport onExtracted={handleExtracted} />}
              {mode === 'photo' && <RecipePhotoImport onExtracted={handleExtracted} />}
            </motion.div>
          </motion.div>
        )}

        {/* ── Form ── */}
        {(isEdit || mode === 'manual' || extracted) && (
          <motion.div
            key="form"
            custom={direction.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
          >
            <div style={headerStyle}>
              {mode !== null && !isEdit ? (
                <button onClick={handleBack} style={circleBtn}><XIcon /></button>
              ) : isEdit ? (
                <button onClick={() => navigate(-1)} style={circleBtn}><XIcon /></button>
              ) : (
                <Link to="/" style={{ ...circleBtn, textDecoration: 'none' }}><XIcon /></Link>
              )}
              <div style={monoTitle}>{isEdit ? 'Bewerk recept' : 'Nieuw recept'}</div>
              {isEdit ? (
                <button
                  type="submit"
                  form="recipe-form"
                  disabled={saving}
                  style={{ width: 40, height: 40, borderRadius: 20, background: saving ? 'var(--stone-2)' : 'var(--bordeaux)', border: 0, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saving ? 'default' : 'pointer', flexShrink: 0 }}>
                  {saving
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><circle cx="12" cy="12" r="8" strokeDasharray="4 4" /></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
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
                key={formKey}
                initial={initial}
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
