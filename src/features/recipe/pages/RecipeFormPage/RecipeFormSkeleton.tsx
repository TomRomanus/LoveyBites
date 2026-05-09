const RecipeFormSkeleton = () => (
  <div className="lb-paper min-h-[100dvh]">
    {/* Header */}
    <div className="bg-[rgba(248,244,237,0.92)] backdrop-blur-[10px] z-10 px-5 pt-6 pb-[14px] flex items-center justify-between border-b-[0.5px] border-ink/14">
      <div className="lb-skeleton w-10 h-10 rounded-[20px]" />
      <div className="lb-skeleton w-[100px] h-[10px] rounded-[4px]" />
      <div className="lb-skeleton w-10 h-10 rounded-[20px]" />
    </div>
    {/* Form body */}
    <div className="px-5 py-6 flex flex-col gap-5">
      {/* Title */}
      <div className="lb-skeleton h-12 rounded-[14px]" />
      {/* Color row */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="lb-skeleton w-8 h-8 rounded-full shrink-0" />
        ))}
      </div>
      {/* Description */}
      <div className="lb-skeleton h-20 rounded-[14px]" />
      {/* Section label */}
      <div className="lb-skeleton h-[9px] w-[22%] rounded-[3px]" />
      {/* Ingredients */}
      {[75, 60, 82, 55].map((_w, i) => (
        <div key={i} className="flex gap-[10px] items-center pb-3 border-b-[0.5px] border-ink/14">
          <div className="lb-skeleton flex-1 h-10 rounded-[12px]" />
          <div className="lb-skeleton w-8 h-8 rounded-[8px] shrink-0" />
        </div>
      ))}
      {/* Section label */}
      <div className="lb-skeleton h-[9px] w-[18%] rounded-[3px] mt-1" />
      {/* Steps */}
      {[65, 80, 50].map((_w, i) => (
        <div key={i} className="flex gap-[14px] pb-3 border-b-[0.5px] border-ink/14">
          <div className="lb-skeleton w-[22px] h-[22px] rounded-full shrink-0 mt-0.5" />
          <div className="lb-skeleton h-[60px] flex-1 rounded-[12px]" />
        </div>
      ))}
    </div>
  </div>
)

export default RecipeFormSkeleton
