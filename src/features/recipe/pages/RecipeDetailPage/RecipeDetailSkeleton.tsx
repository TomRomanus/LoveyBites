const RecipeDetailSkeleton = () => (
  <div style={{ minHeight: '100dvh', background: 'var(--paper)' }}>
    <div className="lb-skeleton" style={{ height: 185, borderRadius: 0 }} />
    <div style={{ padding: '20px 22px 0' }}>
      <div
        className="lb-skeleton"
        style={{ height: 10, width: '30%', marginBottom: 10, borderRadius: 4 }}
      />
      <div className="lb-skeleton" style={{ height: 34, width: '60%', marginBottom: 10 }} />
      <div className="lb-skeleton" style={{ height: 14, width: '88%', marginBottom: 5 }} />
      <div className="lb-skeleton" style={{ height: 14, width: '70%', marginBottom: 16 }} />
      <div className="lb-skeleton" style={{ height: 20, width: 110 }} />
    </div>
    <div style={{ padding: '20px 22px 0' }}>
      <div className="lb-skeleton" style={{ height: 40, borderRadius: 20 }} />
    </div>
    <div style={{ padding: '28px 22px 0' }}>
      <div
        className="lb-skeleton"
        style={{ height: 10, width: '18%', marginBottom: 8, borderRadius: 4 }}
      />
      <div className="lb-skeleton" style={{ height: 26, width: '42%', marginBottom: 18 }} />
      {[55, 72, 48, 65, 60].map((w, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
            borderBottom: '0.5px solid var(--line-soft)',
          }}
        >
          <div
            className="lb-skeleton"
            style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0 }}
          />
          <div className="lb-skeleton" style={{ height: 14, width: `${w}%` }} />
        </div>
      ))}
    </div>
  </div>
)

export default RecipeDetailSkeleton
