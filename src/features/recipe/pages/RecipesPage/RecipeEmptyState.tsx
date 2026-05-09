import { Plus } from 'lucide-react'

type RecipeEmptyStateProps = {
  hasFilters: boolean
  onClearFilters: () => void
  onAddFirst: () => void
}

const RecipeEmptyState = ({ hasFilters, onClearFilters, onAddFirst }: RecipeEmptyStateProps) => (
  <div style={{ padding: '60px 32px', textAlign: 'center' }}>
    <div
      style={{
        fontSize: 48,
        marginBottom: 12,
        fontFamily: 'var(--serif)',
        fontStyle: 'italic',
        color: 'var(--bordeaux)',
      }}
    >
      ·
    </div>
    <h2 className="lb-display" style={{ margin: 0, fontSize: 26 }}>
      {hasFilters ? 'Niets gevonden' : 'Je boek is nog leeg'}
    </h2>
    <p style={{ margin: '10px 0 24px', color: 'var(--stone)', fontSize: 14, lineHeight: 1.5 }}>
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
