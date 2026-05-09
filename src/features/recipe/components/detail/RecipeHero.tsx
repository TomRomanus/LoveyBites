import { ChevronLeft, MoreHorizontal } from 'lucide-react'

type RecipeHeroProps = {
  title: string
  onBack: () => void
  onActionsOpen: () => void
}

const RecipeHero = ({ title, onBack, onActionsOpen }: RecipeHeroProps) => (
  <div
    className="lb-color-block min-h-[185px] px-[22px] py-6 rounded-none justify-start"
    style={{ '--block-bg': 'var(--bordeaux)' } as React.CSSProperties}
  >
    <div className="flex items-center justify-between">
      <button
        data-testid="recipe-back-btn"
        onClick={onBack}
        className="w-10 h-10 rounded-[20px] bg-transparent border-[0.5px] border-[rgba(255,250,240,0.45)] text-cream flex items-center justify-center cursor-pointer"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        data-testid="recipe-actions-btn"
        onClick={onActionsOpen}
        className="w-10 h-10 rounded-[20px] bg-transparent border-[0.5px] border-[rgba(255,250,240,0.45)] text-cream flex items-center justify-center cursor-pointer"
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
    <div className="mt-[46px]">
      <div className="lb-color-block-corner mb-2">RECEPT</div>
      <div className="lb-color-block-title text-[34px] leading-[1.0] tracking-[-0.025em]">
        {title}
      </div>
    </div>
  </div>
)

export default RecipeHero
