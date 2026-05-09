import { motion } from 'framer-motion'
import ShoppingIngredientRow from '@/features/calendar/components/shopping/ShoppingIngredientRow'

type ShoppingSectionProps = {
  label: string
  days: string[]
  ingredients: string[]
  checkedKeys: Set<string>
  sectionIndex: number
  onToggle: (key: string) => void
}

const ShoppingSection = ({
  label,
  days,
  ingredients,
  checkedKeys,
  sectionIndex,
  onToggle,
}: ShoppingSectionProps) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.22, ease: [0.2, 0, 0, 1] },
        },
      }}
      className="mb-4 pb-[14px] border-b border-[0.5px] border-ink/10"
    >
      <div className="font-mono text-[10px] text-stone tracking-[0.1em]">{days.join(' · ')}</div>
      <div className="font-serif italic text-base font-medium mt-[2px] mb-[6px] text-bordeaux">
        {label}
      </div>
      <motion.div
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.035, delayChildren: 0.06 } },
        }}
      >
        {ingredients.map((x, j) => {
          const key = `${sectionIndex}-${j}`
          return (
            <motion.div
              key={j}
              variants={{
                hidden: { opacity: 0, x: -8 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
                },
              }}
            >
              <ShoppingIngredientRow
                text={x}
                checked={checkedKeys.has(key)}
                onToggle={() => onToggle(key)}
              />
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

export default ShoppingSection
