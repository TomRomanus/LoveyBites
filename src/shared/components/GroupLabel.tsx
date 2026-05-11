import BordeauxBar from '@/shared/components/BordeauxBar'

type GroupLabelProps = {
  children: React.ReactNode
  theme?: 'light' | 'dark'
}

const GroupLabel = ({ children, theme = 'light' }: GroupLabelProps) => (
  <>
    <div
      className={`font-serif italic text-[14px] font-medium mb-[3px] ${theme === 'dark' ? 'text-bordeaux-mid' : 'text-bordeaux'}`}
    >
      {children}
    </div>
    <BordeauxBar
      className={`w-[22px] ${theme === 'dark' ? 'opacity-60' : 'opacity-55'}`}
      color={theme === 'dark' ? 'var(--bordeaux-mid)' : 'var(--bordeaux)'}
    />
  </>
)

export default GroupLabel
