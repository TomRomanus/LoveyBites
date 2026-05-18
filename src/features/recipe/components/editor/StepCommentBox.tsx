import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { replaceAt } from '@/features/recipe/components/editor/nodeTree'
import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'
import type { IngredientNode } from '@/features/recipe/types/recipe'

type Props = {
  open: boolean
  autoFocus?: boolean
  reordering?: boolean
  node: IngredientNode & { kind: 'leaf' }
  allNodes: IngredientNode[]
  path: number[]
  onChange: (nodes: IngredientNode[]) => void
  onDismiss: () => void
}

const StepCommentBox = ({
  open,
  autoFocus = false,
  reordering,
  node,
  allNodes,
  path,
  onChange,
  onDismiss,
}: Props) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="pb-2">
          <div className="flex items-start rounded-md px-[14px] py-[6px] bg-honey-700/10">
            <AutoGrowTextarea
              value={node.comment ?? ''}
              resizeKey={reordering}
              onChange={(e) => {
                const { comment: _c, ...base } = node
                const updated = e.target.value ? { ...base, comment: e.target.value } : base
                onChange(replaceAt(allNodes, path, updated))
              }}
              rows={1}
              autoFocus={autoFocus}
              onFocus={(e) => {
                const len = e.target.value.length
                e.target.setSelectionRange(len, len)
              }}
              className="flex-1 bg-transparent border-0 outline-none resize-none font-sans text-[13px] text-ink-2 leading-[1.5] placeholder:text-honey-700/40"
              placeholder="Opmerking..."
            />
            <button
              type="button"
              aria-label="Opmerking verwijderen"
              onClick={() => {
                const { comment: _c, ...base } = node
                onChange(replaceAt(allNodes, path, base))
                onDismiss()
              }}
              className="shrink-0 text-honey-700/45 hover:text-honey-700/80 cursor-pointer pl-[6px] self-center border-0 bg-transparent"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

export default StepCommentBox
