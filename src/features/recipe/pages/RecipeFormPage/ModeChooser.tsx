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

const circleBtnCls =
  'w-10 h-10 rounded-[20px] bg-transparent border-[0.5px] border-ink/14 text-ink flex items-center justify-center cursor-pointer shrink-0'
const monoTitleCls = 'font-mono text-[11px] tracking-[0.12em] uppercase text-stone font-medium'
const headerCls =
  'sticky top-0 bg-[rgba(248,244,237,0.92)] backdrop-blur-[10px] z-10 px-5 pt-6 pb-[14px] flex items-center justify-between border-b-[0.5px] border-ink/14'

type ModeChooserProps = {
  onSelect: (mode: Mode) => void
  onClose: () => void
}

const ModeChooser = ({ onSelect, onClose }: ModeChooserProps) => (
  <>
    <div className={headerCls}>
      <button data-testid="form-close-btn" onClick={onClose} className={circleBtnCls}>
        <X size={13} strokeWidth={2.2} />
      </button>
      <div className={monoTitleCls}>Nieuw recept</div>
      <div className="w-10" />
    </div>
    <motion.div
      className="px-5 pt-2 pb-10"
      variants={listContainer}
      initial="hidden"
      animate="visible"
    >
      {MODES.map(({ id: modeId, label, description, icon }, index) => (
        <motion.button
          key={modeId}
          variants={listItem}
          onClick={() => onSelect(modeId)}
          className={`flex items-center gap-[14px] w-full px-1 py-4 text-left cursor-pointer bg-transparent border-none ${index < MODES.length - 1 ? 'border-b-[0.5px] border-ink/14' : ''}`}
        >
          <div className="w-5 shrink-0 flex items-center justify-center text-bordeaux">{icon}</div>
          <div className="flex-1">
            <div className="font-serif italic text-[17px] font-medium text-ink">{label}</div>
            <div className="text-[12px] text-stone mt-0.5">{description}</div>
          </div>
          <ChevronRight size={14} strokeWidth={1.6} color="var(--stone-2)" />
        </motion.button>
      ))}
    </motion.div>
  </>
)

export default ModeChooser
