import PortionStepper from '@/features/recipe/components/PortionStepper'
import IngredientRow from '@/shared/components/IngredientRow'
import GroupLabel from '@/shared/components/GroupLabel'

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
          <div className="mb-2">
            <GroupLabel>{sec.section}</GroupLabel>
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          {sec.items.map((item, ii) => {
            const key = `${si}-${ii}`
            return (
              <IngredientRow
                key={ii}
                text={item}
                isChecked={checked.has(key)}
                portionKey={portions}
                portionDir={portionDir}
                onToggle={() => onToggle(key)}
              />
            )
          })}
        </div>
      </div>
    ))}
  </div>
)

export default RecipeIngredients
