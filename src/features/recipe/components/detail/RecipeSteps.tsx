import { formatStepIngredient } from '@/features/recipe/utils/ingredientUtils'
import type { FlattenedStep } from '@/features/recipe/utils/recipeDisplay'
import SectionHeader from '@/shared/components/SectionHeader'
import GroupLabel from '@/shared/components/GroupLabel'
import StepComment from '@/shared/components/StepComment'

type RecipeStepsProps = {
  steps: FlattenedStep[]
  ingredientMap: Map<string, string>
  deel?: string
}

const RecipeSteps = ({ steps, ingredientMap, deel = 'II' }: RecipeStepsProps) => (
  <div className="px-[22px] pt-7">
    <SectionHeader eyebrow={`DEEL ${deel}`} title="Instructies" />
    {steps.map((step, i) => {
      const showPhase = step.phase !== (steps[i - 1]?.phase ?? '')
      return (
        <div key={i}>
          {showPhase && step.phase && (
            <div className={`mb-2${i > 0 ? ' mt-5' : ''}`}>
              <GroupLabel>{step.phase}</GroupLabel>
            </div>
          )}
          <div className="flex gap-[20px] py-2 border-b-[0.5px] border-ink/14">
            <div className="font-serif italic text-[22px] text-bordeaux font-medium w-[22px] shrink-0 leading-[1.1] pt-[1px] text-right">
              {i + 1}
            </div>
            <div className="flex-1">
              {step.ingredientRefs && step.ingredientRefs.length > 0 && (
                <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-bordeaux/55 mb-[5px]">
                  {step.ingredientRefs
                    .map((id) => {
                      const text = ingredientMap.get(id) ?? id
                      return formatStepIngredient(text, step.ingredientAmounts?.[id] ?? '')
                    })
                    .join(' · ')}
                </div>
              )}
              <div className="text-[15px] text-ink leading-[1.55]">{step.text}</div>
              {step.comment && <StepComment comment={step.comment} className="mt-2" />}
            </div>
          </div>
        </div>
      )
    })}
  </div>
)

export default RecipeSteps
