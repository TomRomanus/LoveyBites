import { useState } from 'react'
import type { RecipeInput } from '../types/recipe'
import { importRecipeFromText } from '../services/importRecipe'
import AutoGrowTextarea from './AutoGrowTextarea'

interface Props {
  onExtracted: (data: Partial<RecipeInput>) => void
}

export default function RecipeTextImport({ onExtracted }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = text.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      const data = await importRecipeFromText(trimmed)
      onExtracted(data)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Omzetten mislukt. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return null

  return (
    <form onSubmit={handleConvert} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="lb-eyebrow" style={{ marginBottom: 8 }}>Tekst</div>
        <AutoGrowTextarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Bijv: 200g bloem, 2 eieren, 100ml melk…\n\nMeng de bloem met de eieren…'}
          disabled={loading}
          rows={6}
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
            resize: 'none',
            lineHeight: 1.5,
            boxSizing: 'border-box',
            opacity: loading ? 0.5 : 1,
          }}
        />
      </div>

      <p style={{ margin: 0, fontSize: 13, color: 'var(--stone)', textAlign: 'center', lineHeight: 1.5 }}>
        Schrijf of plak het recept, de AI structureert het voor je
      </p>

      {error && (
        <div style={{ background: 'var(--bordeaux-tint)', color: 'var(--bordeaux)', padding: '10px 14px', borderRadius: '0 12px 12px 0', fontSize: 13, fontWeight: 500, borderLeft: '3px solid var(--bordeaux)' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="lb-btn lb-btn--primary"
        style={{ width: '100%', height: 40, borderRadius: 20, fontSize: 13 }}
      >
        {loading ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Omzetten…
          </>
        ) : (
          'Importeren'
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
