import { Plus } from 'lucide-react'

const DashedAddButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '9px 12px',
      border: '1px dashed var(--stone-2)',
      borderRadius: 9,
      color: 'var(--stone)',
      fontSize: 12,
      background: 'none',
      cursor: 'pointer',
      minHeight: 38,
      fontFamily: 'var(--sans)',
    }}
  >
    <Plus size={11} strokeWidth={2.5} />
    {label}
  </button>
)

export default DashedAddButton
