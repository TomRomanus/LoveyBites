import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MealPlanEntry, Recipe } from '@/features/recipe/types/recipe'

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
          transition: { duration: 0.22, ease: [0.2, 0, 0, 1] },
        },
      }}
      exit={{
        opacity: 0,
        height: 0,
        x: 6,
        transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
      }}
      style={{ overflow: 'hidden' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 0',
          borderBottom: '0.5px solid var(--line-soft)',
        }}
      >
        <div
          style={{
            width: 2.5,
            alignSelf: 'stretch',
            borderRadius: 2,
            flexShrink: 0,
            background: recipe ? 'var(--bordeaux)' : 'var(--stone)',
          }}
        />
        <span
          onClick={() => recipe && nav(`/recipe/${recipe.id}`)}
          style={{
            flex: 1,
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 16,
            lineHeight: 1.25,
            fontWeight: 500,
            color: recipe ? 'var(--bordeaux)' : 'var(--stone)',
            cursor: recipe ? 'pointer' : 'default',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {recipe ? recipe.title : entry.customDescription}
        </span>
        <motion.button
          data-testid="delete-entry-btn"
          onClick={() => onDelete(entry.id)}
          whileTap={{ scale: 0.78 }}
          style={{
            background: 'none',
            border: 0,
            padding: 0,
            marginLeft: 1,
            color: 'var(--stone-2)',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={12} strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default DayEntryRow
