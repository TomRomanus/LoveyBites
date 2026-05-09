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
        <div
          key={si}
          style={{
            marginBottom: 16,
            paddingBottom: 14,
            borderBottom: '0.5px solid var(--line-soft)',
          }}
        >
          <div
            className="lb-skeleton"
            style={{ height: 9, width: '28%', borderRadius: 3, marginBottom: 6 }}
          />
          <div
            className="lb-skeleton"
            style={{
              height: 16,
              width: `${sec.title}%`,
              borderRadius: 4,
              marginBottom: 10,
            }}
          />
          {sec.items.map((w, ii) => (
            <div
              key={ii}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}
            >
              <div
                className="lb-skeleton"
                style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0 }}
              />
              <div
                className="lb-skeleton"
                style={{ height: 13, width: `${w}%`, borderRadius: 4 }}
              />
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  )
}

export default ShoppingListSkeleton
