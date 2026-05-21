import { NL_DAYS_GRID } from '@/shared/constants/locale'

// Meal counts and bar widths per cell, varied to look natural
const MEAL_COUNTS = [0, 1, 2, 1, 0, 2, 1, 1, 0, 1, 2, 0, 1, 1, 2, 1, 0, 1, 2, 1, 0, 0, 2, 1, 1, 0, 1, 2, 1, 0, 2, 0, 1, 1, 0]
const BAR_WIDTHS = ['55%', '70%', '80%', '45%', '65%', '50%', '75%', '60%', '85%', '40%', '70%', '55%', '80%', '45%', '65%', '75%', '50%', '60%', '85%', '40%', '70%', '55%', '80%', '45%', '65%', '50%', '75%', '60%', '85%', '40%', '70%', '55%', '80%', '45%', '65%', '75%', '50%', '60%', '85%', '40%', '70%', '55%', '80%', '45%', '65%', '50%', '75%', '60%', '85%', '40%', '70%', '55%', '80%', '45%', '65%', '75%', '50%', '60%', '85%', '40%', '70%', '55%', '80%', '45%', '65%', '50%', '75%', '60%', '85%', '40%']

const MonthSkeleton = () => (
  <div className="py-4 px-[10px] pb-20 overflow-y-auto flex-1">
    <div className="grid grid-cols-7 gap-1 mb-1">
      {NL_DAYS_GRID.map((d) => (
        <div
          key={d}
          className="text-center font-mono text-[10px] tracking-[0.1em] text-stone-2 font-semibold uppercase py-1"
        >
          {d}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">
      {MEAL_COUNTS.map((count, i) => (
        <div
          key={i}
          className="bg-[var(--cream-card)] border-[0.5px] border-ink/10 rounded-[10px] py-2 px-1 pb-3 flex flex-col items-center gap-[5px] overflow-hidden"
        >
          <div className="lb-skeleton w-[22px] h-[22px] rounded-full shrink-0" />
          <div className="w-full flex flex-col">
            {Array.from({ length: count }).map((_, j) => (
              <div key={j} className="flex items-center gap-[2px] w-full pb-[2px]">
                <div className="lb-skeleton w-[2px] h-[10px] rounded-[2px] shrink-0" />
                <div
                  className="lb-skeleton h-[7px] rounded-[2px] flex-1"
                  style={{ maxWidth: BAR_WIDTHS[i * 2 + j] }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default MonthSkeleton
