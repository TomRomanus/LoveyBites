import { motion } from 'framer-motion'
import { Link as LinkIcon, AlignLeft, Image, Pencil, X, ChevronRight } from 'lucide-react'

type Mode = 'url' | 'text' | 'photo' | 'manual'

const MODES: { id: Mode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'url',
    label: 'Vanuit URL',
    description: 'Plak een receptlink of TikTok-video',
    icon: <LinkIcon size={20} strokeWidth={1.6} />,
  },
  {
    id: 'text',
    label: 'Vanuit tekst',
    description: 'Plak ruwe tekst van waar dan ook',
    icon: <AlignLeft size={20} strokeWidth={1.6} />,
  },
  {
    id: 'photo',
    label: 'Vanuit foto',
    description: 'Upload een foto uit een kookboek',
    icon: <Image size={20} strokeWidth={1.6} />,
  },
  {
    id: 'manual',
    label: 'Zelf invullen',
    description: 'Tik het zelf in',
    icon: <Pencil size={20} strokeWidth={1.6} />,
  },
]

const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
const listItem = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
  },
}

const circleBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 20,
  background: 'transparent',
  border: '0.5px solid var(--line)',
  color: 'var(--ink)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
}

const monoTitle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--stone)',
  fontWeight: 500,
}

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  background: 'rgba(248, 244, 237, 0.92)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  zIndex: 10,
  padding: '24px 20px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '0.5px solid var(--line)',
}

type ModeChooserProps = {
  onSelect: (mode: Mode) => void
  onClose: () => void
}

const ModeChooser = ({ onSelect, onClose }: ModeChooserProps) => (
  <>
    <div style={headerStyle}>
      <button data-testid="form-close-btn" onClick={onClose} style={circleBtn}>
        <X size={13} strokeWidth={2.2} />
      </button>
      <div style={monoTitle}>Nieuw recept</div>
      <div style={{ width: 40 }} />
    </div>
    <motion.div
      style={{ padding: '8px 20px 40px' }}
      variants={listContainer}
      initial="hidden"
      animate="visible"
    >
      {MODES.map(({ id: modeId, label, description, icon }, index) => (
        <motion.button
          key={modeId}
          variants={listItem}
          onClick={() => onSelect(modeId)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            width: '100%',
            padding: '16px 4px',
            textAlign: 'left',
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            borderBottom: index < MODES.length - 1 ? '0.5px solid var(--line)' : 'none',
          }}
        >
          <div
            style={{
              width: 20,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bordeaux)',
            }}
          >
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 17,
                fontWeight: 500,
                color: 'var(--ink)',
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--stone)', marginTop: 2 }}>{description}</div>
          </div>
          <ChevronRight size={14} strokeWidth={1.6} color="var(--stone-2)" />
        </motion.button>
      ))}
    </motion.div>
  </>
)

export default ModeChooser
