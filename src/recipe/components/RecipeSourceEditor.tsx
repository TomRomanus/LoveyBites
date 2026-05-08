import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Upload } from 'lucide-react'
import type { Source } from '../types/recipe'
import { uploadSourceImage } from '../services/storage'

type Props = {
  sources: Source[]
  onChange: (sources: Source[]) => void
}

const RecipeSourceEditor = ({ sources, onChange }: Props) => {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Stable per-item keys managed in state so they are never read during render from a ref
  const [ids, setIds] = useState<string[]>(() =>
    sources.map(() => crypto.randomUUID())
  )

  // Grow the ids array if sources were added externally (defensive)
  const stableIds = ids.length >= sources.length
    ? ids
    : [...ids, ...Array.from({ length: sources.length - ids.length }, () => crypto.randomUUID())]

  const update = (index: number, field: keyof Source, value: string) => {
    const next = sources.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    onChange(next)
  }

  const remove = (index: number) => {
    setIds(prev => prev.filter((_, i) => i !== index))
    onChange(sources.filter((_, i) => i !== index))
  }

  const add = () => {
    setIds(prev => [...prev, crypto.randomUUID()])
    onChange([...sources, { label: '', url: '' }])
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const url = await uploadSourceImage(file)
      setIds(prev => [...prev, crypto.randomUUID()])
      onChange([...sources, { label: file.name, url }])
    } finally {
      setUploading(false)
    }
  }

  const dashedBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 12px', border: '1px dashed var(--stone-2)',
    borderRadius: 9, color: 'var(--stone)', fontSize: 12,
    background: 'none', cursor: 'pointer', minHeight: 38,
    fontFamily: 'var(--sans)', width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AnimatePresence mode="popLayout" initial={false}>
        {sources.map((source, i) => (
          <motion.div
            key={stableIds[i]}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.13, ease: 'easeIn' } }}
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{ background: 'transparent', border: '0.5px solid rgba(31,29,26,0.20)', borderRadius: 10, padding: '10px 12px', position: 'relative' }}
          >
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 0, color: 'var(--stone-2)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', opacity: 0.8 }}
              aria-label="Verwijder bron"
            >
              <X size={11} strokeWidth={2.2} />
            </button>
            <input
              type="text"
              value={source.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="Naam (optioneel)"
              style={{
                width: '100%', background: 'transparent', border: 0, outline: 'none',
                fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--sans)',
                paddingRight: 28, paddingBottom: 6,
                borderBottom: '0.5px solid var(--line)',
              }}
            />
            <input
              type="url"
              value={source.url}
              onChange={(e) => update(i, 'url', e.target.value)}
              placeholder="https://..."
              style={{
                width: '100%', background: 'transparent', border: 0, outline: 'none',
                fontSize: 12, color: source.url ? '#722F37' : 'var(--stone)', fontFamily: 'var(--sans)',
                fontStyle: 'italic', marginTop: 7,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button type="button" onClick={add} style={dashedBtn}>
          <Plus size={11} strokeWidth={2.5} />
          bron toevoegen
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ ...dashedBtn, color: uploading ? 'var(--stone-2)' : 'var(--stone)', cursor: uploading ? 'default' : 'pointer' }}>
          <Upload size={11} strokeWidth={2.5} />
          {uploading ? 'uploaden…' : 'afbeelding uploaden'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
    </div>
  )
}

export default RecipeSourceEditor
