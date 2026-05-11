import { formatStepIngredient } from '@/features/recipe/utils/ingredientUtils'
import BordeauxBar from '@/shared/components/BordeauxBar'

type RecipeStepsProps = {
  steps: { phase?: string; text: string; ingredientRefs?: string[]; ingredientAmounts?: Record<string, string> }[]
  ingredientMap: Map<string, string>
  deel?: string
}

const RecipeSteps = ({ steps, ingredientMap, deel = 'II' }: RecipeStepsProps) => (
  <div className="px-[22px] pt-7">
    <div className="lb-eyebrow">DEEL {deel}</div>
    <h2 className="mt-1 mb-4 text-[24px] font-serif italic font-medium tracking-[-0.02em] leading-[1.05]">
      Instructies
    </h2>
    {steps.map((step, i) => {
      const showPhase = step.phase !== (steps[i - 1]?.phase ?? '')
      return (
        <div key={i}>
          {showPhase && step.phase && (
            <>
              <div
                className={`font-serif italic text-[14px] text-bordeaux mb-[3px] font-medium ${i > 0 ? 'mt-5' : 'mt-0'}`}
              >
                {step.phase}
              </div>
              <BordeauxBar className="w-[22px] opacity-55 mb-2" />
            </>
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
            </div>
          </div>
        </div>
      )
    })}
  </div>
)

export default RecipeSteps
