import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Source } from '../types/recipe'
import { uploadSourceImage } from '../services/storage'

interface Props {
  sources: Source[]
  onChange: (sources: Source[]) => void
}

export default function SourceEditor({ sources, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const idsRef = useRef<string[]>([])

  while (idsRef.current.length < sources.length) {
    idsRef.current.push(crypto.randomUUID())
  }

  function update(index: number, field: keyof Source, value: string) {
    const next = sources.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    onChange(next)
  }

  function remove(index: number) {
    idsRef.current.splice(index, 1)
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
            key={idsRef.current[i]}
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
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
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
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          bron toevoegen
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ ...dashedBtn, color: uploading ? 'var(--stone-2)' : 'var(--stone)', cursor: uploading ? 'default' : 'pointer' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          {uploading ? 'uploaden…' : 'afbeelding uploaden'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
    </div>
  )
}
