import type { IngredientNode } from '../types/recipe'

const FRACTIONS: Array<{ value: number; symbol: string }> = [
  { value: 1 / 2, symbol: '½' },
  { value: 1 / 4, symbol: '¼' },
  { value: 3 / 4, symbol: '¾' },
  { value: 1 / 3, symbol: '⅓' },
  { value: 2 / 3, symbol: '⅔' },
  { value: 1 / 8, symbol: '⅛' },
]

function parseFraction(s: string): number {
  const normalized = s.replace(',', '.')
  // Mixed number: "1 1/2"
  const mixed = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3])
  // Simple fraction: "1/2"
  const frac = normalized.match(/^(\d+)\/(\d+)$/)
  if (frac) return parseInt(frac[1]) / parseInt(frac[2])
  return parseFloat(normalized)
}

// Units where fractional display (½, ¼ …) is conventional
const VOLUME_UNIT = /^(cups?|c\.|tbsp?\.?|tbs\.?|tablespoons?|tsp\.?|teaspoons?|kop(?:jes?|pen)?|el|tl|eetlepels?|theelepels?)\b/i

function formatNumber(n: number, useFraction = false): string {
  const rounded = Math.round(n * 1e6) / 1e6
  if (Number.isInteger(rounded)) return String(rounded)

  const whole = Math.floor(rounded)
  const frac = rounded - whole

  if (useFraction) {
    for (const { value, symbol } of FRACTIONS) {
      if (Math.abs(frac - value) < 0.01) {
        return whole === 0 ? symbol : `${whole} ${symbol}`
      }
    }
  }

  // Decimal with comma (Dutch style)
  const oneDecimal = rounded.toFixed(1)
  if (oneDecimal.endsWith('.0')) return String(Math.round(rounded))
  return oneDecimal.replace('.', ',')
}

const LEADING_NUMBER = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)/

export function scaleIngredient(text: string, ratio: number): string {
  if (ratio === 1) return text
  const match = text.match(LEADING_NUMBER)
  if (!match) return text
  const scaled = parseFraction(match[1]) * ratio
  const rest = text.slice(match[0].length)
  const useFraction = VOLUME_UNIT.test(rest.trimStart())
  return formatNumber(scaled, useFraction) + rest
}

export function scaleIngredients(nodes: IngredientNode[], ratio: number): IngredientNode[] {
  return nodes.map((node) =>
    node.kind === 'leaf'
      ? { ...node, text: scaleIngredient(node.text, ratio) }
      : { ...node, children: scaleIngredients(node.children, ratio) },
  )
}
