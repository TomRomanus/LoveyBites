import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Check, ArrowUpDown } from 'lucide-react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import type { RecipeInput, IngredientNode } from '@/features/recipe/types/recipe'
import { recipeInputSchema } from '@/features/recipe/types/recipe'
import RecipeNodeEditor from '@/features/recipe/components/editor/RecipeNodeEditor'
import { pruneEmpty, ensureIngredientIds } from '@/features/recipe/utils/ingredientUtils'
import RecipeSourceEditor from '@/features/recipe/components/RecipeSourceEditor'
import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'
import FormField from '@/features/recipe/components/form/FormField'
import TagsEditor from '@/features/recipe/components/form/TagsEditor'
import PortionsField from '@/features/recipe/components/form/PortionsField'

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

const sectionCard: React.CSSProperties = {
  border: '0.5px solid rgba(31,29,26,0.14)',
  borderRadius: 13,
  padding: '16px 16px',
  background: 'transparent',
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
    resolver: zodResolver(recipeInputSchema),
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
    <form
      id="recipe-form"
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}
    >
      {/* Basic info */}
      <div style={sectionCard}>
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
        <div style={{ height: 14 }} />
        <FormField label="Beschrijving">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <AutoGrowTextarea
                {...field}
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--paper-2)',
                  border: 0,
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontFamily: 'var(--sans)',
                  fontSize: 15,
                  color: 'var(--ink)',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.45,
                }}
                placeholder="Beschrijf het gerecht"
              />
            )}
          />
        </FormField>
        <div style={{ height: 14 }} />
        <PortionsField
          value={portionsValue}
          onChange={(v) => setValue('portions', v)}
          label={portionsLabel}
          onLabelChange={(l) => setValue('portionsLabel', l)}
        />
      </div>

      {/* Ingredients */}
      <div style={sectionCard}>
        <div className="lb-eyebrow" style={{ marginBottom: 12 }}>
          INGREDIËNTEN
        </div>
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

      {/* Steps */}
      <div style={sectionCard}>
        <div className="lb-eyebrow" style={{ marginBottom: 12 }}>
          INSTRUCTIES
        </div>
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
              leafMultiline
              ordered
              reordering={isReordering}
            />
          )}
        />
      </div>

      {/* Tags + Sources */}
      <div style={sectionCard}>
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
        <div style={{ height: 18 }} />
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
        <div
          style={{
            background: 'var(--bordeaux-tint)',
            color: 'var(--bordeaux)',
            padding: '10px 14px',
            borderRadius: '0 12px 12px 0',
            fontSize: 13,
            fontWeight: 500,
            borderLeft: '3px solid var(--bordeaux)',
          }}
        >
          {errorMessage}
        </div>
      )}

      {createPortal(
        <button
          type="button"
          onClick={() => setIsReordering((r) => !r)}
          aria-label={isReordering ? 'Klaar met sorteren' : 'Volgorde aanpassen'}
          style={{
            position: 'fixed',
            bottom: 'max(28px, env(safe-area-inset-bottom))',
            right: 22,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: isReordering ? 'var(--bordeaux-tint)' : 'var(--cream-card)',
            border: isReordering
              ? '0.5px solid rgba(107,31,42,0.22)'
              : '0.5px solid rgba(31,29,26,0.18)',
            boxShadow: isReordering
              ? '0 1px 4px rgba(107,31,42,0.10)'
              : '0 1px 4px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 90,
            transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
          }}
        >
          {isReordering ? (
            <Check size={16} strokeWidth={2.5} color="var(--bordeaux)" />
          ) : (
            <ArrowUpDown size={16} strokeWidth={2.1} color="var(--stone)" />
          )}
        </button>,
        document.body,
      )}
    </form>
  )
}

export default RecipeForm
