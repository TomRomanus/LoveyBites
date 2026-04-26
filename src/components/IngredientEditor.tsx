import type { IngredientNode } from '../types/recipe'

// --- Pure tree mutation helpers ---

function replaceAt(nodes: IngredientNode[], path: number[], replacement: IngredientNode): IngredientNode[] {
  if (path.length === 1) {
    return nodes.map((n, i) => (i === path[0] ? replacement : n))
  }
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    return { ...n, children: replaceAt(n.children, path.slice(1), replacement) }
  })
}

function removeAt(nodes: IngredientNode[], path: number[]): IngredientNode[] {
  if (path.length === 1) {
    return nodes.filter((_, i) => i !== path[0])
  }
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    return { ...n, children: removeAt(n.children, path.slice(1)) }
  })
}

function insertAfter(nodes: IngredientNode[], path: number[], node: IngredientNode): IngredientNode[] {
  if (path.length === 1) {
    const result = [...nodes]
    result.splice(path[0] + 1, 0, node)
    return result
  }
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    return { ...n, children: insertAfter(n.children, path.slice(1), node) }
  })
}

function appendChild(nodes: IngredientNode[], path: number[], node: IngredientNode): IngredientNode[] {
  if (path.length === 0) return [...nodes, node]
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    if (path.length === 1) return { ...n, children: [...n.children, node] }
    return { ...n, children: appendChild(n.children, path.slice(1), node) }
  })
}

export function pruneEmpty(nodes: IngredientNode[]): IngredientNode[] {
  return nodes
    .map((n) => (n.kind === 'leaf' ? n : { ...n, children: pruneEmpty(n.children) }))
    .filter((n) => (n.kind === 'leaf' ? n.text.trim() !== '' : n.children.length > 0))
}

function collectGroupTitles(nodes: IngredientNode[]): Set<string> {
  const titles = new Set<string>()
  for (const node of nodes) {
    if (node.kind === 'group') {
      if (node.title) titles.add(node.title)
      for (const t of collectGroupTitles(node.children)) titles.add(t)
    }
  }
  return titles
}

// --- Labels ---

export interface EditorLabels {
  leafPlaceholder: string
  groupPlaceholder: string
  addLeafInGroup: string
  addLeaf: string
  addGroup: string
}

const defaultLabels: EditorLabels = {
  leafPlaceholder: 'bijv. 360ml karnemelk',
  groupPlaceholder: 'Sectienaam (bijv. Marinade)',
  addLeafInGroup: '+ ingrediënt in sectie',
  addLeaf: '+ Ingrediënt toevoegen',
  addGroup: '+ Sectie toevoegen',
}

// --- Recursive node row ---

interface NodeRowProps {
  node: IngredientNode
  path: number[]
  depth: number
  isOnly: boolean
  nodes: IngredientNode[]
  labels: EditorLabels
  onChange: (nodes: IngredientNode[]) => void
}

function NodeRow({ node, path, depth, isOnly, nodes, labels, onChange }: NodeRowProps) {
  const indent = depth * 16

  if (node.kind === 'leaf') {
    return (
      <div style={{ paddingLeft: indent }} className="flex items-center gap-1.5">
        <span className="text-gray-300 text-xs shrink-0">–</span>
        <input
          type="text"
          value={node.text}
          onChange={(e) => onChange(replaceAt(nodes, path, { kind: 'leaf', text: e.target.value }))}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          placeholder={labels.leafPlaceholder}
        />
        <button
          type="button"
          title="Item erna toevoegen"
          onClick={() => onChange(insertAfter(nodes, path, { kind: 'leaf', text: '' }))}
          className="text-xs text-rose-400 hover:text-rose-600 px-1 shrink-0"
        >
          +item
        </button>
        <button
          type="button"
          title="Sectie erna toevoegen"
          onClick={() => onChange(insertAfter(nodes, path, { kind: 'group', title: '', children: [{ kind: 'leaf', text: '' }] }))}
          className="text-xs text-rose-400 hover:text-rose-600 px-1 shrink-0"
        >
          +sec
        </button>
        {!isOnly && (
          <button
            type="button"
            onClick={() => onChange(removeAt(nodes, path))}
            className="text-gray-300 hover:text-red-400 px-1 shrink-0"
            aria-label="Verwijderen"
          >
            ✕
          </button>
        )}
      </div>
    )
  }

  // group node
  return (
    <div style={{ paddingLeft: indent }}>
      <div className="flex items-center gap-1.5">
        <span className="text-rose-300 text-xs shrink-0">§</span>
        <input
          type="text"
          value={node.title}
          onChange={(e) => onChange(replaceAt(nodes, path, { ...node, title: e.target.value }))}
          className="flex-1 border border-rose-200 bg-rose-50 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400"
          placeholder={labels.groupPlaceholder}
        />
        <button
          type="button"
          title="Item erna toevoegen (zelfde niveau)"
          onClick={() => onChange(insertAfter(nodes, path, { kind: 'leaf', text: '' }))}
          className="text-xs text-rose-400 hover:text-rose-600 px-1 shrink-0"
        >
          +item
        </button>
        <button
          type="button"
          title="Sectie erna toevoegen (zelfde niveau)"
          onClick={() => onChange(insertAfter(nodes, path, { kind: 'group', title: '', children: [{ kind: 'leaf', text: '' }] }))}
          className="text-xs text-rose-400 hover:text-rose-600 px-1 shrink-0"
        >
          +sec
        </button>
        {!isOnly && (
          <button
            type="button"
            onClick={() => onChange(removeAt(nodes, path))}
            className="text-gray-300 hover:text-red-400 px-1 shrink-0"
            aria-label="Sectie verwijderen"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-1 ml-4 pl-3 border-l-2 border-rose-100 space-y-1.5">
        {node.children.map((child, i) => (
          <NodeRow
            key={i}
            node={child}
            path={[...path, i]}
            depth={0}
            isOnly={node.children.length === 1}
            nodes={nodes}
            labels={labels}
            onChange={onChange}
          />
        ))}
        <button
          type="button"
          onClick={() => onChange(appendChild(nodes, path, { kind: 'leaf', text: '' }))}
          className="text-xs text-rose-400 hover:text-rose-600 font-medium ml-4"
        >
          {labels.addLeafInGroup}
        </button>
      </div>
    </div>
  )
}

// --- Public component ---

interface IngredientEditorProps {
  nodes: IngredientNode[]
  onChange: (nodes: IngredientNode[]) => void
  labels?: Partial<EditorLabels>
  commonSections?: string[]
}

export default function IngredientEditor({ nodes, onChange, labels: labelOverrides, commonSections }: IngredientEditorProps) {
  const labels = { ...defaultLabels, ...labelOverrides }

  function addSection(title: string) {
    const last = nodes[nodes.length - 1]
    const base = last?.kind === 'leaf' && last.text.trim() === '' ? nodes.slice(0, -1) : nodes
    onChange([...base, { kind: 'group', title, children: [{ kind: 'leaf', text: '' }] }])
  }

  const existingTitles = collectGroupTitles(nodes)
  const availableSections = commonSections?.filter((name) => !existingTitles.has(name)) ?? []

  return (
    <div className="space-y-1.5">
      {nodes.map((node, i) => (
        <NodeRow
          key={i}
          node={node}
          path={[i]}
          depth={0}
          isOnly={nodes.length === 1}
          nodes={nodes}
          labels={labels}
          onChange={onChange}
        />
      ))}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onChange([...nodes, { kind: 'leaf', text: '' }])}
          className="text-sm text-rose-500 hover:text-rose-700 font-medium"
        >
          {labels.addLeaf}
        </button>
        <button
          type="button"
          onClick={() => addSection('')}
          className="text-sm text-rose-500 hover:text-rose-700 font-medium"
        >
          {labels.addGroup}
        </button>
        {availableSections.length > 0 && (
          <span className="w-full flex flex-wrap gap-1.5 mt-0.5">
            {availableSections.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => addSection(name)}
                className="text-xs bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-200 rounded-full px-2.5 py-0.5 transition-colors"
              >
                + {name}
              </button>
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
