import { useEffect, useRef, useState } from 'react'
import { getRecipes } from '../services/recipes'
import { createMealPlanEntry } from '../services/mealPlan'
import type { Recipe } from '../types/recipe'
import { useAuth } from '../contexts/AuthContext'
import AutoGrowTextarea from './AutoGrowTextarea'

interface Props {
  date: string
  onClose: () => void
  onSaved: () => void
  preselectedRecipeId?: string
}

type Tab = 'recipe' | 'custom'

export default function AddMealModal({ date, onClose, onSaved, preselectedRecipeId }: Props) {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>(preselectedRecipeId ? 'recipe' : 'recipe')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(preselectedRecipeId ?? '')
  const [customDescription, setCustomDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getRecipes().then(setRecipes)
  }, [])

  useEffect(() => {
    if (tab === 'recipe') searchRef.current?.focus()
  }, [tab])

  const filtered = search.trim()
    ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : recipes

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  async function handleSave() {
    if (!user) return
    if (tab === 'recipe' && !selectedRecipeId) return
    if (tab === 'custom' && !customDescription.trim()) return

    setSaving(true)
    try {
      await createMealPlanEntry({
        date,
        ...(tab === 'recipe' ? { recipeId: selectedRecipeId } : {}),
        ...(tab === 'custom' ? { customDescription: customDescription.trim() } : {}),
        createdBy: user.uid,
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const canSave = tab === 'recipe'
    ? !!selectedRecipeId
    : !!customDescription.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-lg font-bold italic text-stone-900">Maaltijd toevoegen</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-stone-400 capitalize">{displayDate}</p>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-stone-100 rounded-xl p-1">
            <button
              onClick={() => setTab('recipe')}
              className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors ${
                tab === 'recipe' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Recept
            </button>
            <button
              onClick={() => setTab('custom')}
              className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors ${
                tab === 'custom' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Eigen beschrijving
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === 'recipe' && (
            <>
              <div className="px-4 py-3 border-b border-stone-100 flex-shrink-0">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                  </svg>
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Zoek recept…"
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:border-clay-400 placeholder-stone-400"
                  />
                </div>
              </div>
              <ul className="overflow-y-auto flex-1 py-1">
                {filtered.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-stone-400">Geen recepten gevonden</li>
                )}
                {filtered.map(r => (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelectedRecipeId(r.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors ${
                        selectedRecipeId === r.id ? 'bg-clay-50' : ''
                      }`}
                    >
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-stone-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex-shrink-0 flex items-center justify-center text-stone-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                        </div>
                      )}
                      <span className={`flex-1 text-sm font-medium truncate ${
                        selectedRecipeId === r.id ? 'text-clay-700' : 'text-stone-800'
                      }`}>{r.title}</span>
                      {selectedRecipeId === r.id && (
                        <svg className="w-4 h-4 text-clay-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {tab === 'custom' && (
            <div className="px-4 py-4 flex-1">
              <label className="block text-sm text-stone-500 mb-2">Beschrijving</label>
              <AutoGrowTextarea
                autoFocus
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                placeholder="bijv. Uit eten, Restjes, Afhalen…"
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:border-clay-400 placeholder-stone-400 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-stone-100 flex gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-2.5 rounded-xl bg-clay-500 hover:bg-clay-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
