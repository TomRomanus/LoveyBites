import { useRef, useState } from 'react'
import type { RecipeInput } from '../types/recipe'
import { importRecipeFromImage } from '../services/importRecipe'

interface Props {
  onExtracted: (data: Partial<RecipeInput>) => void
}

export default function RecipePhotoImport({ onExtracted }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setError(null)
    const url = URL.createObjectURL(selected)
    setPreview(url)
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setError(null)
    setLoading(true)
    try {
      const data = await importRecipeFromImage(file)
      onExtracted(data)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Omzetten mislukt. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setPreview(null)
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (done) return null

  return (
    <form onSubmit={handleConvert} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div>
        <div className="lb-eyebrow" style={{ marginBottom: 8 }}>Foto</div>
        {preview ? (
          <div style={{ position: 'relative' }}>
            <img
              src={preview}
              alt="Geselecteerde foto"
              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, border: '0.5px solid rgba(31,29,26,0.14)', display: 'block' }}
            />
            <button
              type="button"
              onClick={handleClear}
              style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, background: 'rgba(248,244,237,0.9)', border: '0.5px solid rgba(31,29,26,0.18)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{ width: '100%', background: 'var(--cream-card)', border: '0.5px dashed rgba(31,29,26,0.25)', borderRadius: 12, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', boxSizing: 'border-box' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M3 17l5-5 4 4 3-3 6 6" />
            </svg>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, color: 'var(--stone)' }}>Foto kiezen of maken</span>
          </button>
        )}
      </div>

      <p style={{ margin: 0, fontSize: 13, color: 'var(--stone)', textAlign: 'center', lineHeight: 1.5 }}>
        Maak een foto van een receptenboek of geschreven recept
      </p>

      {error && (
        <div style={{ background: 'var(--bordeaux-tint)', color: 'var(--bordeaux)', padding: '10px 14px', borderRadius: '0 12px 12px 0', fontSize: 13, fontWeight: 500, borderLeft: '3px solid var(--bordeaux)' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !file}
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
