type RecipeBenodigdhedenProps = {
  benodigdheden: string[]
  deel: string
}

const RecipeBenodigdheden = ({ benodigdheden, deel }: RecipeBenodigdhedenProps) => (
  <div className="px-[22px] pt-7">
    <div className="lb-eyebrow">DEEL {deel}</div>
    <h2 className="mt-1 mb-4 text-[24px] font-serif italic font-medium tracking-[-0.02em] leading-[1.05]">
      Benodigdheden
    </h2>
    <div className="flex flex-col gap-[6px]">
      {benodigdheden.map((item, i) => (
        <div key={i} className="flex items-center gap-[10px]">
          <div
            className="w-[3px] h-[3px] rounded-full shrink-0"
            style={{ background: 'var(--bordeaux)' }}
          />
          <div className="text-[15px] text-ink leading-[1.55]">{item}</div>
        </div>
      ))}
    </div>
  </div>
)

export default RecipeBenodigdheden
