type SectionHeaderProps = {
  eyebrow: string
  title: string
}

const SectionHeader = ({ eyebrow, title }: SectionHeaderProps) => (
  <>
    <div className="lb-eyebrow">{eyebrow}</div>
    <h2 className="mt-1 mb-4 text-[24px] font-serif italic font-medium tracking-[-0.02em] leading-[1.05]">
      {title}
    </h2>
  </>
)

export default SectionHeader
