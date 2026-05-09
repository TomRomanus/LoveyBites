const TodayMenuCardSkeleton = () => (
  <div className="lb-card overflow-hidden">
    <div className="lb-skeleton h-[72px] rounded-none" />
    <div className="flex flex-col gap-1.5 px-3.5 py-2.5">
      <div className="lb-skeleton h-[13px] w-[55%]" />
      <div className="lb-skeleton h-[13px] w-[35%]" />
    </div>
  </div>
)

export default TodayMenuCardSkeleton
