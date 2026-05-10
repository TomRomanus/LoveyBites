import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useRecipeFilter from '../useRecipeFilter'
import type { Recipe } from '@/features/recipe/types/recipe'

const makeRecipe = (overrides: Partial<Recipe>): Recipe => ({
  id: 'r1',
  title: 'Test',
  description: '',
  ingredients: [],
  steps: [],
  tags: [],
  imageUrl: '',
  createdAt: null as any,
  updatedAt: null as any,
  createdBy: 'us',
  ...overrides,
})

describe('useRecipeFilter', () => {
  describe('allTags', () => {
    it('deduplicates tags across recipes and sorts them alphabetically', () => {
      const recipes = [
        makeRecipe({ id: 'r1', tags: ['soep', 'italiaans'] }),
        makeRecipe({ id: 'r2', tags: ['italiaans', 'pasta'] }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      expect(result.current.allTags).toEqual(['italiaans', 'pasta', 'soep'])
    })
  })

  describe('sorted (default sort)', () => {
    it('sorts recipes by name ascending by default', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'Zuurkool' }),
        makeRecipe({ id: 'r2', title: 'Appeltaart' }),
        makeRecipe({ id: 'r3', title: 'Boerenkool' }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      expect(result.current.sorted.map((r) => r.title)).toEqual(['Appeltaart', 'Boerenkool', 'Zuurkool'])
    })
  })

  describe('setSearchQuery', () => {
    it('filters by title match (case insensitive)', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'Appeltaart' }),
        makeRecipe({ id: 'r2', title: 'Boerenkool' }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      act(() => result.current.setSearchQuery('appel'))
      expect(result.current.sorted).toHaveLength(1)
      expect(result.current.sorted[0].id).toBe('r1')
    })

    it('filters by description match', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'Gerecht A', description: 'Lekker met kaas' }),
        makeRecipe({ id: 'r2', title: 'Gerecht B', description: 'Zonder vlees' }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      act(() => result.current.setSearchQuery('kaas'))
      expect(result.current.sorted).toHaveLength(1)
      expect(result.current.sorted[0].id).toBe('r1')
    })

    it('filters by ingredient leaf text', () => {
      const recipes = [
        makeRecipe({
          id: 'r1',
          title: 'Pasta',
          ingredients: [{ kind: 'leaf', text: '200 g mozzarella' }],
        }),
        makeRecipe({
          id: 'r2',
          title: 'Salade',
          ingredients: [{ kind: 'leaf', text: '1 komkommer' }],
        }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      act(() => result.current.setSearchQuery('mozzarella'))
      expect(result.current.sorted).toHaveLength(1)
      expect(result.current.sorted[0].id).toBe('r1')
    })

    it('returns all recipes when search query is empty', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'Appeltaart' }),
        makeRecipe({ id: 'r2', title: 'Boerenkool' }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      act(() => result.current.setSearchQuery(''))
      expect(result.current.sorted).toHaveLength(2)
    })
  })

  describe('setActiveTags', () => {
    it('filters to only recipes that include the active tag', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'Appeltaart', tags: ['zoet'] }),
        makeRecipe({ id: 'r2', title: 'Pasta', tags: ['italiaans'] }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      act(() => result.current.setActiveTags(['italiaans']))
      expect(result.current.sorted).toHaveLength(1)
      expect(result.current.sorted[0].id).toBe('r2')
    })

    it('requires a recipe to have ALL active tags', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'Pasta', tags: ['italiaans', 'pasta'] }),
        makeRecipe({ id: 'r2', title: 'Pizza', tags: ['italiaans'] }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      act(() => result.current.setActiveTags(['italiaans', 'pasta']))
      expect(result.current.sorted).toHaveLength(1)
      expect(result.current.sorted[0].id).toBe('r1')
    })
  })

  describe('clearFilters', () => {
    it('resets search query and active tags', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'Appeltaart', tags: ['zoet'] }),
        makeRecipe({ id: 'r2', title: 'Pasta', tags: ['italiaans'] }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      act(() => {
        result.current.setSearchQuery('appel')
        result.current.setActiveTags(['zoet'])
      })
      expect(result.current.sorted).toHaveLength(1)
      act(() => result.current.clearFilters())
      expect(result.current.searchQuery).toBe('')
      expect(result.current.activeTags).toEqual([])
      expect(result.current.sorted).toHaveLength(2)
    })
  })

  describe('sort options', () => {
    it('sort "name-desc" reverses the alphabetical order', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'Appeltaart' }),
        makeRecipe({ id: 'r2', title: 'Boerenkool' }),
        makeRecipe({ id: 'r3', title: 'Zuurkool' }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      act(() => result.current.setSort('name-desc'))
      expect(result.current.sorted.map((r) => r.title)).toEqual(['Zuurkool', 'Boerenkool', 'Appeltaart'])
    })

    it('sort "rating-desc" puts highest rated recipes first', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'A', rating: 2 }),
        makeRecipe({ id: 'r2', title: 'B', rating: 5 }),
        makeRecipe({ id: 'r3', title: 'C', rating: 3 }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      act(() => result.current.setSort('rating-desc'))
      expect(result.current.sorted.map((r) => r.rating)).toEqual([5, 3, 2])
    })

    it('sort "rating-asc" puts lowest rated recipes first', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'A', rating: 2 }),
        makeRecipe({ id: 'r2', title: 'B', rating: 5 }),
        makeRecipe({ id: 'r3', title: 'C', rating: 3 }),
      ]
      const { result } = renderHook(() => useRecipeFilter(recipes))
      act(() => result.current.setSort('rating-asc'))
      expect(result.current.sorted.map((r) => r.rating)).toEqual([2, 3, 5])
    })
  })
})
