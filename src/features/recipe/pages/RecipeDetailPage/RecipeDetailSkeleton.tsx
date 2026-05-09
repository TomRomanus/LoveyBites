const RecipeDetailSkeleton = () => (
  <div className="min-h-[100dvh] bg-paper">
    <div className="lb-skeleton h-[185px] rounded-none" />
    <div className="px-[22px] pt-5">
      <div className="lb-skeleton h-[10px] w-[30%] mb-[10px] rounded-[4px]" />
      <div className="lb-skeleton h-[34px] w-[60%] mb-[10px]" />
      <div className="lb-skeleton h-[14px] w-[88%] mb-[5px]" />
      <div className="lb-skeleton h-[14px] w-[70%] mb-4" />
      <div className="lb-skeleton h-5 w-[110px]" />
    </div>
    <div className="px-[22px] pt-5">
      <div className="lb-skeleton h-10 rounded-[20px]" />
    </div>
    <div className="px-[22px] pt-7">
      <div className="lb-skeleton h-[10px] w-[18%] mb-2 rounded-[4px]" />
      <div className="lb-skeleton h-[26px] w-[42%] mb-[18px]" />
      {[55, 72, 48, 65, 60].map((w, i) => (
        <div key={i} className="flex items-center gap-3 py-[10px] border-b-[0.5px] border-ink/14">
          <div className="lb-skeleton w-[22px] h-[22px] rounded-full shrink-0" />
          <div className="lb-skeleton h-[14px]" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  </div>
)

export default RecipeDetailSkeleton
