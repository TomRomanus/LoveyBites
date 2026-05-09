import { motion } from 'framer-motion'

type CustomMealTabContentProps = {
  custom: string
  onCustomChange: (v: string) => void
  saving: boolean
  onSave: () => void
}

const CustomMealTabContent = ({
  custom,
  onCustomChange,
  saving,
  onSave,
}: CustomMealTabContentProps) => (
  <>
    <input
      className="lb-input"
      autoFocus
      placeholder="bv. Afhalen, Restjes, Uit eten"
      value={custom}
      onChange={(e) => onCustomChange(e.target.value)}
    />
    <motion.button
      onClick={onSave}
      disabled={!custom.trim() || saving}
      whileTap={{ scale: 0.97 }}
      className="lb-btn lb-btn--primary w-full mt-[14px]"
    >
      {saving ? 'Opslaan…' : 'Aan planning toevoegen'}
    </motion.button>
  </>
)

export default CustomMealTabContent
