import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'

type Props = {
  benodigdheden: string[]
  onChange: (items: string[]) => void
}

const RecipeBenodigdhedenEditor = ({ benodigdheden, onChange }: Props) => {
  const add = () => onChange([...benodigdheden, ''])

  const remove = (index: number) => onChange(benodigdheden.filter((_, i) => i !== index))

  const update = (index: number, value: string) =>
    onChange(benodigdheden.map((item, i) => (i === index ? value : item)))

  const dashedBtnCls =
    'flex items-center gap-2 px-3 py-[9px] border border-dashed border-stone-2 rounded-[9px] text-stone text-[12px] bg-none cursor-pointer min-h-[38px] font-sans w-full'

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout" initial={false}>
        {benodigdheden.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.13, ease: 'easeIn' } }}
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="flex items-start gap-2"
          >
            <div
              className="w-[3px] h-[3px] rounded-full shrink-0 mt-[8px]"
              style={{ background: 'var(--bordeaux)' }}
            />
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder="bijv. Grote kom"
              className="flex-1 bg-transparent border-0 border-b-[0.5px] border-ink/14 outline-none text-[13px] font-sans text-ink pb-[6px]"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="bg-none border-0 text-stone-2 cursor-pointer p-1 flex items-center opacity-80"
              aria-label="Verwijder benodigdheid"
            >
              <X size={11} strokeWidth={2.2} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <button type="button" onClick={add} className={dashedBtnCls}>
        <Plus size={11} strokeWidth={2.5} />
        Benodigdheid toevoegen
      </button>
    </div>
  )
}

export default RecipeBenodigdhedenEditor
