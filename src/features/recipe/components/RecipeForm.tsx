import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { RecipeInput, IngredientNode } from '@/features/recipe/types/recipe'
import { recipeInputSchema } from '@/features/recipe/types/recipe'
import RecipeNodeEditor from '@/features/recipe/components/editor/RecipeNodeEditor'
import { pruneEmpty, ensureIngredientIds } from '@/features/recipe/utils/ingredientUtils'
import RecipeSourceEditor from '@/features/recipe/components/RecipeSourceEditor'
import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'
import FormField from '@/features/recipe/components/form/FormField'
import TagsEditor from '@/features/recipe/components/form/TagsEditor'
import PortionsField from '@/features/recipe/components/form/PortionsField'
import ReorderFab from '@/features/recipe/components/form/ReorderFab'

type Props = {
  initial?: Partial<RecipeInput>
  onSubmit: (data: RecipeInput) => Promise<void>
  onSavingChange?: (saving: boolean) => void
  onTitleChange?: (hasTitle: boolean) => void
  existingTags?: string[]
}

const collectIngredientOptions = (nodes: IngredientNode[]): Array<{ id: string; text: string }> => {
  const options: Array<{ id: string; text: string }> = []
  for (const node of nodes) {
    if (node.kind === 'leaf' && node.id && node.text.trim()) {
      options.push({ id: node.id, text: node.text.trim() })
    } else if (node.kind === 'group') {
      options.push(...collectIngredientOptions(node.children))
    }
  }
  return options
}

const emptyInput = (): RecipeInput => ({
  title: '',
  description: '',
  portions: 4,
  ingredients: [{ kind: 'leaf', text: '', id: crypto.randomUUID() }],
  steps: [
    {
      kind: 'group',
      title: 'Voorbereiding',
      id: crypto.randomUUID(),
      children: [{ kind: 'leaf', text: '', id: crypto.randomUUID() }],
    },
    {
      kind: 'group',
      title: 'Bereiding',
      id: crypto.randomUUID(),
      children: [{ kind: 'leaf', text: '', id: crypto.randomUUID() }],
    },
  ],
  sources: [],
  tags: [],
  imageUrl: '',
  createdBy: 'us',
})

const buildInitial = (initial?: Partial<RecipeInput>): RecipeInput => {
  const base = { ...emptyInput(), ...initial }
  return {
    ...base,
    ingredients: ensureIngredientIds(base.ingredients),
    steps: ensureIngredientIds(base.steps),
  }
}

const stepLabels = {
  leafPlaceholder: 'bijv. Verwarm de oven voor op 180°C',
  groupPlaceholder: 'Sectienaam (bijv. Voorbereiding)',
  addLeafInGroup: 'stap in sectie',
  addLeaf: 'stap toevoegen',
  addGroup: 'sectie toevoegen',
}

const RecipeForm = ({
  initial,
  onSubmit: onSubmitProp,
  onSavingChange,
  onTitleChange,
  existingTags,
}: Props) => {
  const [error, setError] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RecipeInput>({
    resolver: zodResolver(recipeInputSchema) as Resolver<RecipeInput>,
    defaultValues: buildInitial(initial),
  })

  useEffect(() => {
    if (initial !== undefined) reset(buildInitial(initial))
  }, [initial, reset])

  const portionsValue = useWatch({ control, name: 'portions' }) ?? 4
  const portionsLabel = useWatch({ control, name: 'portionsLabel' })
  const ingredients = useWatch({ control, name: 'ingredients' })

  const ingredientOptions = useMemo(() => collectIngredientOptions(ingredients), [ingredients])

  const onSubmit = handleSubmit(async (data) => {
    setError(null)
    const cleaned: RecipeInput = {
      ...data,
      ingredients: pruneEmpty(data.ingredients),
      steps: pruneEmpty(data.steps),
      sources: (data.sources ?? []).filter((s) => s.url.trim()),
    }
    onSavingChange?.(true)
    try {
      await onSubmitProp(cleaned)
    } catch {
      setError('Recept opslaan mislukt. Probeer opnieuw.')
      onSavingChange?.(false)
    }
  })

  const errorMessage = errors.title?.message ?? error

  return (
    <form id="recipe-form" onSubmit={onSubmit} className="flex flex-col gap-3.5 pt-2">
      <div className="border-[0.5px] border-ink/14 rounded-[13px] p-4">
        <FormField label="Titel" required>
          <input
            className="lb-input"
            type="text"
            placeholder="Wat gaan we maken?"
            {...register('title', {
              onChange: (e) => onTitleChange?.(e.target.value.trim().length > 0),
            })}
          />
        </FormField>
        <div className="h-3.5" />
        <FormField label="Beschrijving">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <AutoGrowTextarea
                {...field}
                rows={2}
                className="w-full bg-paper-2 border-0 rounded-md px-3.5 py-3 font-sans text-[15px] text-ink outline-none resize-none leading-[1.45]"
                placeholder="Beschrijf het gerecht"
              />
            )}
          />
        </FormField>
        <div className="h-3.5" />
        <PortionsField
          value={portionsValue}
          onChange={(v) => setValue('portions', v)}
          label={portionsLabel}
          onLabelChange={(l) => setValue('portionsLabel', l)}
        />
      </div>

      <div className="border-[0.5px] border-ink/14 rounded-[13px] p-4">
        <div className="lb-eyebrow mb-3">INGREDIËNTEN</div>
        <Controller
          name="ingredients"
          control={control}
          render={({ field }) => (
            <RecipeNodeEditor
              nodes={field.value}
              onChange={(v) => field.onChange(ensureIngredientIds(v))}
              commonSections={['Deeg', 'Vulling', 'Marinade', 'Coating', 'Saus', 'Glazuur']}
              reordering={isReordering}
            />
          )}
        />
      </div>

      <div className="border-[0.5px] border-ink/14 rounded-[13px] p-4">
        <div className="lb-eyebrow mb-3">INSTRUCTIES</div>
        <Controller
          name="steps"
          control={control}
          render={({ field }) => (
            <RecipeNodeEditor
              nodes={field.value}
              onChange={(v) => field.onChange(ensureIngredientIds(v))}
              labels={stepLabels}
              commonSections={['Voorbereiding', 'Bereiding', 'Assembleren']}
              ingredientOptions={ingredientOptions}
              ordered
              reordering={isReordering}
            />
          )}
        />
      </div>

      <div className="border-[0.5px] border-ink/14 rounded-[13px] p-4">
        <FormField label="Tags">
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TagsEditor
                tags={field.value ?? []}
                onChange={field.onChange}
                existingTags={existingTags}
              />
            )}
          />
        </FormField>
        <div className="h-[18px]" />
        <FormField label="Bronnen">
          <Controller
            name="sources"
            control={control}
            render={({ field }) => (
              <RecipeSourceEditor sources={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </FormField>
      </div>

      {errorMessage && (
        <div className="bg-bordeaux-tint text-bordeaux py-2.5 px-3.5 rounded-[0_12px_12px_0] text-[13px] font-medium border-l-[3px] border-l-bordeaux">
          {errorMessage}
        </div>
      )}

      <ReorderFab active={isReordering} onToggle={() => setIsReordering((r) => !r)} />
    </form>
  )
}

export default RecipeForm
