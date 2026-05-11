type SheetHeaderProps = {
  eyebrow: React.ReactNode
  titleClassName?: string
  children: React.ReactNode
}

const SheetHeader = ({ eyebrow, titleClassName = 'text-[26px]', children }: SheetHeaderProps) => (
  <div className="pt-3 px-[22px]">
    <div className="lb-eyebrow">{eyebrow}</div>
    <h3 className={`lb-display mt-1 ${titleClassName}`}>{children}</h3>
  </div>
)

export default SheetHeader
