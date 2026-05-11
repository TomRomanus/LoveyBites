type BordeauxBarProps = {
  className?: string
}

const BordeauxBar = ({ className = 'w-[22px] opacity-55' }: BordeauxBarProps) => (
  <div
    className={`rounded-[1px] shrink-0 ${className}`}
    style={{ height: 1.5, background: 'var(--bordeaux)' }}
  />
)

export default BordeauxBar
