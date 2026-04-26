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

  return (
    <div className="space-y-2">
      {sources.map((source, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            value={source.label}
            onChange={(e) => update(i, 'label', e.target.value)}
            placeholder="Naam (optioneel)"
            className="w-1/3 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <input
            type="url"
            value={source.url}
            onChange={(e) => update(i, 'url', e.target.value)}
            placeholder="https://..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-gray-400 hover:text-red-400 transition-colors text-sm px-1"
            aria-label="Verwijder bron"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={add}
          className="text-sm text-rose-500 hover:text-rose-700 transition-colors"
        >
          + Bron toevoegen
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-rose-500 hover:text-rose-700 disabled:text-rose-300 transition-colors"
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
