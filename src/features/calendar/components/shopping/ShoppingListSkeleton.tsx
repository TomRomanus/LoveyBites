import { motion } from 'framer-motion'

const ShoppingListSkeleton = () => {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {[
        { title: 60, items: [72, 55, 80] },
        { title: 45, items: [65, 48] },
        { title: 70, items: [58, 75, 42, 68] },
      ].map((sec, si) => (
        <div key={si} className="mb-4 pb-[14px] border-b border-[0.5px] border-ink/10">
          <div className="lb-skeleton h-[9px] w-[28%] rounded-[3px] mb-[6px]" />
          <div
            className="lb-skeleton h-4 rounded-[4px] mb-[10px]"
            style={{ width: `${sec.title}%` }}
          />
          {sec.items.map((w, ii) => (
            <div key={ii} className="flex items-center gap-3 py-[6px]">
              <div className="lb-skeleton w-[22px] h-[22px] rounded-[6px] shrink-0" />
              <div className="lb-skeleton h-[13px] rounded-[4px]" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  )
}

export default ShoppingListSkeleton
