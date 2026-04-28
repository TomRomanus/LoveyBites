import { useState } from 'react'
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

interface IngredientOption {
  id: string
  text: string
}

interface NodeRowProps {
  node: IngredientNode
  path: number[]
  depth: number
  isOnly: boolean
  nodes: IngredientNode[]
  labels: EditorLabels
  onChange: (nodes: IngredientNode[]) => void
  ingredientOptions?: IngredientOption[]
  leafMultiline?: boolean
}

const actionBtnClass = 'text-xs text-clay-400 hover:text-clay-600 shrink-0 min-h-[2rem] min-w-[2rem] flex items-center justify-center transition-colors'
const removeBtnClass = 'text-stone-300 hover:text-red-400 shrink-0 min-h-[2rem] min-w-[2rem] flex items-center justify-center transition-colors'

function NodeRow({ node, path, depth, isOnly, nodes, labels, onChange, ingredientOptions, leafMultiline }: NodeRowProps) {
  const indent = depth * 16
  const [pickerOpen, setPickerOpen] = useState(false)

  if (node.kind === 'leaf') {
    const selectedIds = new Set(node.ingredientRefs ?? [])
    const selectedIngredients = ingredientOptions?.filter((opt) => selectedIds.has(opt.id)) ?? []

    function toggleIngredient(id: string) {
      const cur = node.ingredientRefs ?? []
      const newRefs = selectedIds.has(id) ? cur.filter((r) => r !== id) : [...cur, id]
      onChange(replaceAt(nodes, path, { ...node, ingredientRefs: newRefs.length > 0 ? newRefs : undefined }))
    }

    return (
      <div style={{ paddingLeft: indent }}>
        <div className="flex items-start gap-1.5">
          <span className="text-stone-300 text-xs shrink-0 mt-2.5">–</span>
          {leafMultiline ? (
            <textarea
              value={node.text}
              onChange={(e) => onChange(replaceAt(nodes, path, { ...node, text: e.target.value }))}
              rows={2}
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:border-transparent transition resize-none"
              placeholder={labels.leafPlaceholder}
            />
          ) : (
            <input
              type="text"
              value={node.text}
              onChange={(e) => onChange(replaceAt(nodes, path, { ...node, text: e.target.value }))}
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:border-transparent transition"
              placeholder={labels.leafPlaceholder}
            />
          )}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              type="button"
              title="Item erna toevoegen"
              onClick={() => onChange(insertAfter(nodes, path, { kind: 'leaf', text: '' }))}
              className={actionBtnClass}
            >
              +item
            </button>
            <button
              type="button"
              title="Sectie erna toevoegen"
              onClick={() => onChange(insertAfter(nodes, path, { kind: 'group', title: '', children: [{ kind: 'leaf', text: '' }] }))}
              className={actionBtnClass}
            >
              +sec
            </button>
            {!isOnly && (
              <button
                type="button"
                onClick={() => onChange(removeAt(nodes, path))}
                className={removeBtnClass}
                aria-label="Verwijderen"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {ingredientOptions && ingredientOptions.length > 0 && (
          <div className="ml-4 mt-1.5">
            {!pickerOpen ? (
              <div className="flex flex-wrap items-center gap-1">
                {selectedIngredients.map((opt) => (
                  <span
                    key={opt.id}
                    className="text-xs bg-clay-50 text-clay-600 border border-clay-200 rounded-full px-2 py-0.5"
                  >
                    {opt.text}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="text-xs text-stone-300 hover:text-clay-400 transition-colors"
                >
                  {selectedIngredients.length > 0 ? '±' : '+ ingrediënten'}
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 pb-1">
                <div className="flex flex-wrap gap-1">
                  {ingredientOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleIngredient(opt.id)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        selectedIds.has(opt.id)
                          ? 'bg-clay-500 border-clay-500 text-white'
                          : 'border-stone-200 text-stone-400 hover:border-clay-300 hover:text-clay-500'
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="text-xs text-stone-400 hover:text-clay-500 transition-colors"
                >
                  Klaar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // group node
  return (
    <div style={{ paddingLeft: indent }}>
      <div className="flex items-center gap-1.5">
        <span className="text-clay-300 text-xs shrink-0">§</span>
        <input
          type="text"
          value={node.title}
          onChange={(e) => onChange(replaceAt(nodes, path, { ...node, title: e.target.value }))}
          className="flex-1 border border-clay-200 bg-clay-50 rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:border-transparent transition"
          placeholder={labels.groupPlaceholder}
        />
        <button
          type="button"
          title="Item erna toevoegen (zelfde niveau)"
          onClick={() => onChange(insertAfter(nodes, path, { kind: 'leaf', text: '' }))}
          className={actionBtnClass}
        >
          +item
        </button>
        <button
          type="button"
          title="Sectie erna toevoegen (zelfde niveau)"
          onClick={() => onChange(insertAfter(nodes, path, { kind: 'group', title: '', children: [{ kind: 'leaf', text: '' }] }))}
          className={actionBtnClass}
        >
          +sec
        </button>
        {!isOnly && (
          <button
            type="button"
            onClick={() => onChange(removeAt(nodes, path))}
            className={removeBtnClass}
            aria-label="Sectie verwijderen"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-1.5 ml-4 pl-3 border-l-2 border-clay-100 space-y-1.5">
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
            ingredientOptions={ingredientOptions}
            leafMultiline={leafMultiline}
          />
        ))}
        <button
          type="button"
          onClick={() => onChange(appendChild(nodes, path, { kind: 'leaf', text: '' }))}
          className="text-xs text-clay-400 hover:text-clay-600 font-medium ml-4 py-1 transition-colors"
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
  ingredientOptions?: IngredientOption[]
  leafMultiline?: boolean
}

export default function IngredientEditor({ nodes, onChange, labels: labelOverrides, commonSections, ingredientOptions, leafMultiline }: IngredientEditorProps) {
  const labels = { ...defaultLabels, ...labelOverrides }

  function addSection(title: string) {
    const last = nodes[nodes.length - 1]
    const base = last?.kind === 'leaf' && last.text.trim() === '' ? nodes.slice(0, -1) : nodes
    onChange([...base, { kind: 'group', title, children: [{ kind: 'leaf', text: '' }] }])
  }

  const existingTitles = collectGroupTitles(nodes)
  const availableSections = commonSections?.filter((name) => !existingTitles.has(name)) ?? []

  return (
    <div className="space-y-2">
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
          ingredientOptions={ingredientOptions}
          leafMultiline={leafMultiline}
        />
      ))}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onChange([...nodes, { kind: 'leaf', text: '' }])}
          className="text-sm text-clay-500 hover:text-clay-700 font-medium transition-colors"
        >
          {labels.addLeaf}
        </button>
        <button
          type="button"
          onClick={() => addSection('')}
          className="text-sm text-clay-500 hover:text-clay-700 font-medium transition-colors"
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
                className="text-xs bg-clay-50 text-clay-500 hover:bg-clay-100 border border-clay-200 rounded-full px-3 py-1 transition-colors"
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
