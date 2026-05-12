import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'
import { xBtnCls } from '@/features/recipe/components/editor/LeafRow'

type Props = {
  equipment: string[]
  onChange: (items: string[]) => void
}

const RecipeEquipmentEditor = ({ equipment, onChange }: Props) => {
  const add = () => onChange([...equipment, ''])

  const remove = (index: number) => onChange(equipment.filter((_, i) => i !== index))

  const update = (index: number, value: string) =>
    onChange(equipment.map((item, i) => (i === index ? value : item)))

  const dashedBtnCls =
    'flex items-center gap-2 px-3 py-[9px] border border-dashed border-stone-2 rounded-[9px] text-stone text-[12px] bg-none cursor-pointer min-h-[38px] font-sans w-full'

  return (
    <div className="flex flex-col">
      <AnimatePresence mode="popLayout" initial={false}>
        {equipment.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={i < equipment.length - 1 ? 'border-b-[0.5px] border-ink/14' : ''}
          >
            <div className="flex items-start gap-[3px]">
              <div className="relative shrink-0 pt-[13px]">
                <span className="text-bordeaux text-[11px] flex items-center justify-center leading-none pointer-events-none">
                  •
                </span>
              </div>
              <AutoGrowTextarea
                value={item}
                onChange={(e) => update(i, e.target.value)}
                rows={1}
                placeholder="bijv. Grote kom"
                className="flex-1 w-full bg-transparent border-0 outline-none font-sans text-[14px] text-ink px-1 py-[10px] resize-none leading-[1.45] !pt-[9px] !pb-[11px]"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className={`${xBtnCls} mt-[7px]`}
                aria-label="Verwijder benodigdheid"
              >
                <X size={11} strokeWidth={2.2} />
              </button>
            </div>
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

export default RecipeEquipmentEditor
