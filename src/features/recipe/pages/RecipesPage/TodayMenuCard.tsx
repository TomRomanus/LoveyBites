import { Link } from 'react-router-dom'
import { StarRating } from '@/features/recipe/components/StarRating'

type TodayMenuCardProps = {
  recipe: { id: string; title: string; description?: string; rating?: number }
}

const TodayMenuCard = ({ recipe }: TodayMenuCardProps) => (
  <Link to={`/recipe/${recipe.id}`} className="no-underline text-inherit block">
    <div className="lb-card overflow-hidden">
      <div className="h-[72px] bg-bordeaux flex items-end px-[14px] pb-3 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(80% 60% at 0% 100%, rgba(0,0,0,0.18), transparent 60%)',
          }}
        />
        <div className="font-serif italic text-[20px] font-medium text-[rgba(255,250,240,0.96)] leading-[1.05] tracking-[-0.02em] relative z-[1]">
          {recipe.title}
        </div>
      </div>
      <div className="px-[14px] pt-[10px] pb-3">
        {recipe.description && (
          <p className="m-0 text-[13px] text-ink-2 leading-[1.45] line-clamp-2">
            {recipe.description}
          </p>
        )}
        <div className="mt-2">
          <StarRating value={recipe.rating ?? 0} />
        </div>
      </div>
    </div>
  </Link>
)

export default TodayMenuCard
