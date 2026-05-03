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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sources.map((source, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={source.label}
            onChange={(e) => update(i, 'label', e.target.value)}
            placeholder="Naam (optioneel)"
            className="lb-input"
            style={{ flex: 1 }}
          />
          <input
            type="url"
            value={source.url}
            onChange={(e) => update(i, 'url', e.target.value)}
            placeholder="https://..."
            className="lb-input"
            style={{ flex: 1.5 }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            style={{ background: 'none', border: 0, color: 'var(--stone)', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', flexShrink: 0 }}
            aria-label="Verwijder bron"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 16, paddingTop: 4 }}>
        <button type="button" onClick={add}
          style={{ background: 'none', border: 0, fontSize: 13, color: 'var(--bordeaux)', fontWeight: 500, cursor: 'pointer', padding: 0 }}>
          + Bron toevoegen
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
          style={{ background: 'none', border: 0, fontSize: 13, color: uploading ? 'var(--stone)' : 'var(--bordeaux)', fontWeight: 500, cursor: uploading ? 'default' : 'pointer', padding: 0 }}>
          {uploading ? 'Uploaden…' : '+ Afbeelding uploaden'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
    </div>
  )
}
