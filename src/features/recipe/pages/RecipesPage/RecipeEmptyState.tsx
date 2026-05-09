import { Plus } from 'lucide-react'

type RecipeEmptyStateProps = {
  hasFilters: boolean
  onClearFilters: () => void
  onAddFirst: () => void
}

const RecipeEmptyState = ({ hasFilters, onClearFilters, onAddFirst }: RecipeEmptyStateProps) => (
  <div className="px-8 pt-[60px] text-center">
    {!hasFilters && <div className="text-[48px] mb-3 font-serif italic text-bordeaux">·</div>}
    <h2 className="lb-display m-0 text-[26px]">
      {hasFilters ? 'Niets gevonden' : 'Je boek is nog leeg'}
    </h2>
    <p className="mt-[10px] mb-6 text-stone text-[14px] leading-[1.5]">
      {hasFilters
        ? 'Probeer andere woorden of wis de filters.'
        : 'Begin met het bewaren van je eerste favoriete recept.'}
    </p>
    {hasFilters ? (
      <button onClick={onClearFilters} className="lb-btn lb-btn--ghost">
        Filters wissen
      </button>
    ) : (
      <button onClick={onAddFirst} className="lb-btn lb-btn--primary">
        <Plus size={16} />
        Eerste recept toevoegen
      </button>
    )}
  </div>
)

export default RecipeEmptyState
