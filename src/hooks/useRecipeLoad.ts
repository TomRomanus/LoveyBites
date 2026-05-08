import { useState, useEffect } from 'react'
import { getRecipe } from '../services/recipes'
import type { Recipe } from '../types/recipe'

type RecipeLoadState = {
  recipe: Recipe | null
  loading: boolean
  error: string | null
}

const useRecipeLoad = (id: string | undefined): RecipeLoadState => {
  const [state, setState] = useState<RecipeLoadState>({ recipe: null, loading: true, error: null })

  useEffect(() => {
    if (!id) {
      setState({ recipe: null, loading: false, error: null })
      return
    }

    let cancelled = false

    const load = async (attempt = 0) => {
      try {
        const recipe = await getRecipe(id)
        if (!cancelled) setState({ recipe, loading: false, error: null })
      } catch (err) {
        if (cancelled) return
        if (attempt < 1) {
          setTimeout(() => load(attempt + 1), 500)
        } else {
          setState({ recipe: null, loading: false, error: err instanceof Error ? err.message : 'Laden mislukt' })
        }
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    load()
    return () => { cancelled = true }
  }, [id])

  return state
}

export default useRecipeLoad
