import { useQuery } from '@tanstack/react-query'
import { getRecipe } from '../services/recipes'
import { recipeKeys } from '../services/queryKeys'
import type { Recipe } from '../types/recipe'

const useRecipeLoad = (id: string | undefined) =>
  useQuery<Recipe | null>({
    queryKey: recipeKeys.detail(id ?? ''),
    queryFn: () => getRecipe(id!),
    enabled: !!id,
  })

export default useRecipeLoad
