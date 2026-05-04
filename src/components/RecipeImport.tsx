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
    <div className="bg-bordeaux-tint border border-bordeaux-soft rounded-2xl px-5 py-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-bordeaux-dark">Importeer via link</p>
        <p className="text-xs text-bordeaux mt-0.5">Plak een link van een receptenwebsite of TikTok</p>
      </div>

      <form onSubmit={handleImport} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          disabled={loading}
          className="flex-1 min-w-0 border border-bordeaux-soft rounded-xl px-3 py-2 text-sm text-ink-2 placeholder:text-stone-2 focus:outline-none focus:ring-2 focus:ring-bordeaux focus:border-transparent transition bg-white disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-bordeaux hover:bg-bordeaux-dark disabled:bg-bordeaux-soft text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Ophalen…
            </span>
          ) : (
            'Importeer →'
          )}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}
    </div>
  )
}
