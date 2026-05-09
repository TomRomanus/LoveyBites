import { Pencil, Trash2 } from 'lucide-react'
import Sheet from '@/shared/components/Sheet'

type RecipeActionsSheetProps = {
  visible: boolean
  onEdit: () => void
  onDeleteRequest: () => void
  onClose: () => void
}

const RecipeActionsSheet = ({
  visible,
  onEdit,
  onDeleteRequest,
  onClose,
}: RecipeActionsSheetProps) => (
  <Sheet visible={visible} onClose={onClose}>
    <div style={{ padding: '14px 12px' }}>
      <button
        onClick={onEdit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: 0,
          borderRadius: 12,
          color: 'var(--ink)',
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <Pencil size={18} strokeWidth={1.6} /> Recept bewerken
      </button>
      <button
        onClick={onDeleteRequest}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: 0,
          borderRadius: 12,
          color: 'var(--bordeaux)',
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <Trash2 size={18} strokeWidth={1.6} /> Recept verwijderen
      </button>
    </div>
  </Sheet>
)

export default RecipeActionsSheet
