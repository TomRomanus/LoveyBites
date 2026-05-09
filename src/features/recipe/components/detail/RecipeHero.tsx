import { ChevronLeft, MoreHorizontal } from 'lucide-react'

type RecipeHeroProps = {
  title: string
  onBack: () => void
  onActionsOpen: () => void
}

const RecipeHero = ({ title, onBack, onActionsOpen }: RecipeHeroProps) => (
  <div
    className="lb-color-block"
    style={
      {
        '--block-bg': 'var(--bordeaux)',
        minHeight: 185,
        padding: '24px 22px 24px',
        borderRadius: 0,
        justifyContent: 'flex-start',
      } as React.CSSProperties
    }
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button
        data-testid="recipe-back-btn"
        onClick={onBack}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          background: 'transparent',
          border: '0.5px solid rgba(255,250,240,0.45)',
          color: 'var(--cream-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        data-testid="recipe-actions-btn"
        onClick={onActionsOpen}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          background: 'transparent',
          border: '0.5px solid rgba(255,250,240,0.45)',
          color: 'var(--cream-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
    <div style={{ marginTop: 46 }}>
      <div className="lb-color-block-corner" style={{ marginBottom: 8 }}>
        RECEPT
      </div>
      <div
        className="lb-color-block-title"
        style={{ fontSize: 34, lineHeight: 1.0, letterSpacing: '-0.025em' }}
      >
        {title}
      </div>
    </div>
  </div>
)

export default RecipeHero
