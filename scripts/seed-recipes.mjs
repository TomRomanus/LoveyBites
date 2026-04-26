import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import admin from 'firebase-admin'

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = './service-account.json'
const CREATED_BY = 'tom.romanus1@gmail.com'
const NOTION_DIR = 'C:/Users/tomro/Downloads/notion recipes/Recepten'
// ─────────────────────────────────────────────────────────────────────────────

const RECIPES_SUBDIR = join(NOTION_DIR, 'Recepten')
const CSV_PATH = join(NOTION_DIR, 'Recepten b9bc4a754f2e4e73908c153bff090c71_all.csv')

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

// ─── CSV parsing ─────────────────────────────────────────────────────────────

function splitCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { fields.push(current); current = '' }
    else { current += ch }
  }
  fields.push(current)
  return fields
}

function parseCsv(content) {
  const lines = content.replace(/\r/g, '').trim().split('\n').slice(1)
  return lines.map(line => {
    const [name, portionsStr, , ratingStr] = splitCsvLine(line)
    return {
      name: name.trim(),
      portions: parsePortions(portionsStr?.trim()),
      rating: parseRating(ratingStr?.trim()),
    }
  })
}

function parsePortions(str) {
  if (!str) return undefined
  const m = str.match(/\d+/)
  return m ? parseInt(m[0], 10) : undefined
}

function parseRating(str) {
  if (!str) return undefined
  const count = (str.match(/★/g) || []).length
  return count > 0 ? count : undefined
}

// ─── File matching ────────────────────────────────────────────────────────────

function normalize(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function findMatchingFile(csvName, files) {
  const normCsv = normalize(csvName)
  const trimmedCsv = csvName.trim()

  const matches = files.filter(f => {
    const namePart = normalize(f.replace(/ [0-9a-f]{32}\.md$/i, ''))
    return normCsv === namePart || normCsv.startsWith(namePart) || namePart.startsWith(normCsv)
  })

  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]

  // Tie-break by exact case match (handles e.g. two "Chocolate chip cookies" variants)
  const exact = matches.find(f => f.replace(/ [0-9a-f]{32}\.md$/i, '').trim() === trimmedCsv)
  return exact ?? matches[0]
}

// ─── Markdown parsing ─────────────────────────────────────────────────────────

/**
 * Split markdown lines into named sections.
 * The first H1 is the title; subsequent H1 and H2 headings become sections.
 */
function parseSections(lines) {
  let titleLine = null
  const sections = []
  let current = null
  const preamble = []

  for (const line of lines) {
    if (!titleLine && /^# [^#]/.test(line)) {
      titleLine = line
      continue
    }
    const heading = line.match(/^#{1,2} (.+)/)
    if (heading) {
      if (current) sections.push(current)
      current = { name: heading[1].trim(), lines: [] }
      continue
    }
    if (current) {
      current.lines.push(line)
    } else if (titleLine) {
      preamble.push(line)
    }
  }
  if (current) sections.push(current)

  const title = titleLine ? titleLine.replace(/^# /, '').trim() : ''
  return { title, sections, preamble }
}

/**
 * Parse lines into IngredientNode[].
 * ### headings and **bold** lines create groups; bullet/numbered lines create leaves.
 */
function parseNodes(lines) {
  const nodes = []
  let currentGroup = null

  const pushLeaf = (text) => {
    const leaf = { kind: 'leaf', text }
    if (currentGroup) currentGroup.children.push(leaf)
    else nodes.push(leaf)
  }

  const flushGroup = () => {
    if (currentGroup) {
      if (currentGroup.children.length > 0) nodes.push(currentGroup)
      currentGroup = null
    }
  }

  for (const line of lines) {
    const h3 = line.match(/^### (.+)/)
    const bold = line.match(/^\*\*([^*]+)\*\*\s*$/)
    const bullet = line.match(/^[-*] (.+)/)
    // Match top-level numbered items (indent 0 or 1 level of spaces)
    const numbered = line.match(/^(?:\s{0,4})\d+[.)]\s+(.+)/)

    if (h3) {
      flushGroup()
      currentGroup = { kind: 'group', title: h3[1].trim(), children: [] }
    } else if (bold) {
      flushGroup()
      currentGroup = { kind: 'group', title: bold[1].trim(), children: [] }
    } else if (bullet) {
      pushLeaf(bullet[1].trim())
    } else if (numbered) {
      pushLeaf(numbered[1].trim())
    }
  }
  flushGroup()
  return nodes
}

/**
 * Classify a section as 'ingredient', 'step', 'source', or 'other'
 * based on its name, with content-type fallback.
 */
function classifySection(section) {
  const n = section.name.toLowerCase()
  if (/ingredi/.test(n)) return 'ingredient'
  if (/bereiding|voorbereiding|assembleren/.test(n)) return 'step'
  if (/bron|bronnen|reference/.test(n)) return 'source'
  // Fallback: check content
  const firstBullet = section.lines.find(l => /^[-*] /.test(l))
  const firstNumbered = section.lines.find(l => /^\d+[.)]\s/.test(l))
  if (firstBullet && !firstNumbered) return 'ingredient'
  if (firstNumbered) return 'step'
  return 'other'
}

/**
 * Extract sources (URLs) from source section lines, or from preamble/top-level lines.
 */
function extractSources(lines) {
  const sources = []
  for (const line of lines) {
    const mdLink = line.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/)
    if (mdLink) {
      sources.push({ label: mdLink[1], url: mdLink[2] })
      continue
    }
    const url = line.match(/https?:\/\/\S+/)
    if (url) {
      sources.push({ label: 'Bron', url: url[0].replace(/[)>\]]+$/, '') })
    }
  }
  return sources
}

function parseMarkdown(content) {
  const lines = content.replace(/\r/g, '').split('\n')
  const { title, sections, preamble } = parseSections(lines)

  const ingredientSections = sections.filter(s => classifySection(s) === 'ingredient')
  const stepSections = sections.filter(s => classifySection(s) === 'step')
  const sourceSections = sections.filter(s => classifySection(s) === 'source')

  // Ingredients
  let ingredients
  if (ingredientSections.length === 1) {
    ingredients = parseNodes(ingredientSections[0].lines)
  } else if (ingredientSections.length > 1) {
    ingredients = ingredientSections.flatMap(s => {
      const children = parseNodes(s.lines)
      return children.length > 0
        ? [{ kind: 'group', title: s.name, children }]
        : []
    })
  } else {
    // No ingredient section: bullet lines in the document become ingredients
    const allLines = [...preamble, ...sections.flatMap(s => s.lines)]
    ingredients = allLines
      .filter(l => /^[-*] /.test(l))
      .map(l => ({ kind: 'leaf', text: l.replace(/^[-*] /, '').trim() }))
  }

  // Steps
  let steps
  if (stepSections.length === 1) {
    steps = parseNodes(stepSections[0].lines)
  } else if (stepSections.length > 1) {
    steps = stepSections.flatMap(s => {
      const children = parseNodes(s.lines)
      return children.length > 0
        ? [{ kind: 'group', title: s.name, children }]
        : []
    })
  } else {
    // No step section: numbered lines in the document become steps
    const allLines = [...preamble, ...sections.flatMap(s => s.lines)]
    steps = allLines
      .filter(l => /^\d+[.)]\s/.test(l))
      .map(l => ({ kind: 'leaf', text: l.replace(/^\d+[.)]\s+/, '').trim() }))
  }

  // Sources: from H2 source sections, then H3 sub-sections within any section, then preamble
  let sources = sourceSections.flatMap(s => extractSources(s.lines))

  if (sources.length === 0) {
    for (const s of sections) {
      let capturing = false
      for (const line of s.lines) {
        if (/^### (bron|bronnen|reference)/i.test(line)) { capturing = true; continue }
        if (capturing) {
          if (/^###/.test(line)) break
          const mdLink = line.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/)
          if (mdLink) { sources.push({ label: mdLink[1], url: mdLink[2] }); continue }
          const urlMatch = line.match(/https?:\/\/\S+/)
          if (urlMatch) sources.push({ label: 'Bron', url: urlMatch[0].replace(/[)>\]]+$/, '') })
        }
      }
    }
  }

  if (sources.length === 0) sources = extractSources(preamble)

  return { title, ingredients, steps, sources }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (CREATED_BY === 'your@email.com') {
    console.error('Error: set CREATED_BY to your email address before running.')
    process.exit(1)
  }

  const csvContent = readFileSync(CSV_PATH, 'utf8')
  const rows = parseCsv(csvContent)

  const mdFiles = readdirSync(RECIPES_SUBDIR).filter(f => f.endsWith('.md'))

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    const file = findMatchingFile(row.name, mdFiles)
    if (!file) {
      console.log(`⚠  No file found for: ${row.name}`)
      skipped++
      continue
    }

    const content = readFileSync(join(RECIPES_SUBDIR, file), 'utf8')
    const parsed = parseMarkdown(content)

    const recipe = {
      title: parsed.title || row.name,
      description: '',
      ingredients: parsed.ingredients,
      steps: parsed.steps,
      tags: [],
      imageUrl: '',
      createdBy: CREATED_BY,
    }

    if (parsed.sources.length > 0) recipe.sources = parsed.sources
    if (row.portions !== undefined) recipe.portions = row.portions
    if (row.rating !== undefined) recipe.rating = row.rating

    await db.collection('recipes').add({
      ...recipe,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`✓  Imported: ${recipe.title}`)
    imported++
  }

  console.log(`\nDone: ${imported} imported, ${skipped} skipped`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
