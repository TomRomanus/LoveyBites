import { Link } from 'react-router-dom'
import type { Recipe } from '../types/recipe'
import StarRating from './StarRating'

interface Props {
  recipe: Recipe
}

export default function RecipeCard({ recipe }: Props) {
  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="block bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200 overflow-hidden"
    >
      <div className="p-5">
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-1 truncate">{recipe.title}</h2>
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
  )
}
