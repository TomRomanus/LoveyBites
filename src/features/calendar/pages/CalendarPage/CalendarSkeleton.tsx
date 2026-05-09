const CalendarSkeleton = () => {
  return (
    <div className="flex-1 overflow-y-auto py-3 px-5 pb-[120px]">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-start gap-[5px] py-[15px] min-h-[38px] ${i < 6 ? 'border-b border-[0.5px] border-ink/10' : ''}`}
        >
          <div className="grid shrink-0 w-12 mt-[1px] items-center [grid-template-columns:17px_22px] gap-x-[5px]">
            <div className="lb-skeleton w-[14px] h-[9px] rounded-[2px]" />
            <div className="lb-skeleton w-[22px] h-[22px] rounded-full" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-[5px] pr-[6px] pt-[3px]">
            {([1, 2, 1, 0, 1, 2, 0] as const)[i] > 0 && (
              <div className="flex items-center gap-[5px]">
                <div className="lb-skeleton w-[2.5px] h-[13px] rounded-[2px] shrink-0" />
                <div
                  className="lb-skeleton h-[13px] rounded-[5px] flex-1"
                  style={{ maxWidth: ['60%', '45%', '70%', '30%', '55%', '40%', '65%'][i] }}
                />
              </div>
            )}
            {([1, 2, 1, 0, 1, 2, 0] as const)[i] > 1 && (
              <div className="flex items-center gap-[5px]">
                <div className="lb-skeleton w-[2.5px] h-[13px] rounded-[2px] shrink-0" />
                <div
                  className="lb-skeleton h-[13px] rounded-[5px] flex-1"
                  style={{ maxWidth: ['75%', '35%', '55%', '80%', '40%', '50%', '70%'][i] }}
                />
              </div>
            )}
          </div>
          <div className="w-0 self-stretch border-l border-[0.5px] border-ink/10 shrink-0" />
          <div className="lb-skeleton w-3 h-3 rounded-[3px] shrink-0 mt-[3px]" />
        </div>
      ))}
    </div>
  )
}

export default CalendarSkeleton
