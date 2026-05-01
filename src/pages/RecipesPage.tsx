import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { getRecipes } from '../services/recipes'
import type { Recipe, IngredientNode } from '../types/recipe'
import { useAuth } from '../contexts/AuthContext'

function extractIngredientTexts(nodes: IngredientNode[]): string[] {
  return nodes.flatMap(n =>
    n.kind === 'leaf' ? [n.text] : extractIngredientTexts(n.children)
  )
}

interface TagFilterDropdownProps {
  allTags: string[]
  filteredTags: string[]
  selectedTags: string[]
  tagSearch: string
  open: boolean
  dropdownRef: React.RefObject<HTMLDivElement>
  onTagSearchChange: (v: string) => void
  onToggleTag: (tag: string) => void
  onClearTags: () => void
  onToggleOpen: () => void
}

function TagFilterDropdown({
  allTags,
  filteredTags,
  selectedTags,
  tagSearch,
  open,
  dropdownRef,
  onTagSearchChange,
  onToggleTag,
  onClearTags,
  onToggleOpen,
}: TagFilterDropdownProps) {
  if (allTags.length === 0) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggleOpen}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
          selectedTags.length > 0
            ? 'bg-clay-50 border-clay-300 text-clay-700'
            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
        }`}
      >
        <span>Tags</span>
        {selectedTags.length > 0 && (
          <span className="bg-clay-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {selectedTags.length}
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-56 bg-white border border-stone-200 rounded-2xl shadow-lg z-20 overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <input
              type="text"
              value={tagSearch}
              onChange={e => onTagSearchChange(e.target.value)}
              placeholder="Zoek tag…"
              className="w-full px-3 py-1.5 text-sm rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-clay-400 placeholder-stone-400"
              autoFocus
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filteredTags.length === 0 && (
              <li className="px-3 py-2 text-sm text-stone-400">Geen tags gevonden</li>
            )}
            {filteredTags.map(tag => (
              <li key={tag}>
                <button
                  onClick={() => onToggleTag(tag)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-stone-50 transition-colors"
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-clay-500 border-clay-500 text-white'
                        : 'border-stone-300'
                    }`}
                  >
                    {selectedTags.includes(tag) && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{tag}</span>
                </button>
              </li>
            ))}
          </ul>
          {selectedTags.length > 0 && (
            <div className="p-2 border-t border-stone-100">
              <button
                onClick={onClearTags}
                className="w-full text-xs text-stone-400 hover:text-clay-500 transition-colors py-0.5"
              >
                Wis selectie
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UserMenu() {
  const { user, signOutUser } = useAuth()
  if (!user) return null
  return (
    <div className="flex items-center gap-2.5">
      {user.photoURL && (
        <img
          src={user.photoURL}
          alt={user.displayName ?? ''}
          className="w-8 h-8 rounded-full ring-2 ring-stone-200"
          referrerPolicy="no-referrer"
        />
      )}
      <button
        onClick={signOutUser}
        className="text-sm text-stone-400 hover:text-clay-500 transition-colors"
      >
        Uitloggen
      </button>
    </div>
  )
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getRecipes()
      .then(setRecipes)
      .catch(() => setError('Recepten konden niet worden geladen. Controleer je Firebase-configuratie.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false)
        setTagSearch('')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort((a, b) => a.localeCompare(b))
  const filteredTags = tagSearch.trim()
    ? allTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
    : allTags

  const filteredRecipes = recipes.filter(recipe => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const inTitle = recipe.title.toLowerCase().includes(q)
      const inIngredients = extractIngredientTexts(recipe.ingredients).some(t =>
        t.toLowerCase().includes(q)
      )
      if (!inTitle && !inIngredients) return false
    }
    if (selectedTags.length > 0) {
      if (!selectedTags.some(tag => recipe.tags.includes(tag))) return false
    }
    return true
  })

  const hasActiveFilters = searchQuery.trim() !== '' || selectedTags.length > 0

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="w-20" />
        <h1 className="font-display text-2xl font-bold italic text-stone-900 tracking-tight">
          LoveyBites
        </h1>
        <UserMenu />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {!loading && !error && recipes.length > 0 && (
          <div className="mb-5 space-y-2">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Zoek op naam of ingrediënt…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:border-clay-400 placeholder-stone-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label="Wis zoekopdracht"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <TagFilterDropdown
                allTags={allTags}
                filteredTags={filteredTags}
                selectedTags={selectedTags}
                tagSearch={tagSearch}
                open={tagDropdownOpen}
                dropdownRef={dropdownRef}
                onTagSearchChange={setTagSearch}
                onToggleTag={toggleTag}
                onClearTags={() => setSelectedTags([])}
                onToggleOpen={() => {
                  setTagDropdownOpen(prev => !prev)
                  setTagSearch('')
                }}
              />
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs bg-clay-50 text-clay-600 border border-clay-200 px-2.5 py-1 rounded-full font-medium"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="hover:text-clay-800"
                    aria-label={`Verwijder tag ${tag}`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <p className="text-center text-stone-400 mt-12">Recepten laden…</p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && recipes.length === 0 && (
          <div className="text-center mt-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-stone-400 mb-6">Nog geen recepten — voeg je eerste toe!</p>
          </div>
        )}

        {!loading && !error && recipes.length > 0 && filteredRecipes.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-stone-400">Geen recepten gevonden voor je zoekopdracht</p>
            {hasActiveFilters && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedTags([]) }}
                className="mt-3 text-sm text-clay-500 hover:text-clay-600 underline"
              >
                Filters wissen
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredRecipes.length > 0 && (
          <div className="grid gap-3">
            {filteredRecipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </main>

      <Link
        to="/new"
        className="fixed bottom-8 right-5 bg-clay-500 hover:bg-clay-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
        aria-label="Recept toevoegen"
      >
        +
      </Link>
    </div>
  )
}
