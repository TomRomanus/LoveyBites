import { useState } from 'react'
import type { RecipeInput } from '../types/recipe'
import { importRecipeFromUrl } from '../services/importRecipe'

interface Props {
  onExtracted: (data: Partial<RecipeInput>) => void
}

export default function RecipeImport({ onExtracted }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = url.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      const data = await importRecipeFromUrl(trimmed)
      onExtracted(data)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Importeren mislukt. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return null

  return (
    <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="lb-eyebrow" style={{ marginBottom: 8 }}>Link</div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          disabled={loading}
          style={{
            width: '100%',
            background: 'var(--cream-card)',
            border: '0.5px solid rgba(31,29,26,0.14)',
            borderRadius: 12,
            padding: '13px 14px',
            fontFamily: 'var(--sans)',
            fontSize: 15,
            color: 'var(--ink)',
            outline: 'none',
            boxSizing: 'border-box',
            opacity: loading ? 0.5 : 1,
          }}
        />
      </div>

      <p style={{ margin: 0, fontSize: 13, color: 'var(--stone)', textAlign: 'center', lineHeight: 1.5 }}>
        Plak een link van een receptenwebsite of TikTok-video
      </p>

      {error && (
        <div style={{ background: 'var(--bordeaux-tint)', color: 'var(--bordeaux)', padding: '10px 14px', borderRadius: '0 12px 12px 0', fontSize: 13, fontWeight: 500, borderLeft: '3px solid var(--bordeaux)' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="lb-btn lb-btn--primary"
        style={{ width: '100%', height: 40, borderRadius: 20, fontSize: 13 }}
      >
        {loading ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ animation: 'lb-spin 1s linear infinite' }}>
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Ophalen…
          </>
        ) : (
          'Importeren'
        )}
      </button>
    </form>
  )
}
