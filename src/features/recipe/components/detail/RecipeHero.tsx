import { ChevronLeft, MoreHorizontal } from 'lucide-react'
import IconButton from '@/shared/components/IconButton'

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
      <IconButton
        data-testid="recipe-back-btn"
        onClick={onBack}
        className="bg-transparent border-[0.5px] border-[rgba(255,250,240,0.45)] text-cream"
      >
        <ChevronLeft size={16} />
      </IconButton>
      <IconButton
        data-testid="recipe-actions-btn"
        onClick={onActionsOpen}
        className="bg-transparent border-[0.5px] border-[rgba(255,250,240,0.45)] text-cream"
      >
        <MoreHorizontal size={16} />
      </IconButton>
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
