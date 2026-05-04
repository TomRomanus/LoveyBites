import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import RecipeForm from '../components/RecipeForm'
import RecipeImport from '../components/RecipeImport'
import RecipeTextImport from '../components/RecipeTextImport'
import RecipePhotoImport from '../components/RecipePhotoImport'
import LoadingLogo from '../components/LoadingLogo'
import { createRecipe, updateRecipe, getRecipe } from '../services/recipes'
import type { RecipeInput } from '../types/recipe'

type Mode = 'url' | 'text' | 'photo' | 'manual'

const MODES: { id: Mode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'url',
    label: 'Vanaf URL',
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

  useEffect(() => {
    if (!id) return
    getRecipe(id).then((r) => {
      if (r) setInitial(r)
      setLoading(false)
    })
  }, [id])

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
        <div style={{ padding: '54px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ background: 'none', border: 0, fontSize: 14, color: 'var(--ink-2)', textDecoration: 'none' }}>Annuleren</Link>
        </div>
        <div style={{ padding: '8px 24px 0' }}>
          <div className="lb-eyebrow">NIEUW RECEPT</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 34, lineHeight: 1.05, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500 }}>
            <span style={{ fontStyle: 'italic' }}>Waar </span>
            <span style={{ fontFamily: 'var(--sans)', fontStyle: 'normal', fontWeight: 700, letterSpacing: '-0.03em' }}>begint</span>
            <span style={{ fontStyle: 'italic' }}> dit?</span>
          </h1>
          <p style={{ margin: '8px 0 24px', fontSize: 14, color: 'var(--stone)', lineHeight: 1.5, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
            We vullen het formulier voor je in. Daarna pas je aan wat nodig is.
          </p>
        </div>
        <div style={{ padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MODES.map(({ id: modeId, label, description, icon }) => (
            <button key={modeId} onClick={() => handleSelectMode(modeId)} className="lb-card"
              style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '18px 18px', textAlign: 'left', cursor: 'pointer', border: 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bordeaux-tint)', color: 'var(--bordeaux)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--stone)', marginTop: 2 }}>{description}</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
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
        <div style={{ padding: '54px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={handleBack} style={{ background: 'none', border: 0, fontSize: 14, color: 'var(--ink-2)', cursor: 'pointer' }}>Terug</button>
          <div style={{ fontSize: 17, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink)' }}>
            {MODES.find(m => m.id === mode)?.label}
          </div>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ padding: '20px 22px' }}>
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
        padding: '54px 20px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid var(--line)',
      }}>
        {mode !== null && !isEdit ? (
          <button onClick={handleBack} style={{ background: 'none', border: 0, fontSize: 14, color: 'var(--ink-2)', cursor: 'pointer' }}>Annuleren</button>
        ) : (
          <Link to={id ? `/recipe/${id}` : '/'} style={{ fontSize: 14, color: 'var(--ink-2)', textDecoration: 'none' }}>Annuleren</Link>
        )}
        <div style={{ fontSize: 17, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink)' }}>
          {isEdit ? 'Bewerk' : 'Nieuw'}
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ padding: '0 20px 120px' }}>
        <RecipeForm
          key={formKey}
          initial={initial}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? 'Wijzigingen opslaan' : 'Recept toevoegen'}
        />
      </div>
    </div>
  )
}
