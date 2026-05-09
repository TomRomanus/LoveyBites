export const recipeKeys = {
  all: ['recipes'] as const,
  list: () => [...recipeKeys.all, 'list'] as const,
  detail: (id: string) => [...recipeKeys.all, 'detail', id] as const,
}
