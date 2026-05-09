import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Upload } from 'lucide-react'
import type { Source } from '@/features/recipe/types/recipe'
import { uploadSourceImage } from '@/features/recipe/api/imageStorage'

type Props = {
  sources: Source[]
  onChange: (sources: Source[]) => void
}

const RecipeSourceEditor = ({ sources, onChange }: Props) => {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Stable per-item keys managed in state so they are never read during render from a ref
  const [ids, setIds] = useState<string[]>(() => sources.map(() => crypto.randomUUID()))

  // Grow the ids array if sources were added externally (defensive)
  const stableIds =
    ids.length >= sources.length
      ? ids
      : [...ids, ...Array.from({ length: sources.length - ids.length }, () => crypto.randomUUID())]

  const update = (index: number, field: keyof Source, value: string) => {
    const next = sources.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    onChange(next)
  }

  const remove = (index: number) => {
    setIds((prev) => prev.filter((_, i) => i !== index))
    onChange(sources.filter((_, i) => i !== index))
  }

  const add = () => {
    setIds((prev) => [...prev, crypto.randomUUID()])
    onChange([...sources, { label: '', url: '' }])
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const url = await uploadSourceImage(file)
      setIds((prev) => [...prev, crypto.randomUUID()])
      onChange([...sources, { label: file.name, url }])
    } finally {
      setUploading(false)
    }
  }

  const dashedBtnCls =
    'flex items-center gap-2 px-3 py-[9px] border border-dashed border-stone-2 rounded-[9px] text-stone text-[12px] bg-none cursor-pointer min-h-[38px] font-sans w-full'

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout" initial={false}>
        {sources.map((source, i) => (
          <motion.div
            key={stableIds[i]}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.13, ease: 'easeIn' } }}
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="bg-transparent border-[0.5px] border-ink/20 rounded-[10px] px-3 py-[10px] relative"
          >
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-2 right-2 bg-none border-0 text-stone-2 cursor-pointer p-1 flex items-center opacity-80"
              aria-label="Verwijder bron"
            >
              <X size={11} strokeWidth={2.2} />
            </button>
            <input
              type="text"
              value={source.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="Naam (optioneel)"
              className="w-full bg-transparent border-0 border-b-[0.5px] border-ink/14 outline-none text-[13px] text-ink font-sans pr-7 pb-[6px]"
            />
            <input
              type="url"
              value={source.url}
              onChange={(e) => update(i, 'url', e.target.value)}
              placeholder="https://..."
              className={`w-full bg-transparent border-0 outline-none text-[12px] font-sans italic mt-[7px] ${source.url ? 'text-[#722F37]' : 'text-stone'}`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="flex flex-col gap-1.5">
        <button type="button" onClick={add} className={dashedBtnCls}>
          <Plus size={11} strokeWidth={2.5} />
          bron toevoegen
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`${dashedBtnCls} ${uploading ? 'text-stone-2 cursor-default' : 'text-stone cursor-pointer'}`}
        >
          <Upload size={11} strokeWidth={2.5} />
          {uploading ? 'uploaden…' : 'afbeelding uploaden'}
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

export default RecipeSourceEditor
