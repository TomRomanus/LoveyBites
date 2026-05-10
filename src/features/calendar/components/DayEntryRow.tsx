import { motion } from 'framer-motion'
import { EASE_IN, EASE_OUT } from '@/shared/constants/animations'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'

type DayEntryRowProps = {
  entry: MealPlanEntry
  recipe?: Recipe
  onDelete: (id: string) => void
}

const DayEntryRow = ({ entry, recipe, onDelete }: DayEntryRowProps) => {
  const nav = useNavigate()
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: 14 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.22, ease: EASE_OUT },
        },
      }}
      exit={{
        opacity: 0,
        height: 0,
        x: 6,
        transition: { duration: 0.18, ease: EASE_IN },
      }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 py-[10px] border-b-[0.5px] border-ink/10">
        <div
          className={`w-[2.5px] self-stretch rounded-[2px] shrink-0 ${recipe ? 'bg-bordeaux' : 'bg-stone'}`}
        />
        <span
          onClick={() => recipe && nav(`/recipe/${recipe.id}`)}
          className={`flex-1 font-serif italic text-base leading-[1.25] font-medium overflow-hidden text-ellipsis whitespace-nowrap ${recipe ? 'text-bordeaux cursor-pointer' : 'text-stone cursor-default'}`}
        >
          {recipe ? recipe.title : entry.customDescription}
        </span>
        <motion.button
          data-testid="delete-entry-btn"
          onClick={() => onDelete(entry.id)}
          whileTap={{ scale: 0.78 }}
          className="bg-transparent border-0 p-0 ml-[1px] text-stone-2 cursor-pointer shrink-0 flex items-center"
        >
          <X size={12} strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default DayEntryRow
