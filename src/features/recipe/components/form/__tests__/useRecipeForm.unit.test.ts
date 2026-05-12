import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useRecipeForm } from '../useRecipeForm'
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

  it('filters out empty equipment strings before calling onSubmit', async () => {
    const onSubmitFn = vi.fn().mockResolvedValue(undefined)
    renderHook(() => useRecipeForm({ onSubmit: onSubmitFn }))

    await act(async () => {
      await capturedSubmitHandler!({
        title: 'Test',
        description: '',
        ingredients: [],
        steps: [],
        tags: [],
        imageUrl: '',
        createdBy: 'us',
        equipment: ['Grote kom', '', '  ', 'Garde'],
      })
    })

    expect(onSubmitFn).toHaveBeenCalledWith(
      expect.objectContaining({ equipment: ['Grote kom', 'Garde'] }),
    )
  })

  it('filters out notes with empty text before calling onSubmit', async () => {
    const onSubmitFn = vi.fn().mockResolvedValue(undefined)
    renderHook(() => useRecipeForm({ onSubmit: onSubmitFn }))

    await act(async () => {
      await capturedSubmitHandler!({
        title: 'Test',
        description: '',
        ingredients: [],
        steps: [],
        tags: [],
        imageUrl: '',
        createdBy: 'us',
        notes: [
          { label: 'Bewaren', text: 'Tot 3 dagen.' },
          { label: '', text: '' },
          { label: 'Opwarmen', text: '' },
        ],
      })
    })

    expect(onSubmitFn).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: [{ label: 'Bewaren', text: 'Tot 3 dagen.' }],
      }),
    )
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
