import { useState } from 'react'
import { Loader } from 'lucide-react'
import type { RecipeInput } from '@/features/recipe/types/recipe'
import { importRecipeFromText } from '@/features/recipe/api/importRecipe'
import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'

type Props = {
  onExtracted: (data: Partial<RecipeInput>) => void
}

const RecipeTextImport = ({ onExtracted }: Props) => {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleConvert = async (e: React.FormEvent) => {
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
    <form onSubmit={handleConvert} className="flex flex-col gap-4">
      <div>
        <div className="lb-eyebrow mb-2">Tekst</div>
        <AutoGrowTextarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Bijv: 200g bloem, 2 eieren, 100ml melk…\n\nMeng de bloem met de eieren…'}
          disabled={loading}
          style={{ minHeight: '180px' }}
          className={`w-full bg-cream border-[0.5px] border-ink/14 rounded-[12px] px-[14px] py-[13px] font-sans text-[15px] text-ink outline-none resize-none leading-[1.5] box-border ${loading ? 'opacity-50' : 'opacity-100'}`}
        />
      </div>

      <p className="m-0 text-[13px] text-stone text-center leading-[1.5]">
        Schrijf of plak het recept, de AI structureert het voor je
      </p>

      {error && (
        <div className="bg-bordeaux-tint text-bordeaux px-[14px] py-[10px] rounded-[0_12px_12px_0] text-[13px] font-medium border-l-[3px] border-bordeaux">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="lb-btn lb-btn--primary w-full h-10 rounded-[20px] text-[13px]"
      >
        {loading ? (
          <>
            <Loader size={13} strokeWidth={2} style={{ animation: 'lb-spin 1s linear infinite' }} />
            Omzetten…
          </>
        ) : (
          'Importeren'
        )}
      </button>
    </form>
  )
}

export default RecipeTextImport
