import IngredientPickerSheet from '@/features/recipe/components/editor/IngredientPickerSheet'
import { formatStepIngredient } from '@/features/recipe/utils/ingredientUtils'
import type { IngredientOption } from '@/features/recipe/components/editor/LeafRow'

type IngredientPickerSectionProps = {
  selectedIngredients: IngredientOption[]
  amounts: Record<string, string>
  pickerOpen: boolean
  selectedIds: Set<string>
  disabledIds: Set<string>
  options: IngredientOption[]
  remainingAmounts: Record<string, string>
  onOpenPicker: () => void
  onToggle: (id: string) => void
  onAmountChange: (id: string, amount: string) => void
  onClose: () => void
}

const IngredientPickerSection = ({
  selectedIngredients,
  amounts,
  pickerOpen,
  selectedIds,
  disabledIds,
  options,
  remainingAmounts,
  onOpenPicker,
  onToggle,
  onAmountChange,
  onClose,
}: IngredientPickerSectionProps) => (
  <div className="mb-[5px]">
    {selectedIngredients.length === 0 ? (
      <button
        type="button"
        onClick={onOpenPicker}
        className="bg-none border-0 text-[10px] text-bordeaux/45 cursor-pointer p-0 font-mono tracking-[0.08em] uppercase block text-left leading-normal"
      >
        + ingrediënten
      </button>
    ) : (
      <button
        type="button"
        onClick={onOpenPicker}
        className="bg-none border-0 p-0 cursor-pointer block text-left font-mono text-[10px] tracking-[0.08em] uppercase text-bordeaux/55 leading-normal w-full"
      >
        {selectedIngredients.map((o, i) => (
          <span key={o.id}>
            {i > 0 ? ' · ' : ''}
            {formatStepIngredient(o.text, amounts[o.id] ?? '')}
          </span>
        ))}
      </button>
    )}
    <IngredientPickerSheet
      visible={pickerOpen}
      selectedIds={selectedIds}
      disabledIds={disabledIds}
      options={options}
      amounts={amounts}
      remainingAmounts={remainingAmounts}
      onToggle={onToggle}
      onAmountChange={onAmountChange}
      onClose={onClose}
    />
  </div>
)

export default IngredientPickerSection
