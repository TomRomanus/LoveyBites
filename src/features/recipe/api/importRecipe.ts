import type { RecipeInput } from '@/features/recipe/types/recipe'
import { auth } from '@/lib/firebase'
import { stripHtml, labelFromUrl, parseAIResponse } from '@/features/recipe/api/parseRecipeHtml'

const MAX_HTML_LENGTH = 60_000

const fetchViaProxy = async (url: string): Promise<string> => {
  const user = auth.currentUser
  if (!user) throw new Error('Niet ingelogd')
  const token = await user.getIdToken()
  const endpoint = `https://europe-west1-loveybites-2e816.cloudfunctions.net/fetchProxy?url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Kon de pagina niet ophalen (${res.status})`)
  return res.text()
}

type OpenAIMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | { role: 'user'; content: Array<{ type: string; [key: string]: unknown }> }

const callOpenAI = async (
  apiKey: string,
  systemPrompt: string,
  messages: OpenAIMessage[],
): Promise<string> => {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content
}

type AnthropicMessage = {
  role: 'user' | 'assistant'
  content: string | Array<{ type: string; [key: string]: unknown }>
}

const callAnthropic = async (
  apiKey: string,
  systemPrompt: string,
  messages: AnthropicMessage[],
): Promise<string> => {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content[0].text
}

const URL_SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract the recipe from the provided content and return ONLY a valid JSON object — no markdown, no explanation, just the JSON.

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

const IMAGE_SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract the recipe from the provided image and return ONLY a valid JSON object — no markdown, no explanation, just the JSON.

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

const callAI = async (content: string): Promise<string> => {
  const provider = import.meta.env.VITE_AI_PROVIDER ?? 'anthropic'
  const userMessage = `Extract the recipe from this content:\n\n${content}`

  if (provider === 'openai') {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set in .env.local')
    return callOpenAI(apiKey, URL_SYSTEM_PROMPT, [{ role: 'user', content: userMessage }])
  }

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env.local')
  return callAnthropic(apiKey, URL_SYSTEM_PROMPT, [{ role: 'user', content: userMessage }])
}

const callAIWithImage = async (base64: string, mediaType: string): Promise<string> => {
  const provider = import.meta.env.VITE_AI_PROVIDER ?? 'anthropic'

  if (provider === 'openai') {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set in .env.local')
    return callOpenAI(apiKey, IMAGE_SYSTEM_PROMPT, [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
          { type: 'text', text: 'Extract the recipe from this image.' },
        ],
      },
    ])
  }

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env.local')
  return callAnthropic(apiKey, IMAGE_SYSTEM_PROMPT, [
    {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: 'Extract the recipe from this image.' },
      ],
    },
  ])
}

export const importRecipeFromImage = async (file: File): Promise<Partial<RecipeInput>> => {
  const mediaType = (file.type || 'image/jpeg') as
    | 'image/jpeg'
    | 'image/png'
    | 'image/gif'
    | 'image/webp'
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

export const importRecipeFromText = async (text: string): Promise<Partial<RecipeInput>> => {
  const aiResponse = await callAI(text)
  const { recipe } = parseAIResponse(aiResponse)
  recipe.sources = []
  return recipe
}

export const importRecipeFromUrl = async (url: string): Promise<Partial<RecipeInput>> => {
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
    content = `URL: ${url}\n\n${text.slice(0, MAX_HTML_LENGTH)}`
  }

  const aiResponse = await callAI(content)
  const { recipe, sourceName } = parseAIResponse(aiResponse)
  recipe.sources = [{ label: sourceName || labelFromUrl(url), url }]
  return recipe
}
