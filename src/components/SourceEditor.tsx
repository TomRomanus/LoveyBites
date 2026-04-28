import { useRef, useState } from 'react'
import type { Source } from '../types/recipe'
import { uploadSourceImage } from '../services/storage'

interface Props {
  sources: Source[]
  onChange: (sources: Source[]) => void
}

export default function SourceEditor({ sources, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function update(index: number, field: keyof Source, value: string) {
    const next = sources.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    onChange(next)
  }

  function remove(index: number) {
    onChange(sources.filter((_, i) => i !== index))
  }

  function add() {
    onChange([...sources, { label: '', url: '' }])
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const url = await uploadSourceImage(file)
      onChange([...sources, { label: file.name, url }])
    } finally {
      setUploading(false)
    }
  }

  const inputClass = 'border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:border-transparent transition'

  return (
    <div className="space-y-2">
      {sources.map((source, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={source.label}
            onChange={(e) => update(i, 'label', e.target.value)}
            placeholder="Naam (optioneel)"
            className={`w-full sm:w-1/3 ${inputClass}`}
          />
          <input
            type="url"
            value={source.url}
            onChange={(e) => update(i, 'url', e.target.value)}
            placeholder="https://..."
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="self-end sm:self-center text-stone-300 hover:text-red-400 transition-colors min-h-[2rem] min-w-[2rem] flex items-center justify-center"
            aria-label="Verwijder bron"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex gap-4 pt-1">
        <button
          type="button"
          onClick={add}
          className="text-sm text-clay-500 hover:text-clay-700 transition-colors font-medium"
        >
          + Bron toevoegen
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-clay-500 hover:text-clay-700 disabled:text-clay-300 transition-colors font-medium"
        >
          {uploading ? 'Uploaden…' : '+ Afbeelding uploaden'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
