import { useQuery } from '@tanstack/react-query'
import { getRecipe } from '@/features/recipe/api/recipes'
import { recipeKeys } from '@/features/recipe/api/queryKeys'
import type { Recipe } from '@/features/recipe/types/recipe'

const useRecipeLoad = (id: string | undefined, options?: { refetchOnWindowFocus?: boolean }) =>
  useQuery<Recipe | null>({
    queryKey: recipeKeys.detail(id ?? ''),
    queryFn: () => getRecipe(id!),
    enabled: !!id,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
  })

export default useRecipeLoad
