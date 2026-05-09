import { useState } from 'react'
import { Loader } from 'lucide-react'
import type { RecipeInput } from '@/features/recipe/types/recipe'
import { importRecipeFromUrl } from '@/features/recipe/api/importRecipe'

type Props = {
  onExtracted: (data: Partial<RecipeInput>) => void
}

const RecipeUrlImport = ({ onExtracted }: Props) => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleImport = async (e: React.FormEvent) => {
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
    <form onSubmit={handleImport} className="flex flex-col gap-4">
      <div>
        <div className="lb-eyebrow mb-2">Link</div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          disabled={loading}
          className={`w-full bg-cream border-[0.5px] border-ink/14 rounded-[12px] px-[14px] py-[13px] font-sans text-[15px] text-ink outline-none box-border ${loading ? 'opacity-50' : 'opacity-100'}`}
        />
      </div>

      <p className="m-0 text-[13px] text-stone text-center leading-[1.5]">
        Plak een link van een receptenwebsite of TikTok-video
      </p>

      {error && (
        <div className="bg-bordeaux-tint text-bordeaux px-[14px] py-[10px] rounded-[0_12px_12px_0] text-[13px] font-medium border-l-[3px] border-bordeaux">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="lb-btn lb-btn--primary w-full h-10 rounded-[20px] text-[13px]"
      >
        {loading ? (
          <>
            <Loader size={13} strokeWidth={2} style={{ animation: 'lb-spin 1s linear infinite' }} />
            Ophalen…
          </>
        ) : (
          'Importeren'
        )}
      </button>
    </form>
  )
}

export default RecipeUrlImport
