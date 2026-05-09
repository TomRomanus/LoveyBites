import { useRef, useState } from 'react'
import { X, Image, Loader } from 'lucide-react'
import type { RecipeInput } from '@/features/recipe/types/recipe'
import { importRecipeFromImage } from '@/features/recipe/api/importRecipe'

type Props = {
  onExtracted: (data: Partial<RecipeInput>) => void
}

const RecipePhotoImport = ({ onExtracted }: Props) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setError(null)
    const url = URL.createObjectURL(selected)
    setPreview(url)
  }

  const handleConvert = async (e: React.FormEvent) => {
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

  const handleClear = () => {
    setPreview(null)
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (done) return null

  return (
    <form onSubmit={handleConvert} className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div>
        <div className="lb-eyebrow mb-2">Foto</div>
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Geselecteerde foto"
              className="w-full max-h-[220px] object-cover rounded-[12px] border-[0.5px] border-ink/14 block"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 w-7 h-7 rounded-[14px] bg-[rgba(248,244,237,0.9)] border-[0.5px] border-ink/18 text-ink flex items-center justify-center cursor-pointer"
            >
              <X size={10} strokeWidth={2.2} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full bg-cream border-[0.5px] border-dashed border-ink/25 rounded-[12px] py-8 px-5 flex flex-col items-center gap-[10px] cursor-pointer box-border"
          >
            <Image size={28} strokeWidth={1.5} color="var(--stone)" />
            <span className="font-sans text-[14px] font-medium text-stone">
              Foto kiezen of maken
            </span>
          </button>
        )}
      </div>

      <p className="m-0 text-[13px] text-stone text-center leading-[1.5]">
        Maak een foto van een receptenboek of geschreven recept
      </p>

      {error && (
        <div className="bg-bordeaux-tint text-bordeaux px-[14px] py-[10px] rounded-[0_12px_12px_0] text-[13px] font-medium border-l-[3px] border-bordeaux">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !file}
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

export default RecipePhotoImport
