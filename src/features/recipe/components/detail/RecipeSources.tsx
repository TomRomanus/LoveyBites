import { Link } from 'lucide-react'
import SectionHeader from '@/shared/components/SectionHeader'

type RecipeSourcesProps = {
  sources: { url: string; label?: string }[]
  deel?: string
}

const RecipeSources = ({ sources, deel = 'III' }: RecipeSourcesProps) => (
  <div className="px-[22px] pt-7">
    <SectionHeader eyebrow={`DEEL ${deel}`} title="Bronnen" />
    <div>
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            const isStandalone =
              (window.navigator as { standalone?: boolean }).standalone === true ||
              window.matchMedia('(display-mode: standalone)').matches
            if (isStandalone) {
              e.preventDefault()
              window.location.href = s.url
            }
          }}
          className="flex items-center gap-[10px] py-[10px] text-ink no-underline border-b-[0.5px] border-ink/14"
        >
          <Link size={16} strokeWidth={1.6} color="var(--bordeaux)" />
          <span className="text-[14px] italic font-serif text-bordeaux">{s.label || s.url}</span>
        </a>
      ))}
    </div>
  </div>
)

export default RecipeSources
