import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { IngredientNode } from '../types/recipe'
import AutoGrowTextarea from './AutoGrowTextarea'

const sheetVariants = {
  hidden: { y: '100%', transition: { type: 'tween' as const, duration: 0.22, ease: [0.4, 0, 1, 1] as const } },
  visible: { y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 32 } },
}

function IngredientPickerSheet({ selectedIds, options, onToggle, onClose }: {
  selectedIds: Set<string>
  options: Array<{ id: string; text: string }>
  onToggle: (id: string) => void
  onClose: () => void
}) {
  const [visible, setVisible] = useState(true)
  const close = () => setVisible(false)

  const backdropVariants = {
    hidden: { opacity: 0, transition: { duration: 0.2 } },
    visible: { opacity: 1, transition: { duration: 0.24 } },
  }

  return createPortal(
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <motion.div key="ing-bd"
          variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
          onClick={close}
          style={{ position: 'fixed', inset: 0, background: 'rgba(31,29,26,0.12)', backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)', zIndex: 200 }} />
      )}
      {visible && (
        <motion.div key="ing-sheet" className="lb-sheet" style={{ animation: 'none', paddingBottom: 30 }}
          variants={sheetVariants} initial="hidden" animate="visible" exit="hidden">
          <div className="lb-sheet-grabber" />
          <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="lb-display" style={{ margin: 0, fontSize: 22 }}>Ingrediënten</h3>
            {selectedIds.size > 0 && (
              <button type="button" onClick={() => options.filter(o => selectedIds.has(o.id)).forEach(o => onToggle(o.id))}
                style={{ background: 'none', border: 0, color: 'var(--bordeaux)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Alles wissen
              </button>
            )}
          </div>
          <div style={{ padding: '16px 20px 20px', display: 'flex', flexWrap: 'wrap', gap: 8, overflow: 'hidden' }}>
            {options.length > 0 ? options.map(opt => (
              <motion.button key={opt.id} type="button" className="lb-tag"
                data-active={selectedIds.has(opt.id) ? 'true' : 'false'}
                onClick={() => onToggle(opt.id)}
                layout transition={{ layout: { type: 'spring', stiffness: 400, damping: 32 } }}
                style={{ cursor: 'pointer', gap: 4 }}>
                <AnimatePresence mode="popLayout">
                  {selectedIds.has(opt.id) && (
                    <motion.span key="check"
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 25 }}
                      style={{ display: 'inline-flex' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                    </motion.span>
                  )}
                </AnimatePresence>
                {opt.text}
              </motion.button>
            )) : (
              <span style={{ fontSize: 13, color: 'var(--stone)' }}>Voeg eerst ingrediënten toe</span>
            )}
          </div>
          <div style={{ padding: '0 20px 14px', flexShrink: 0 }}>
            <button type="button" onClick={close} className="lb-btn lb-btn--primary" style={{ width: '100%' }}>Klaar</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

const newLeaf = (): IngredientNode => ({ kind: 'leaf', text: '', id: crypto.randomUUID() })

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
  addLeafInGroup: 'ingrediënt in sectie',
  addLeaf: 'ingrediënt toevoegen',
  addGroup: 'sectie toevoegen',
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

const xBtn: React.CSSProperties = {
  background: 'none',
  border: 0,
  color: 'var(--stone-2)',
  padding: 6,
  cursor: 'pointer',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.8,
}

const XIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const PlusIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const PenIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.121 2.121 0 013 3L7 19l-4 1 1-4L17 3z" />
  </svg>
)

function buildLeafIndexMap(nodes: IngredientNode[]): Map<string, number> {
  const map = new Map<string, number>()
  let n = 0
  function walk(ns: IngredientNode[]) {
    for (const node of ns) {
      if (node.kind === 'leaf') { if (node.id) map.set(node.id, n++) }
      else walk(node.children)
    }
  }
  walk(nodes)
  return map
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
  isLast: boolean
  nodes: IngredientNode[]
  labels: EditorLabels
  onChange: (nodes: IngredientNode[]) => void
  ingredientOptions?: IngredientOption[]
  leafMultiline?: boolean
  ordered?: boolean
  itemIndex?: number
  leafIndexMap?: Map<string, number>
}

function NodeRow({ node, path, depth, isOnly, isLast, nodes, labels, onChange, ingredientOptions, leafMultiline, ordered, itemIndex, leafIndexMap }: NodeRowProps) {
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

    const refsPanel = ordered && (
      <div style={{ marginBottom: 5 }}>
        {selectedIngredients.length === 0 ? (
          <button type="button" onClick={() => setPickerOpen(true)}
            style={{ background: 'none', border: 0, fontSize: 10, color: 'rgba(107,31,42,0.45)', cursor: 'pointer', padding: 0, fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', textAlign: 'left', lineHeight: 'normal' }}>
            + ingrediënten
          </button>
        ) : (
          <button type="button" onClick={() => setPickerOpen(true)}
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'block', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(107,31,42,0.55)', lineHeight: 'normal', width: '100%' }}>
            {selectedIngredients.map((o, i) => (
              <span key={o.id}>{i > 0 ? ' · ' : ''}{o.text}</span>
            ))}
          </button>
        )}
        {pickerOpen && (
          <IngredientPickerSheet
            selectedIds={selectedIds}
            options={ingredientOptions ?? []}
            onToggle={toggleIngredient}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    )

    return (
      <div style={{ paddingLeft: indent, borderBottom: isLast ? 'none' : '0.5px solid var(--line-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: ordered ? 14 : 6, padding: ordered ? '8px 0' : '6px 0' }}>
          {ordered ? (
            // Step number — matches recipe overview exactly, no dot
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--bordeaux)', fontWeight: 500, width: 22, flexShrink: 0, lineHeight: 1.1, paddingTop: 1 }}>
              {(leafIndexMap?.get(node.id ?? '') ?? itemIndex ?? 0) + 1}
            </span>
          ) : (
            <span style={{ color: 'var(--bordeaux)', fontFamily: 'var(--serif)', fontSize: 16, paddingTop: 3, paddingLeft: 4, flexShrink: 0 }}>·</span>
          )}

          {ordered ? (
            // Content column: refs above textarea, naturally aligned
            <div style={{ flex: 1, minWidth: 0 }}>
              {refsPanel}
              <AutoGrowTextarea
                value={node.text}
                onChange={(e) => onChange(replaceAt(nodes, path, { ...node, text: e.target.value }))}
                rows={1}
                style={{ ...leafInputStyle, flex: 'none', width: '100%', lineHeight: 1.5, padding: '0 4px 0' }}
                placeholder={labels.leafPlaceholder}
              />
            </div>
          ) : (
            <input
              type="text"
              value={node.text}
              onChange={(e) => onChange(replaceAt(nodes, path, { ...node, text: e.target.value }))}
              style={leafInputStyle}
              placeholder={labels.leafPlaceholder}
            />
          )}

          {!isOnly && (
            <button type="button" onClick={() => onChange(removeAt(nodes, path))} style={xBtn} aria-label="Verwijderen">
              <XIcon />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Group node — bordeaux left accent bar
  let leafCounter = 0
  return (
    <div style={{ borderLeft: '2px solid rgba(107,31,42,0.30)', padding: '2px 0 4px 12px', margin: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
        <input
          type="text"
          value={node.title}
          onChange={(e) => onChange(replaceAt(nodes, path, { ...node, title: e.target.value }))}
          style={{
            flex: 1, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, fontWeight: 500,
            color: 'var(--bordeaux)', background: 'transparent', border: 0, outline: 'none', padding: '2px 0',
          }}
          placeholder={labels.groupPlaceholder}
        />
        {!isOnly && (
          <button type="button" onClick={() => onChange(removeAt(nodes, path))} style={xBtn} aria-label="Sectie verwijderen">
            <XIcon />
          </button>
        )}
      </div>
      <div style={{ width: 22, height: 1.5, background: 'var(--bordeaux)', opacity: 0.55, borderRadius: 1, marginBottom: 6 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {node.children.map((child, i) => {
            const idx = child.kind === 'leaf' ? leafCounter++ : 0
            return (
              <motion.div
                key={child.id ?? i}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.13, ease: 'easeIn' } }}
                layout
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              >
                <NodeRow
                  node={child}
                  path={[...path, i]}
                  depth={0}
                  isOnly={node.children.length === 1}
                  isLast={i === node.children.length - 1}
                  nodes={nodes}
                  labels={labels}
                  onChange={onChange}
                  ingredientOptions={ingredientOptions}
                  leafMultiline={leafMultiline}
                  ordered={ordered}
                  itemIndex={idx}
                  leafIndexMap={leafIndexMap}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
        <button type="button"
          onClick={() => onChange(appendChild(nodes, path, newLeaf()))}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 8px', marginTop: 6,
            border: '1px dashed rgba(107,31,42,0.22)', borderRadius: 7,
            color: 'var(--stone)', fontSize: 11.5, minHeight: 32,
            background: 'none', cursor: 'pointer', fontFamily: 'var(--sans)',
          }}>
          <PlusIcon size={10} />
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
    onChange([...base, { kind: 'group', title, children: [newLeaf()] }])
  }

  const existingTitles = collectGroupTitles(nodes)
  const availableSections = commonSections?.filter((name) => !existingTitles.has(name)) ?? []
  const leafIndexMap = ordered ? buildLeafIndexMap(nodes) : undefined

  let rootLeafCounter = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <AnimatePresence mode="popLayout" initial={false}>
        {nodes.map((node, i) => {
          const idx = node.kind === 'leaf' ? rootLeafCounter++ : 0
          return (
            <motion.div
              key={node.id ?? i}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.13, ease: 'easeIn' } }}
              layout
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              <NodeRow
                node={node}
                path={[i]}
                depth={0}
                isOnly={nodes.length === 1}
                isLast={i === nodes.length - 1}
                nodes={nodes}
                labels={labels}
                onChange={onChange}
                ingredientOptions={ingredientOptions}
                leafMultiline={leafMultiline}
                ordered={ordered}
                itemIndex={idx}
                leafIndexMap={leafIndexMap}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
        <button type="button"
          onClick={() => onChange([...nodes, newLeaf()])}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px dashed var(--stone-2)', borderRadius: 9, color: 'var(--stone)', fontSize: 12, background: 'none', cursor: 'pointer', minHeight: 38, fontFamily: 'var(--sans)' }}>
          <PlusIcon />
          {labels.addLeaf}
        </button>
        <button type="button"
          onClick={() => addSection('')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px dashed var(--stone-2)', borderRadius: 9, color: 'var(--stone)', fontSize: 12, background: 'none', cursor: 'pointer', minHeight: 38, fontFamily: 'var(--sans)' }}>
          <PlusIcon />
          {labels.addGroup}
        </button>
        <AnimatePresence>
          {availableSections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ paddingTop: 4 }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--stone-2)', marginBottom: 6 }}>
                Sectiesuggesties
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                <AnimatePresence>
                  {availableSections.map((name, i) => (
                    <motion.button
                      key={name}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.1 } }}
                      layout
                      transition={{ type: 'spring', stiffness: 380, damping: 28, delay: i * 0.04 }}
                      type="button" onClick={() => addSection(name)} style={{
                        fontSize: 10.5, padding: '5px 11px', borderRadius: 20,
                        border: '1px dashed var(--stone-2)', background: 'transparent',
                        color: 'var(--stone)', fontFamily: 'var(--mono)',
                        letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                      }}>
                      + {name}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
