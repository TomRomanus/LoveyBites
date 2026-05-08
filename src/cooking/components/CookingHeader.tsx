import { X } from 'lucide-react'

type CookingHeaderProps = {
  onClose: () => void
}

const CookingHeader = ({ onClose }: CookingHeaderProps) => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 14px', flexShrink: 0 }}>
    <button
      onClick={onClose}
      style={{
        background: 'transparent',
        border: '0.5px solid rgba(248,244,237,0.38)',
        color: '#f8f4ed',
        width: 40,
        height: 40,
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <X size={16} />
    </button>
    <div
      style={{
        flex: 1,
        textAlign: 'center',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'rgba(248,244,237,0.5)',
      }}
    >
      Kookmodus
    </div>
    <div style={{ width: 40 }} />
  </div>
)

export default CookingHeader
