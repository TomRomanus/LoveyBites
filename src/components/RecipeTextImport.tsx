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
    <div className="bg-bordeaux-tint border border-bordeaux-soft rounded-2xl px-5 py-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-bordeaux-dark">Typ of plak een recept</p>
        <p className="text-xs text-bordeaux mt-0.5">Schrijf het recept op zoals je het kent, de AI structureert het voor je</p>
      </div>

      <form onSubmit={handleConvert} className="space-y-2">
        <AutoGrowTextarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Bijv: 200g bloem, 2 eieren, 100ml melk…\n\nMeng de bloem met de eieren…'}
          disabled={loading}
          rows={5}
          className="w-full border border-bordeaux-soft rounded-xl px-3 py-2 text-sm text-ink-2 placeholder:text-stone-2 focus:outline-none focus:ring-2 focus:ring-bordeaux focus:border-transparent transition bg-white disabled:opacity-50 resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="bg-bordeaux hover:bg-bordeaux-dark disabled:bg-bordeaux-soft text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Omzetten…
              </span>
            ) : (
              'Omzetten →'
            )}
          </button>
        </div>
      </form>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}
    </div>
  )
}
