import { MessageCircleHeart } from 'lucide-react'
import { formatStepIngredient } from '@/features/recipe/utils/ingredientUtils'
import type { FlattenedStep } from '@/features/recipe/utils/recipeDisplay'
import SectionHeader from '@/shared/components/SectionHeader'
import GroupLabel from '@/shared/components/GroupLabel'

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
                  {step.ingredientRefs.map((id) => {
                    const text = ingredientMap.get(id) ?? id
                    return formatStepIngredient(text, step.ingredientAmounts?.[id] ?? '')
                  }).join(' · ')}
                </div>
              )}
              <div className="text-[15px] text-ink leading-[1.55]">{step.text}</div>
              {step.comment && (
                <div data-comment className="mt-2 flex gap-[7px] items-start">
                  <MessageCircleHeart size={14} className="shrink-0 mt-[5px] text-[#9a6c2a] opacity-75" strokeWidth={2} />
                  <div className="flex-1 rounded-lg px-[10px] py-[7px] bg-[#9a6c2a]/10 text-[13px] leading-[1.5] text-ink-2">
                    {step.comment}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    })}
  </div>
)

export default RecipeSteps
