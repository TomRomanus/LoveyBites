import type { RecipeInput, IngredientNode } from '@/features/recipe/types/recipe'

export const stripHtml = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replace(/\s{2,}/g, ' ')
    .trim()

export const labelFromUrl = (url: string): string => {
  if (url.toLowerCase().includes('tiktok.com')) return 'TikTok'
  try {
    const hostname = new URL(url).hostname
    const bare = hostname.startsWith('www.') ? hostname.slice(4) : hostname
    const name = bare.split('.')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'Bron'
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const parseAIResponse = (text: string): { recipe: Partial<RecipeInput>; sourceName: string } => {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI response did not contain valid JSON')

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('AI response contained malformed JSON and could not be parsed')
  }

  if (!isRecord(parsed)) throw new Error('AI response JSON was not an object')

  const buildNodes = (arr: unknown[]): IngredientNode[] =>
    (arr ?? []).map((n: unknown) => {
      if (!isRecord(n)) return { kind: 'leaf' as const, id: crypto.randomUUID(), text: '' }
      if (n.kind === 'group') {
        return {
          kind: 'group' as const,
          title: String(n.title ?? ''),
          children: buildNodes((n.children as unknown[]) ?? []),
        }
      }
      return { kind: 'leaf' as const, id: crypto.randomUUID(), text: String(n.text ?? '') }
    })

  return {
    sourceName: String(parsed.sourceName ?? '').trim(),
    recipe: {
      title: String(parsed.title ?? ''),
      description: String(parsed.description ?? ''),
      portions: Number(parsed.portions) || 4,
      ingredients: buildNodes((parsed.ingredients as unknown[]) ?? []),
      steps: buildNodes((parsed.steps as unknown[]) ?? []),
      tags: ((parsed.tags as unknown[]) ?? []).map(String),
      imageUrl: String(parsed.imageUrl ?? ''),
      sources: [],
    },
  }
}
