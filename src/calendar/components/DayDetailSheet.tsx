import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MealPlanEntry, Recipe } from '../../recipe/types/recipe'
import { NL_DAYS_LONG, NL_MONTHS } from '../../shared/constants/locale'

type DayDetailSheetProps = {
  date: Date
  entries: MealPlanEntry[]
  recipeMap: Map<string, Recipe>
  onDelete: (id: string) => void
  onAdd: () => void
  onClose: () => void
}

const DayDetailSheet = ({
  date,
  entries,
  recipeMap,
  onDelete,
  onAdd,
  onClose,
}: DayDetailSheetProps) => {
  const nav = useNavigate()
  return (
    <>
      <motion.div
        className="lb-sheet-backdrop"
        style={{
          animation: 'none',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
        }}
        variants={{
          hidden: { opacity: 0, transition: { duration: 0.2 } },
          visible: { opacity: 1, transition: { duration: 0.24 } },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      />
      <motion.div
        className="lb-sheet"
        style={{ animation: 'none', paddingBottom: 30 }}
        variants={{
          hidden: {
            y: '100%',
            transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] },
          },
          visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 22px 0' }}>
          <div className="lb-eyebrow">{NL_DAYS_LONG[date.getDay()].toUpperCase()}</div>
          <h3 className="lb-display" style={{ margin: '4px 0 0', fontSize: 26 }}>
            {NL_MONTHS[date.getMonth()]} <b>{date.getDate()}</b>
          </h3>
        </div>
        <div style={{ padding: '16px 22px', overflow: 'auto', flex: 1, minHeight: 0 }}>
          <AnimatePresence initial={false}>
            {entries.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                style={{
                  padding: '20px 0',
                  color: 'var(--stone)',
                  fontStyle: 'italic',
                  fontFamily: 'var(--serif)',
                  textAlign: 'center',
                }}
              >
                Nog niets gepland.
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
            }}
          >
            <AnimatePresence initial={false}>
              {entries.map((e) => {
                const recipe = recipeMap.get(e.recipeId ?? '')
                return (
                  <motion.div
                    key={e.id}
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
                        {recipe ? recipe.title : e.customDescription}
                      </span>
                      <motion.button
                        onClick={() => onDelete(e.id)}
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
              })}
            </AnimatePresence>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.22, ease: [0.2, 0, 0, 1] }}
            onClick={onAdd}
            className="lb-btn lb-btn--ghost"
            style={{ width: '100%', marginTop: 14 }}
          >
            <Plus size={14} strokeWidth={2.2} />
            Maaltijd toevoegen
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}

export default DayDetailSheet
