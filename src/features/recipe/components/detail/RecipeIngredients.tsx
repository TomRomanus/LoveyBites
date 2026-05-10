import PortionStepper from '@/features/recipe/components/PortionStepper'
import IngredientItem from './IngredientItem'

type RecipeIngredientsProps = {
  sections: { section: string | null; items: string[] }[]
  portions: number
  portionDir: 'up' | 'down' | null
  portionsLabel?: string
  onPortionChange: (v: number) => void
  checked: Set<string>
  onToggle: (key: string) => void
  deel?: string
}

const RecipeIngredients = ({
  sections,
  portions,
  portionDir,
  portionsLabel,
  onPortionChange,
  checked,
  onToggle,
  deel = 'I',
}: RecipeIngredientsProps) => (
  <div className="px-[22px] pt-7">
    <div className="flex items-start justify-between mb-[14px]">
      <div>
        <div className="lb-eyebrow">DEEL {deel}</div>
        <h2 className="mt-1 mb-0 text-[24px] font-serif italic font-medium tracking-[-0.02em] leading-[1.05]">
          Ingrediënten
        </h2>
      </div>
      <PortionStepper
        value={portions}
        onChange={onPortionChange}
        label={portionsLabel || 'pers'}
        dir={portionDir}
      />
    </div>

    {sections.map((sec, si) => (
      <div key={si} className="mb-4">
        {sec.section && (
          <>
            <div className="font-serif italic text-[14px] text-bordeaux mb-[3px] font-medium">
              {sec.section}
            </div>
            <div
              className="w-[22px] rounded-[1px] opacity-55 mb-2"
              style={{ height: 1.5, background: 'var(--bordeaux)' }}
            />
          </>
        )}
        <div className="flex flex-col gap-0.5">
          {sec.items.map((item, ii) => {
            const key = `${si}-${ii}`
            return (
              <IngredientItem
                key={ii}
                item={item}
                itemKey={key}
                portions={portions}
                portionDir={portionDir}
                checked={checked.has(key)}
                onToggle={onToggle}
              />
            )
          })}
        </div>
      </div>
    ))}
  </div>
)

export default RecipeIngredients
