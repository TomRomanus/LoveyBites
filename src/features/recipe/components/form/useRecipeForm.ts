import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { RecipeInput, IngredientNode } from '@/features/recipe/types/recipe'
import { recipeInputSchema } from '@/features/recipe/types/recipe'
import { pruneEmpty, ensureIngredientIds } from '@/features/recipe/utils/ingredientUtils'

type UseRecipeFormProps = {
  initial?: Partial<RecipeInput>
  onSubmit: (data: RecipeInput) => Promise<void>
  onSavingChange?: (saving: boolean) => void
  onTitleChange?: (hasTitle: boolean) => void
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
  portionsLabel: 'pers',
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
  notes: [],
  equipment: [],
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

export const useRecipeForm = ({
  initial,
  onSubmit: onSubmitProp,
  onSavingChange,
  onTitleChange,
}: UseRecipeFormProps) => {
  const [error, setError] = useState<string | undefined>(undefined)

  const form = useForm<RecipeInput>({
    resolver: zodResolver(recipeInputSchema) as Resolver<RecipeInput>,
    defaultValues: buildInitial(initial),
  })

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form

  useEffect(() => {
    if (initial !== undefined) reset(buildInitial(initial))
  }, [initial, reset])

  const ingredients = useWatch({ control, name: 'ingredients' })
  const ingredientOptions = useMemo(() => collectIngredientOptions(ingredients), [ingredients])

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)
    const cleaned: RecipeInput = {
      ...data,
      ingredients: pruneEmpty(data.ingredients),
      steps: pruneEmpty(data.steps),
      sources: (data.sources ?? []).filter((s) => s.url.trim()),
      notes: (data.notes ?? []).filter((n) => n.text.trim()),
      equipment: (data.equipment ?? []).filter((b) => b.trim()),
    }
    onSavingChange?.(true)
    try {
      await onSubmitProp(cleaned)
    } catch (e) {
      console.error('Recipe save failed:', e)
      setError('Recept opslaan mislukt. Probeer opnieuw.')
      onSavingChange?.(false)
    }
  })

  const errorMessage = errors.title?.message ?? error

  return {
    form,
    ingredientOptions,
    errorMessage,
    onSubmit,
    onTitleChange,
  }
}
