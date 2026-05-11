type BordeauxBarProps = {
  className?: string
  color?: string
}

const BordeauxBar = ({ className = 'w-[22px] opacity-55', color = 'var(--bordeaux)' }: BordeauxBarProps) => (
  <div
    className={`rounded-[1px] shrink-0 ${className}`}
    style={{ height: 1.5, background: color }}
  />
)

export default BordeauxBar
