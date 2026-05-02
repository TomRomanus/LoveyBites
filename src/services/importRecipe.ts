import type { RecipeInput, IngredientNode } from '../types/recipe'

const PROXIES = [
  (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
]

async function fetchViaProxy(url: string): Promise<string> {
  let lastError: Error | undefined
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy(url))
      if (res.ok) return res.text()
      lastError = new Error(`Proxy returned ${res.status}`)
    } catch (e) {
      lastError = e as Error
    }
  }
  throw lastError ?? new Error('Kon de pagina niet ophalen')
}

async function callAI(content: string): Promise<string> {
  const provider = import.meta.env.VITE_AI_PROVIDER ?? 'anthropic'

  const systemPrompt = `You are a recipe extraction assistant. Extract the recipe from the provided content and return ONLY a valid JSON object — no markdown, no explanation, just the JSON.

The JSON must match this exact schema:
{
  "title": string,
  "description": string,
  "portions": number,
  "ingredients": IngredientNode[],
  "steps": IngredientNode[],
  "tags": string[],
  "imageUrl": string,
  "sourceName": string
}

"sourceName" should be the human-readable name of the website (e.g. "dagelijksekost.vrt.be" → "Dagelijkse Kost", "allrecipes.com" → "AllRecipes", "15gram.nl" → "15 Gram"). Use your knowledge of popular websites; if unknown, make a best guess from the domain name.

IngredientNode is either:
- { "kind": "leaf", "text": "ingredient or step text" }
- { "kind": "group", "title": "section name", "children": IngredientNode[] }

Use groups when the recipe has distinct sections (e.g. "Dough", "Filling", or "Preparation", "Cooking").
For steps, use groups like "Voorbereiding" and "Bereiding" if the recipe has multiple phases.
For tags, generate 3–6 relevant lowercase tags describing the dish (e.g. cuisine type, meal type, main ingredient, dietary properties, cooking method). Examples: "italiaans", "pasta", "vegetarisch", "snel", "diner", "gegrild".
If a field is not available, use an empty string, 0, or empty array as appropriate.`

  const userMessage = `Extract the recipe from this content:\n\n${content}`

  if (provider === 'openai') {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set in .env.local')

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0,
      }),
    })
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`)
    const data = await res.json()
    return data.choices[0].message.content
  }

  // Default: Anthropic
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env.local')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content[0].text
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
}


function parseAIResponse(text: string): { recipe: Partial<RecipeInput>; sourceName: string } {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI response did not contain valid JSON')
  const parsed = JSON.parse(jsonMatch[0])

  const buildNodes = (arr: unknown[]): IngredientNode[] =>
    (arr ?? []).map((n: unknown) => {
      const node = n as Record<string, unknown>
      if (node.kind === 'group') {
        return { kind: 'group', title: String(node.title ?? ''), children: buildNodes((node.children as unknown[]) ?? []) }
      }
      return { kind: 'leaf', id: crypto.randomUUID(), text: String(node.text ?? '') }
    })

  return {
    sourceName: String(parsed.sourceName ?? '').trim(),
    recipe: {
      title: parsed.title ?? '',
      description: parsed.description ?? '',
      portions: Number(parsed.portions) || 4,
      ingredients: buildNodes(parsed.ingredients ?? []),
      steps: buildNodes(parsed.steps ?? []),
      tags: (parsed.tags ?? []).map(String),
      imageUrl: parsed.imageUrl ?? '',
      sources: [],
    },
  }
}

function labelFromUrl(url: string): string {
  if (/tiktok\.com/i.test(url)) return 'TikTok'
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const name = hostname.split('.')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'Bron'
  }
}

async function callAIWithImage(base64: string, mediaType: string): Promise<string> {
  const provider = import.meta.env.VITE_AI_PROVIDER ?? 'anthropic'

  const systemPrompt = `You are a recipe extraction assistant. Extract the recipe from the provided image and return ONLY a valid JSON object — no markdown, no explanation, just the JSON.

The JSON must match this exact schema:
{
  "title": string,
  "description": string,
  "portions": number,
  "ingredients": IngredientNode[],
  "steps": IngredientNode[],
  "tags": string[],
  "imageUrl": string,
  "sourceName": string
}

IngredientNode is either:
- { "kind": "leaf", "text": "ingredient or step text" }
- { "kind": "group", "title": "section name", "children": IngredientNode[] }

Use groups when the recipe has distinct sections (e.g. "Dough", "Filling", or "Preparation", "Cooking").
For steps, use groups like "Voorbereiding" and "Bereiding" if the recipe has multiple phases.
For tags, generate 3–6 relevant lowercase tags describing the dish (e.g. cuisine type, meal type, main ingredient, dietary properties, cooking method). Examples: "italiaans", "pasta", "vegetarisch", "snel", "diner", "gegrild".
Set "sourceName" and "imageUrl" to empty string.
If a field is not available, use an empty string, 0, or empty array as appropriate.`

  if (provider === 'openai') {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set in .env.local')

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
              { type: 'text', text: 'Extract the recipe from this image.' },
            ],
          },
        ],
        temperature: 0,
      }),
    })
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`)
    const data = await res.json()
    return data.choices[0].message.content
  }

  // Default: Anthropic
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env.local')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: 'Extract the recipe from this image.' },
        ],
      }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content[0].text
}

export async function importRecipeFromImage(file: File): Promise<Partial<RecipeInput>> {
  const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const aiResponse = await callAIWithImage(base64, mediaType)
  const { recipe } = parseAIResponse(aiResponse)
  recipe.sources = []
  return recipe
}

export async function importRecipeFromText(text: string): Promise<Partial<RecipeInput>> {
  const aiResponse = await callAI(text)
  const { recipe } = parseAIResponse(aiResponse)
  recipe.sources = []
  return recipe
}

export async function importRecipeFromUrl(url: string): Promise<Partial<RecipeInput>> {
  const isTikTok = /tiktok\.com/i.test(url)

  let content: string

  if (isTikTok) {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    const text = await fetchViaProxy(oembedUrl)
    const oembed = JSON.parse(text)
    content = `TikTok video by @${oembed.author_name ?? 'unknown'}\nCaption: ${oembed.title ?? ''}\nThumbnail: ${oembed.thumbnail_url ?? ''}\nURL: ${url}`
  } else {
    const html = await fetchViaProxy(url)
    const text = stripHtml(html)
    content = `URL: ${url}\n\n${text.slice(0, 60_000)}`
  }

  const aiResponse = await callAI(content)
  const { recipe, sourceName } = parseAIResponse(aiResponse)
  recipe.sources = [{ label: sourceName || labelFromUrl(url), url }]
  return recipe
}
