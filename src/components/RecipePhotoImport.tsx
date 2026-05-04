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

  if (done) return null

  return (
    <div className="bg-bordeaux-tint border border-bordeaux-soft rounded-2xl px-5 py-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-bordeaux-dark">Foto van een recept</p>
        <p className="text-xs text-bordeaux mt-0.5">Maak een foto van een receptenboek of geschreven recept</p>
      </div>

      <form onSubmit={handleConvert} className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Geselecteerde foto"
              className="w-full max-h-48 object-cover rounded-xl border border-bordeaux-soft"
            />
            <button
              type="button"
              onClick={() => { setPreview(null); setFile(null); if (inputRef.current) inputRef.current.value = '' }}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white text-ink-2 rounded-full w-7 h-7 flex items-center justify-center text-sm shadow"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-bordeaux-soft rounded-xl py-6 flex flex-col items-center gap-2 text-bordeaux hover:border-bordeaux hover:text-bordeaux-dark transition-colors bg-white"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">Foto kiezen of maken</span>
          </button>
        )}

        {file && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
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
        )}
      </form>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}
    </div>
  )
}
