import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { emptyInput, buildInitial, useRecipeForm } from '../useRecipeForm'
import * as ingredientUtils from '@/features/recipe/utils/ingredientUtils'
import type { RecipeInput } from '@/features/recipe/types/recipe'

vi.mock('@/features/recipe/utils/ingredientUtils', () => ({
  ensureIngredientIds: vi.fn((nodes: unknown[]) => nodes),
  pruneEmpty: vi.fn((nodes: unknown[]) => nodes),
  extractLeafTexts: vi.fn(() => []),
  collectIngredientMap: vi.fn(() => new Map()),
}))

// Mock react-hook-form to avoid loading the full library (prevents worker OOM)
let capturedSubmitHandler: ((data: RecipeInput) => Promise<void>) | null = null
const mockReset = vi.fn()
const mockHandleSubmit = vi.fn((fn: (data: RecipeInput) => Promise<void>) => {
  capturedSubmitHandler = fn
  return async (_e?: Event) => {
    if (capturedSubmitHandler) {
      await capturedSubmitHandler({
        title: 'Test',
        description: '',
        ingredients: [],
        steps: [],
        tags: [],
        imageUrl: '',
        createdBy: 'us',
      })
    }
  }
})

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    handleSubmit: mockHandleSubmit,
    control: {},
    reset: mockReset,
    formState: { errors: {} },
  })),
  useWatch: vi.fn(() => []),
}))

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => async (data: unknown) => ({ values: data, errors: {} })),
}))

describe('emptyInput', () => {
  it('returns portionsLabel as "pers"', () => {
    expect(emptyInput().portionsLabel).toBe('pers')
  })

  it('returns createdBy as "us"', () => {
    expect(emptyInput().createdBy).toBe('us')
  })

  it('returns portions as 4', () => {
    expect(emptyInput().portions).toBe(4)
  })

  it('returns an empty title', () => {
    expect(emptyInput().title).toBe('')
  })

  it('returns a single leaf ingredient node', () => {
    const { ingredients } = emptyInput()
    expect(ingredients).toHaveLength(1)
    expect(ingredients[0].kind).toBe('leaf')
  })

  it('returns two step groups (Voorbereiding and Bereiding)', () => {
    const { steps } = emptyInput()
    expect(steps).toHaveLength(2)
    expect(steps[0]).toMatchObject({ kind: 'group', title: 'Voorbereiding' })
    expect(steps[1]).toMatchObject({ kind: 'group', title: 'Bereiding' })
  })

  it('returns empty sources and tags', () => {
    const { sources, tags } = emptyInput()
    expect(sources).toEqual([])
    expect(tags).toEqual([])
  })
})

describe('buildInitial', () => {
  beforeEach(() => vi.clearAllMocks())

  it('falls back to emptyInput defaults when called with undefined', () => {
    const result = buildInitial(undefined)
    expect(result.portionsLabel).toBe('pers')
    expect(result.createdBy).toBe('us')
    expect(result.portions).toBe(4)
  })

  it('merges provided title with defaults', () => {
    const result = buildInitial({ title: 'Stamppot' })
    expect(result.title).toBe('Stamppot')
    expect(result.portionsLabel).toBe('pers')
  })

  it('calls ensureIngredientIds on ingredients', () => {
    buildInitial({ title: 'Test' })
    expect(ingredientUtils.ensureIngredientIds).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ kind: 'leaf' })]),
    )
  })

  it('calls ensureIngredientIds on steps', () => {
    buildInitial(undefined)
    expect(ingredientUtils.ensureIngredientIds).toHaveBeenCalledTimes(2)
  })

  it('preserves provided ingredients over defaults', () => {
    const customIngredients = [{ kind: 'leaf' as const, text: 'ui', id: 'abc' }]
    const result = buildInitial({ title: 'Test', ingredients: customIngredients })
    expect(result.ingredients[0].kind).toBe('leaf')
    if (result.ingredients[0].kind === 'leaf') {
      expect(result.ingredients[0].text).toBe('ui')
    }
  })
})

describe('useRecipeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedSubmitHandler = null
  })

  it('returns form, ingredientOptions, errorMessage, onSubmit, and onTitleChange', () => {
    const { result } = renderHook(() =>
      useRecipeForm({ onSubmit: vi.fn().mockResolvedValue(undefined) }),
    )
    expect(result.current.form).toBeDefined()
    expect(result.current.ingredientOptions).toBeDefined()
    expect(result.current.onSubmit).toBeDefined()
    expect(result.current.onTitleChange).toBeUndefined()
    expect(result.current.errorMessage).toBeUndefined()
  })

  it('passes onTitleChange through to the return value', () => {
    const onTitleChange = vi.fn()
    const { result } = renderHook(() =>
      useRecipeForm({ onSubmit: vi.fn().mockResolvedValue(undefined), onTitleChange }),
    )
    expect(result.current.onTitleChange).toBe(onTitleChange)
  })

  it('ingredientOptions starts empty because default ingredient text is blank', () => {
    const { result } = renderHook(() =>
      useRecipeForm({ onSubmit: vi.fn().mockResolvedValue(undefined) }),
    )
    expect(result.current.ingredientOptions).toHaveLength(0)
  })

  it('errorMessage is undefined in the initial state', () => {
    const { result } = renderHook(() =>
      useRecipeForm({ onSubmit: vi.fn().mockResolvedValue(undefined) }),
    )
    expect(result.current.errorMessage).toBeUndefined()
  })

  it('calls onSavingChange(true) before calling the submit function', async () => {
    const callOrder: string[] = []
    const onSavingChange = vi.fn(() => callOrder.push('saving'))
    const onSubmitFn = vi.fn(async () => {
      callOrder.push('submit')
    })

    const { result } = renderHook(() =>
      useRecipeForm({
        initial: {
          title: 'Hutspot',
          ingredients: [],
          steps: [],
          tags: [],
          imageUrl: '',
          createdBy: 'us',
          description: '',
        },
        onSubmit: onSubmitFn,
        onSavingChange,
      }),
    )

    await act(async () => {
      await result.current.onSubmit(new Event('submit') as any)
    })

    expect(callOrder).toEqual(['saving', 'submit'])
    expect(onSavingChange).toHaveBeenCalledWith(true)
  })

  it('sets Dutch errorMessage when onSubmit throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSavingChange = vi.fn()
    const onSubmitFn = vi.fn().mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() =>
      useRecipeForm({
        initial: {
          title: 'Hutspot',
          ingredients: [],
          steps: [],
          tags: [],
          imageUrl: '',
          createdBy: 'us',
          description: '',
        },
        onSubmit: onSubmitFn,
        onSavingChange,
      }),
    )

    await act(async () => {
      await result.current.onSubmit(new Event('submit') as any)
    })

    expect(result.current.errorMessage).toBe('Recept opslaan mislukt. Probeer opnieuw.')
    expect(onSavingChange).toHaveBeenCalledWith(false)
    consoleSpy.mockRestore()
  })
})
