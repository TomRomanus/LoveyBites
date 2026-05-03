import { useState } from 'react'
import type { IngredientNode } from '../types/recipe'
import AutoGrowTextarea from './AutoGrowTextarea'

// --- Pure tree mutation helpers ---

function replaceAt(nodes: IngredientNode[], path: number[], replacement: IngredientNode): IngredientNode[] {
  if (path.length === 1) return nodes.map((n, i) => (i === path[0] ? replacement : n))
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    return { ...n, children: replaceAt(n.children, path.slice(1), replacement) }
  })
}

function removeAt(nodes: IngredientNode[], path: number[]): IngredientNode[] {
  if (path.length === 1) return nodes.filter((_, i) => i !== path[0])
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

// --- Styles ---

const leafInputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 0,
  outline: 'none',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
  padding: '8px 4px',
  resize: 'none',
  lineHeight: 1.45,
}

const removeBtn: React.CSSProperties = {
  background: 'none',
  border: 0,
  color: 'var(--stone-2)',
  padding: 8,
  cursor: 'pointer',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  ordered?: boolean
  itemIndex?: number
}

function NodeRow({ node, path, depth, isOnly, nodes, labels, onChange, ingredientOptions, leafMultiline, ordered, itemIndex }: NodeRowProps) {
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '2px 0' }}>
          {ordered ? (
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--bordeaux)', minWidth: 18, paddingTop: 10, flexShrink: 0 }}>
              {(itemIndex ?? 0) + 1}.
            </span>
          ) : (
            <span style={{ color: 'var(--bordeaux)', fontFamily: 'var(--serif)', fontSize: 16, paddingTop: 6, paddingLeft: 4, flexShrink: 0 }}>·</span>
          )}
          {leafMultiline ? (
            <AutoGrowTextarea
              value={node.text}
              onChange={(e) => onChange(replaceAt(nodes, path, { ...node, text: e.target.value }))}
              rows={2}
              style={{ ...leafInputStyle, lineHeight: 1.5 }}
              placeholder={labels.leafPlaceholder}
            />
          ) : (
            <input
              type="text"
              value={node.text}
              onChange={(e) => onChange(replaceAt(nodes, path, { ...node, text: e.target.value }))}
              style={leafInputStyle}
              placeholder={labels.leafPlaceholder}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
            <button type="button" title="Item erna toevoegen"
              onClick={() => onChange(insertAfter(nodes, path, { kind: 'leaf', text: '' }))}
              style={{ background: 'none', border: 0, color: 'var(--bordeaux)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.04em', cursor: 'pointer', padding: '4px 6px', opacity: 0.6 }}>
              +item
            </button>
            {!isOnly && (
              <button type="button" onClick={() => onChange(removeAt(nodes, path))} style={removeBtn} aria-label="Verwijderen">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {ingredientOptions && ingredientOptions.length > 0 && (
          <div style={{ marginLeft: 22, marginTop: 6 }}>
            {!pickerOpen ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                {selectedIngredients.map((opt) => (
                  <span key={opt.id} style={{
                    fontSize: 11, background: 'var(--bordeaux-tint)', color: 'var(--bordeaux)',
                    border: '1px solid var(--bordeaux-soft)', borderRadius: 20, padding: '2px 10px',
                  }}>{opt.text}</span>
                ))}
                <button type="button" onClick={() => setPickerOpen(true)}
                  style={{ background: 'none', border: 0, fontSize: 11, color: 'var(--stone)', cursor: 'pointer' }}>
                  {selectedIngredients.length > 0 ? '±' : '+ ingrediënten'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 6 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ingredientOptions.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => toggleIngredient(opt.id)} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                      background: selectedIds.has(opt.id) ? 'var(--bordeaux)' : 'var(--paper-2)',
                      color: selectedIds.has(opt.id) ? 'var(--cream-card)' : 'var(--stone)',
                      border: `1px solid ${selectedIds.has(opt.id) ? 'var(--bordeaux)' : 'var(--line)'}`,
                    }}>{opt.text}</button>
                  ))}
                </div>
                <button type="button" onClick={() => setPickerOpen(false)}
                  style={{ background: 'none', border: 0, fontSize: 11, color: 'var(--stone)', cursor: 'pointer', alignSelf: 'flex-start' }}>
                  Klaar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Group node — renders as a section card
  let leafCounter = 0
  return (
    <div style={{ background: 'var(--paper)', borderRadius: 12, padding: '12px 12px', border: '0.5px solid var(--line-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <input
          type="text"
          value={node.title}
          onChange={(e) => onChange(replaceAt(nodes, path, { ...node, title: e.target.value }))}
          style={{
            flex: 1, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, fontWeight: 500,
            color: 'var(--bordeaux)', background: 'transparent', border: 0, outline: 'none', padding: '2px 0',
          }}
          placeholder={labels.groupPlaceholder}
        />
        <button type="button" title="Item erna toevoegen (zelfde niveau)"
          onClick={() => onChange(insertAfter(nodes, path, { kind: 'leaf', text: '' }))}
          style={{ background: 'none', border: 0, color: 'var(--bordeaux)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.04em', cursor: 'pointer', padding: '4px 6px', opacity: 0.6 }}>
          +item
        </button>
        {!isOnly && (
          <button type="button" onClick={() => onChange(removeAt(nodes, path))} style={removeBtn} aria-label="Sectie verwijderen">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {node.children.map((child, i) => {
          const idx = child.kind === 'leaf' ? leafCounter++ : 0
          return (
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
              ordered={ordered}
              itemIndex={idx}
            />
          )
        })}
        <button type="button"
          onClick={() => onChange(appendChild(nodes, path, { kind: 'leaf', text: '' }))}
          style={{ background: 'transparent', border: 0, color: 'var(--bordeaux)', fontSize: 13, fontWeight: 500, padding: '8px 0 0', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', alignSelf: 'flex-start' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
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
  ordered?: boolean
}

export default function IngredientEditor({ nodes, onChange, labels: labelOverrides, commonSections, ingredientOptions, leafMultiline, ordered }: IngredientEditorProps) {
  const labels = { ...defaultLabels, ...labelOverrides }

  function addSection(title: string) {
    const last = nodes[nodes.length - 1]
    const base = last?.kind === 'leaf' && last.text.trim() === '' ? nodes.slice(0, -1) : nodes
    onChange([...base, { kind: 'group', title, children: [{ kind: 'leaf', text: '' }] }])
  }

  const existingTitles = collectGroupTitles(nodes)
  const availableSections = commonSections?.filter((name) => !existingTitles.has(name)) ?? []

  let rootLeafCounter = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {nodes.map((node, i) => {
        const idx = node.kind === 'leaf' ? rootLeafCounter++ : 0
        return (
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
            ordered={ordered}
            itemIndex={idx}
          />
        )
      })}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
        <button type="button"
          onClick={() => onChange([...nodes, { kind: 'leaf', text: '' }])}
          style={{ background: 'none', border: 0, fontSize: 13, color: 'var(--bordeaux)', fontWeight: 500, cursor: 'pointer', padding: 0 }}>
          {labels.addLeaf}
        </button>
        <button type="button"
          onClick={() => addSection('')}
          style={{ background: 'none', border: 0, fontSize: 13, color: 'var(--bordeaux)', fontWeight: 500, cursor: 'pointer', padding: 0 }}>
          {labels.addGroup}
        </button>
        {availableSections.length > 0 && (
          <span style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {availableSections.map((name) => (
              <button key={name} type="button" onClick={() => addSection(name)} style={{
                fontSize: 11, background: 'var(--bordeaux-tint)', color: 'var(--bordeaux)',
                border: '1px solid var(--bordeaux-soft)', borderRadius: 20, padding: '3px 12px',
                cursor: 'pointer',
              }}>
                + {name}
              </button>
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
