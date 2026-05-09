import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Check } from 'lucide-react'
import type { Recipe } from '@/features/recipe/types/recipe'
import { getRecipes } from '@/features/recipe/api/recipes'
import { createMealPlanEntry } from '@/features/calendar/api/mealPlan'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import { extractLeafTexts } from '@/features/recipe/utils/ingredientUtils'
import { NL_DAYS_LONG, NL_MONTHS_SHORT } from '@/shared/constants/locale'
import Sheet from '@/shared/components/Sheet'
import SearchInput from '@/shared/components/SearchInput'
import AnimatedTabBar from '@/shared/components/AnimatedTabBar'

type AddMealSheetProps = {
  visible: boolean
  date: string
  existingRecipeIds: string[]
  onClose: () => void
  onSaved: () => void
}

const AddMealSheet = ({
  visible,
  date,
  existingRecipeIds,
  onClose,
  onSaved,
}: AddMealSheetProps) => {
  const { user } = useAuth()
  const [tab, setTab] = useState<'recipe' | 'custom'>('recipe')
  const [tabDir, setTabDir] = useState(0)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      getRecipes()
        .then((r) => {
          if (!cancelled) setRecipes(r)
        })
        .catch(() => {
          if (!cancelled) setTimeout(load, 500)
        })
    load()
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (tab === 'recipe') searchRef.current?.focus()
  }, [tab])

  const available = recipes.filter((r) => !existingRecipeIds.includes(r.id))
  const filtered = search.trim()
    ? available.filter((r) => {
        const q = search.toLowerCase()
        if (r.title.toLowerCase().includes(q)) return true
        if (r.description?.toLowerCase().includes(q)) return true
        return extractLeafTexts(r.ingredients).some((t) => t.toLowerCase().includes(q))
      })
    : available

  const dateObj = new Date(date + 'T00:00:00')

  const handleSelectRecipe = async (recipeId: string) => {
    if (!user) return
    setSelectedId(recipeId)
    setSaving(true)
    try {
      await createMealPlanEntry({ date, recipeId, createdBy: user.uid })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCustom = async () => {
    if (!user || !custom.trim()) return
    setSaving(true)
    try {
      await createMealPlanEntry({ date, customDescription: custom.trim(), createdBy: user.uid })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} height="78%">
      <div style={{ padding: '12px 22px 0' }}>
        <div className="lb-eyebrow">
          {NL_DAYS_LONG[dateObj.getDay()]}, {NL_MONTHS_SHORT[dateObj.getMonth()]}{' '}
          {dateObj.getDate()}
        </div>
        <h3 className="lb-display" style={{ margin: '4px 0 14px', fontSize: 24 }}>
          Maaltijd <b>toevoegen</b>
        </h3>
      </div>
      <div style={{ padding: '0 22px 12px' }}>
        <AnimatedTabBar
          layoutId="meal-sheet-tabs"
          tabs={[
            { key: 'recipe', label: 'Uit kookboek' },
            { key: 'custom', label: 'Eigen tekst' },
          ]}
          active={tab}
          onChange={(v) => {
            setTabDir(v === 'custom' ? 1 : -1)
            setTab(v as 'recipe' | 'custom')
          }}
          variant="pill"
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait" initial={false} custom={tabDir}>
          {tab === 'recipe' && (
            <motion.div
              key="recipe"
              custom={tabDir}
              initial={{ opacity: 0, y: tabDir * 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: tabDir * -16 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              style={{
                padding: '6px 22px 0',
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              <>
                <div style={{ marginBottom: 10 }}>
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Zoek recept of ingrediënt"
                    inputRef={searchRef}
                  />
                </div>
                <div
                  className="lb-eyebrow"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    overflow: 'hidden',
                    marginTop: 14,
                    marginBottom: 4,
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={filtered.length}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      style={{ display: 'block' }}
                    >
                      {filtered.length}
                    </motion.span>
                  </AnimatePresence>
                  {filtered.length === 1 ? 'RECEPT' : 'RECEPTEN'}
                </div>
                <AnimatePresence mode="wait">
                  {filtered.length === 0 && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                      style={{
                        textAlign: 'center',
                        color: 'var(--stone)',
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        padding: 20,
                      }}
                    >
                      Geen recepten gevonden
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {filtered.map((r, i) => (
                    <motion.div
                      key={r.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.18,
                        delay: Math.min(i * 0.03, 0.15),
                        layout: { type: 'spring', stiffness: 350, damping: 35 },
                      }}
                    >
                      <motion.button
                        onClick={() => handleSelectRecipe(r.id)}
                        disabled={saving}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: 'block',
                          padding: '10px 0',
                          border: 0,
                          borderBottom: '0.5px solid var(--line)',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          borderRadius: 4,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                margin: 0,
                                fontFamily: 'var(--serif)',
                                fontStyle: 'italic',
                                fontSize: 18,
                                fontWeight: 500,
                                lineHeight: 1.15,
                                letterSpacing: '-0.015em',
                                color: 'var(--ink)',
                              }}
                            >
                              {r.title}
                            </div>
                            <div
                              style={{
                                width: 24,
                                height: 1.5,
                                background: 'var(--bordeaux)',
                                borderRadius: 1,
                                opacity: 0.6,
                                margin: '4px 0',
                              }}
                            />
                            {r.tags.length > 0 && (
                              <div
                                style={{
                                  fontFamily: 'var(--mono)',
                                  fontSize: 9,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                }}
                              >
                                {r.tags.map((t, i) => (
                                  <span key={t}>
                                    {i > 0 && (
                                      <span style={{ color: 'rgba(107,31,42,0.40)' }}> · </span>
                                    )}
                                    <span style={{ color: 'rgba(107,31,42,0.40)' }}>{t}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <AnimatePresence mode="wait" initial={false}>
                            {selectedId === r.id ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                                style={{
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: 'var(--bordeaux)',
                                }}
                              >
                                <Check size={12} strokeWidth={3} color="white" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="chevron"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.1 }}
                                style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
                              >
                                <ChevronRight size={16} strokeWidth={1.6} color="var(--stone)" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            </motion.div>
          )}
          {tab === 'custom' && (
            <motion.div
              key="custom"
              custom={tabDir}
              initial={{ opacity: 0, y: tabDir * -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: tabDir * 16 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              style={{ padding: '6px 22px 0', height: '100%', overflowY: 'auto' }}
            >
              <>
                <input
                  className="lb-input"
                  autoFocus
                  placeholder="bv. Afhalen, Restjes, Uit eten"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                />
                <motion.button
                  onClick={handleSaveCustom}
                  disabled={!custom.trim() || saving}
                  whileTap={{ scale: 0.97 }}
                  className="lb-btn lb-btn--primary"
                  style={{ width: '100%', marginTop: 14 }}
                >
                  {saving ? 'Opslaan…' : 'Aan planning toevoegen'}
                </motion.button>
              </>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}

export default AddMealSheet
