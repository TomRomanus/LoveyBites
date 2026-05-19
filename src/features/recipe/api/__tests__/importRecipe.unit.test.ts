import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { importRecipeFromImage } from '@/features/recipe/api/importRecipe'
import { uploadSourceImage } from '@/features/recipe/api/imageStorage'

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}))

vi.mock('@/features/recipe/api/imageStorage', () => ({
  uploadSourceImage: vi.fn(),
}))

const RECIPE_JSON = JSON.stringify({
  title: 'Chocoladetaart',
  description: 'Een heerlijke taart.',
  portions: 8,
  portionsLabel: 'pers',
  ingredients: [],
  steps: [],
  equipment: [],
  notes: [],
  tags: ['chocolade', 'taart', 'bakken', 'dessert'],
  sourceName: '',
})

const anthropicResponse = (json: string) => ({
  ok: true,
  json: async () => ({ content: [{ text: json }] }),
})

describe('importRecipeFromImage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AI_PROVIDER', 'anthropic')
    vi.stubEnv('VITE_ANTHROPIC_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(anthropicResponse(RECIPE_JSON)))
    vi.mocked(uploadSourceImage).mockResolvedValue('https://cdn.example.com/photo.jpg')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('uploads the photo to storage and uses the storage url as source url', async () => {
    const file = new File(['img'], 'kookboek.jpg', { type: 'image/jpeg' })
    const result = await importRecipeFromImage(file)
    expect(vi.mocked(uploadSourceImage)).toHaveBeenCalledWith(file)
    expect(result.sources).toEqual([
      { label: 'Chocoladetaart', url: 'https://cdn.example.com/photo.jpg' },
    ])
  })

  it('uses recipe title as source label', async () => {
    const file = new File(['img'], 'kookboek.jpg', { type: 'image/jpeg' })
    const result = await importRecipeFromImage(file)
    expect(result.sources![0].label).toBe('Chocoladetaart')
  })

  it('uses empty string as source label when ai returns no title', async () => {
    const noTitle = JSON.stringify({ ...JSON.parse(RECIPE_JSON), title: '' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(anthropicResponse(noTitle)))
    const file = new File(['img'], 'kookboek.jpg', { type: 'image/jpeg' })
    const result = await importRecipeFromImage(file)
    expect(result.sources![0].label).toBe('')
  })
})
