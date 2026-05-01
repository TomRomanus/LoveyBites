import { Link } from 'react-router-dom'
import type { Recipe } from '../types/recipe'
import StarRating from './StarRating'

interface Props {
  recipe: Recipe
  onAddToCalendar?: (recipe: Recipe) => void
}

export default function RecipeCard({ recipe, onAddToCalendar }: Props) {
  return (
    <div className="relative group">
      <Link
        to={`/recipe/${recipe.id}`}
        className="block bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200"
      >
        <div className="p-5 pr-14">
          <h2 className="font-display text-lg font-semibold text-stone-900 mb-1 text-balance">{recipe.title}</h2>
          {recipe.description && (
            <p className="text-sm text-stone-500 line-clamp-2 mb-3">{recipe.description}</p>
          )}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-clay-50 text-clay-600 px-2.5 py-0.5 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {(recipe.rating ?? 0) > 0 && (
            <StarRating value={recipe.rating!} size="sm" />
          )}
        </div>
      </Link>

      {onAddToCalendar && (
        <button
          onClick={() => onAddToCalendar(recipe)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-stone-300 hover:text-clay-500 hover:bg-clay-50 transition-colors"
          aria-label="Toevoegen aan kalender"
          title="Toevoegen aan kalender"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}
    </div>
  )
}
