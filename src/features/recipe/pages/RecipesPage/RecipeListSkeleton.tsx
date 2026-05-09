const RecipeListSkeleton = () => (
  <div className="px-5 pt-[10px] pb-[120px]">
    {[62, 48, 70, 55, 65, 50].map((titleW, i) => (
      <div key={i} className="py-[10px] border-b-[0.5px] border-ink/14">
        <div className="lb-skeleton h-5" style={{ width: `${titleW}%` }} />
        <div
          className="w-6 rounded-[1px] opacity-25 my-1"
          style={{ height: 1.5, background: 'var(--bordeaux)' }}
        />
        <div className="lb-skeleton h-3 w-[78%] mb-[3px]" />
        <div className="lb-skeleton h-3 w-[55%]" />
        <div
          className="lb-skeleton h-[9px] mt-1 mb-1"
          style={{ width: ['45%', '38%', '52%', '42%', '48%', '35%'][i] }}
        />
        <div className="lb-skeleton h-[13px] w-[73px]" />
      </div>
    ))}
  </div>
)

export default RecipeListSkeleton
