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
    <div className="px-3 py-[14px]">
      <button
        onClick={onEdit}
        className="flex items-center gap-[14px] w-full px-4 py-[14px] bg-transparent border-0 rounded-[12px] text-ink text-[15px] font-medium cursor-pointer"
      >
        <Pencil size={18} strokeWidth={1.6} /> Recept bewerken
      </button>
      <button
        onClick={onDeleteRequest}
        className="flex items-center gap-[14px] w-full px-4 py-[14px] bg-transparent border-0 rounded-[12px] text-bordeaux text-[15px] font-medium cursor-pointer"
      >
        <Trash2 size={18} strokeWidth={1.6} /> Recept verwijderen
      </button>
    </div>
  </Sheet>
)

export default RecipeActionsSheet
