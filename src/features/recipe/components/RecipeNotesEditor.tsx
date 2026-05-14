import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import type { RecipeNote } from '@/features/recipe/types/recipe'
import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'

const SUGGESTIONS = ['Bewaren', 'Opwarmen']

type Props = {
  notes: RecipeNote[]
  onChange: (notes: RecipeNote[]) => void
}

const RecipeNotesEditor = ({ notes, onChange }: Props) => {
  const [ids, setIds] = useState<string[]>(() => notes.map(() => crypto.randomUUID()))

  const stableIds =
    ids.length >= notes.length
      ? ids
      : [...ids, ...Array.from({ length: notes.length - ids.length }, () => crypto.randomUUID())]

  const add = (label = '') => {
    setIds((prev) => [...prev, crypto.randomUUID()])
    onChange([...notes, { label, text: '' }])
  }

  const remove = (index: number) => {
    setIds((prev) => prev.filter((_, i) => i !== index))
    onChange(notes.filter((_, i) => i !== index))
  }

  const update = (index: number, field: keyof RecipeNote, value: string) => {
    onChange(notes.map((n, i) => (i === index ? { ...n, [field]: value } : n)))
  }

  const usedLabels = new Set(notes.map((n) => n.label))
  const remainingSuggestions = SUGGESTIONS.filter((s) => !usedLabels.has(s))

  const dashedBtnCls =
    'flex items-center gap-2 px-3 py-[9px] border border-dashed border-stone-2 rounded-[9px] text-stone text-[12px] bg-none cursor-pointer min-h-[38px] font-sans w-full'

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout" initial={false}>
        {notes.map((note, i) => (
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
              aria-label="Verwijder notitie"
            >
              <X size={11} strokeWidth={2.2} />
            </button>
            <input
              type="text"
              value={note.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="Onderwerp"
              className="w-full bg-transparent border-0 border-b-[0.5px] border-ink/14 outline-none text-[13px] text-bordeaux font-sans pr-7 pb-[6px]"
            />
            <AutoGrowTextarea
              value={note.text}
              onChange={(e) => update(i, 'text', e.target.value)}
              placeholder="Notitie"
              className="w-full bg-transparent border-0 outline-none text-[13px] font-sans text-ink-2 mt-[7px] resize-none leading-[1.45]"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <button type="button" onClick={() => add()} className={dashedBtnCls}>
        <Plus size={11} strokeWidth={2.5} />
        Notitie toevoegen
      </button>

      {remainingSuggestions.length > 0 && (
        <div>
          <div className="font-mono text-[9px] font-medium tracking-[0.1em] uppercase text-stone-2 mb-[5px]">
            Suggesties
          </div>
          <div className="flex flex-wrap gap-[5px]">
            {remainingSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="text-[10.5px] py-[5px] px-[11px] rounded-[20px] border border-dashed border-stone-2 bg-transparent text-stone font-mono tracking-[0.06em] cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RecipeNotesEditor
