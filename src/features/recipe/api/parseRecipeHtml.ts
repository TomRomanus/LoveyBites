import type { RecipeInput, IngredientNode } from '@/features/recipe/types/recipe'

export const stripHtml = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(br|p|div|h[1-6]|li|tr|td|th|section|article|header|footer|ul|ol|blockquote)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
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

const buildIngredientNodes = (arr: unknown[]): IngredientNode[] =>
  (arr ?? []).map((n: unknown) => {
    if (!isRecord(n)) return { kind: 'leaf' as const, id: crypto.randomUUID(), text: '' }
    if (Array.isArray(n.children)) {
      return {
        kind: 'group' as const,
        title: String(n.title ?? ''),
        children: buildIngredientNodes(n.children),
      }
    }
    return { kind: 'leaf' as const, id: crypto.randomUUID(), text: String(n.text ?? '') }
  })

const collectTextToId = (nodes: IngredientNode[], map = new Map<string, string>()): Map<string, string> => {
  for (const node of nodes) {
    if (node.kind === 'leaf' && node.id) map.set(node.text.toLowerCase().trim(), node.id)
    else if (node.kind === 'group') collectTextToId(node.children, map)
  }
  return map
}

const buildStepNodes = (arr: unknown[], textToId: Map<string, string>): IngredientNode[] =>
  (arr ?? []).map((n: unknown) => {
    if (!isRecord(n)) return { kind: 'leaf' as const, id: crypto.randomUUID(), text: '' }
    if (Array.isArray(n.children)) {
      return {
        kind: 'group' as const,
        title: String(n.title ?? ''),
        children: buildStepNodes(n.children, textToId),
      }
    }
    const refs: string[] = []
    const amounts: Record<string, string> = {}
    if (isRecord(n.ingredientAmounts)) {
      for (const [text, amt] of Object.entries(n.ingredientAmounts)) {
        const id = textToId.get(text.toLowerCase().trim())
        if (id) {
          refs.push(id)
          amounts[id] = String(amt)
        }
      }
    }
    return {
      kind: 'leaf' as const,
      id: crypto.randomUUID(),
      text: String(n.text ?? ''),
      ...(n.comment ? { comment: String(n.comment) } : {}),
      ...(refs.length > 0 ? { ingredientRefs: refs, ingredientAmounts: amounts } : {}),
    }
  })

export const parseAIResponse = (
  text: string,
): { recipe: Partial<RecipeInput>; sourceName: string } => {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI response did not contain valid JSON')

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('AI response contained malformed JSON and could not be parsed')
  }

  if (!isRecord(parsed)) throw new Error('AI response JSON was not an object')

  const ingredients = buildIngredientNodes((parsed.ingredients as unknown[]) ?? [])
  const textToId = collectTextToId(ingredients)

  return {
    sourceName: String(parsed.sourceName ?? '').trim(),
    recipe: {
      title: String(parsed.title ?? ''),
      description: String(parsed.description ?? ''),
      portions: Number(parsed.portions) || 4,
      portionsLabel: parsed.portionsLabel === 'stuks' ? 'stuks' : 'pers',
      ingredients,
      steps: buildStepNodes((parsed.steps as unknown[]) ?? [], textToId),
      equipment: ((parsed.equipment as unknown[]) ?? []).map(String),
      notes: ((parsed.notes as unknown[]) ?? [])
        .filter(isRecord)
        .map((n) => ({ label: String(n.label ?? ''), text: String(n.text ?? '') }))
        .filter((n) => n.label && n.text),
      tags: ((parsed.tags as unknown[]) ?? []).map(String),
      sources: [],
    },
  }
}
