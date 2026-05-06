import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
    setMode(m)
    setExtracted(false)
  }

  function handleBack() {
    setMode(null)
    setExtracted(false)
  }

  function handleExtracted(data: Partial<RecipeInput>) {
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

  const showForm = mode === 'manual' || extracted

  // Import chooser
  if (!isEdit && mode === null) {
    return (
      <div className="lb-paper" style={{ minHeight: '100dvh' }}>
        <div style={{
          position: 'sticky', top: 0,
          background: 'rgba(248, 244, 237, 0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 10,
          padding: '24px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '0.5px solid var(--line)',
        }}>
          <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 20, background: 'transparent', border: '0.5px solid var(--line)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stone)', fontWeight: 500 }}>
            Nieuw recept
          </div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ padding: '8px 20px 40px' }}>
          {MODES.map(({ id: modeId, label, description, icon }, index) => (
            <button key={modeId} onClick={() => handleSelectMode(modeId)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 4px', textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: index < MODES.length - 1 ? '0.5px solid var(--line)' : 'none' }}>
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
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Import flows
  if (!isEdit && isImportMode(mode) && !extracted) {
    return (
      <div className="lb-paper" style={{ minHeight: '100dvh' }}>
        <div style={{
          position: 'sticky', top: 0,
          background: 'rgba(248, 244, 237, 0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 10,
          padding: '24px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '0.5px solid var(--line)',
        }}>
          <button onClick={handleBack} style={{ width: 40, height: 40, borderRadius: 20, background: 'transparent', border: '0.5px solid var(--line)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stone)', fontWeight: 500 }}>
            {MODES.find(m => m.id === mode)?.label}
          </div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ padding: '28px 22px' }}>
          {mode === 'url' && <RecipeImport onExtracted={handleExtracted} />}
          {mode === 'text' && <RecipeTextImport onExtracted={handleExtracted} />}
          {mode === 'photo' && <RecipePhotoImport onExtracted={handleExtracted} />}
        </div>
      </div>
    )
  }

  // Edit form
  return (
    <div className="lb-paper" style={{ minHeight: '100dvh' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0,
        background: 'rgba(248, 244, 237, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 10,
        padding: '24px 20px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid var(--line)',
      }}>
        {mode !== null && !isEdit ? (
          <button onClick={handleBack} style={{ width: 40, height: 40, borderRadius: 20, background: 'transparent', border: '0.5px solid var(--line)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        ) : isEdit ? (
          <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 20, background: 'transparent', border: '0.5px solid var(--line)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        ) : (
          <Link to="/" style={{ width: 40, height: 40, borderRadius: 20, background: 'transparent', border: '0.5px solid var(--line)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </Link>
        )}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stone)', fontWeight: 500 }}>
          {isEdit ? 'Bewerk recept' : 'Nieuw recept'}
        </div>
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

      <div style={{ padding: '0 20px 32px' }}>
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
      </div>
    </div>
  )
}
