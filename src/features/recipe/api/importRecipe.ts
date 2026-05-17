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
      max_tokens: 8192,
      system: systemPrompt,
      messages,
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content[0].text
}

const SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract the recipe from the provided content and return ONLY a valid JSON object — no markdown, no explanation, just the JSON.

All text fields (title, description, ingredients, steps, equipment, notes) must be written in the language of the source recipe. The only exception is "tags", which must always be in Dutch.

The JSON must match this exact schema:
{
  "title": string,
  "description": string,
  "portions": number,
  "portionsLabel": "pers" | "stuks",
  "ingredients": Node[],
  "steps": StepNode[],
  "equipment": string[],
  "notes": [{ "label": string, "text": string }],
  "tags": string[],
  "sourceName": string
}

"portionsLabel": use "stuks" when the recipe yields a countable quantity of individual items (e.g. "12 dumplings", "8 burgers", "24 cookies"). Use "pers" in all other cases (servings, people). Default to "pers" when unclear.

"description": a factual description of what the dish is made up of. Write in the same language as the source recipe. Keep it short and to the point: 1–3 sentences maximum. Every sentence must convey something factual without flourishing words. Do not add serving suggestions, use cases, or flourish ("can be served", "ideal for", "perfect with").

"sourceName": the human-readable name of the website when the input contains a URL (e.g. "dagelijksekost.vrt.be" → "Dagelijkse Kost", "allrecipes.com" → "AllRecipes", "15gram.nl" → "15 Gram"). Use your knowledge of popular websites; if unknown, make a best guess from the domain name. Set to empty string if the input is plain text or an image.

Node is either a single item or a section:
- single item: { "text": "..." } — for ingredients, "text" is the full ingredient line including quantity and unit, with unit conversions applied per the rules below (e.g. "200 g pure chocolade (minimum 72%)", "4 eieren", "2 tbsp olijfolie", "zout naar smaak")
- section: { "title": "section name", "children": [ ...Node single items... ] }

StepNode is either a single item or a section:
- single item: { "text": "...", "comment": "...", "ingredientAmounts": { ... } }
- section: { "title": "section name", "children": [ ...StepNode single items... ] }

If the source has no explicit ingredient list (e.g. plain written text with only instructions), derive one: scan all steps, collect every ingredient mentioned, deduplicate, and output a flat array of Node single items. Include the quantity and unit as stated in the steps; use "" for the quantity part if none is mentioned.

When the source recipe has named sections (e.g. "De biscuit", "De chocolademousse", "Afwerking"), represent them as section nodes in both "ingredients" and "steps". Copy section names exactly from the source — do not invent them. If there are no named sections, use a flat list of single items.
Example for steps: if the source has "De biscuit" followed by steps 1–11 and "De chocolademousse" followed by steps 12–21, the steps array must be:
[
  { "title": "De biscuit", "children": [ { "text": "...", ... }, ... ] },
  { "title": "De chocolademousse", "children": [ { "text": "...", ... }, ... ] }
]

StepNode single items always include these additional fields:
- "ingredientAmounts": { "<exact ingredient text from the ingredients list>": "<numeric amount, no units>" } — use {} if no ingredients apply to this step. The value is a number only (e.g. "2" not "2 tbsp", "100" not "100 ml"); the unit is already in the ingredient text. Use "" as the value when the ingredient has no quantity. Determine which ingredients belong to each step:
  1. Always add when the site explicitly lists ingredients before a step (e.g. Dagelijkse Kost comma-separated line before the step number).
  2. Always add when the step states an explicit amount — use just the number. If the step uses fraction wording (e.g. "use half"), calculate from the ingredient list total (e.g. half of 200 ml → "100").
  3. Always add when an ingredient has no quantity in the ingredient list (e.g. "peper", "zout") — add to every step that mentions it with "" as the value.
  4. Always add when an ingredient is only used in a single step — use the numeric amount from the ingredient list.
  5. Do not add when an ingredient is used across multiple steps and the per-step amount is unclear.
- "comment": use "" when there is no tip or comments, mentioned in the step itself or around it (directly before or after). Example tip/note markers (case-insensitive, with or without trailing colon) include: "TIP", "NOTE", "OPMERKING", "LET OP" and their equivalents in other languages.

Unit conversion rules (apply throughout full recipe):
- Use English abbreviations for spoons: "tbsp" (not "el" or "EL"), "tsp" (not "tl" or "TL")
- Convert dl and cl to ml (1 dl = 100 ml, 1 cl = 10 ml)
- Convert imperial weight to metric: oz → g (1 oz ≈ 28 g), lb → g (1 lb ≈ 453 g)
- Convert imperial volume to metric: fl oz → ml (1 fl oz ≈ 30 ml), pint → ml (1 pint ≈ 475 ml), quart → ml
- Do NOT convert cups, tbsp, or tsp to metric

"equipment": list of required kitchen tools or equipment, each starting with a capital letter (e.g. "Springvorm 24cm", "Staafmixer"). Use empty array if none mentioned.

"notes": if the recipe includes storage or reheating information, add them here as separate entries. Use the language of the recipe for the labels (e.g. "Bewaren"/"Opwarmen" for Dutch, "Storage"/"Reheating" for English, "Conserver"/"Réchauffer" for French). Use empty array if neither is present.

"tags": exactly 4 relevant tags in Dutch, lowercase. Describe what the dish is: cuisine, dish type, main ingredient, cooking method, or dietary property. Examples: "italiaans", "pasta", "vegetarisch", "snel", "gegrild", "soep", "vis", "frans". Do not use occasion or context tags like "diner", "feestelijk", "lunch", "voorgerecht".

If a field is not available, use an empty string, 0, or empty array as appropriate.`

const callAI = async (content: string): Promise<string> => {
  const provider = import.meta.env.VITE_AI_PROVIDER ?? 'anthropic'
  const userMessage = `Extract the recipe from this content:\n\n${content}`

  if (provider === 'openai') {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set in .env.local')
    return callOpenAI(apiKey, SYSTEM_PROMPT, [{ role: 'user', content: userMessage }])
  }

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env.local')
  return callAnthropic(apiKey, SYSTEM_PROMPT, [{ role: 'user', content: userMessage }])
}

const callAIWithImage = async (base64: string, mediaType: string): Promise<string> => {
  const provider = import.meta.env.VITE_AI_PROVIDER ?? 'anthropic'

  if (provider === 'openai') {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set in .env.local')
    return callOpenAI(apiKey, SYSTEM_PROMPT, [
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
  return callAnthropic(apiKey, SYSTEM_PROMPT, [
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
  recipe.sources = [{ label: file.name, url: '' }]
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
  const name = sourceName || labelFromUrl(url)
  recipe.sources = [{ label: recipe.title ? `${name} - ${recipe.title}` : name, url }]
  return recipe
}
