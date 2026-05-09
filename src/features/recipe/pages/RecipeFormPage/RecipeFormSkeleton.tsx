const headerStyle: React.CSSProperties = {
  position: 'static',
  background: 'rgba(248, 244, 237, 0.92)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  zIndex: 10,
  padding: '24px 20px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '0.5px solid var(--line)',
}

const RecipeFormSkeleton = () => (
  <div className="lb-paper" style={{ minHeight: '100dvh' }}>
    {/* Header */}
    <div style={headerStyle}>
      <div className="lb-skeleton" style={{ width: 40, height: 40, borderRadius: 20 }} />
      <div className="lb-skeleton" style={{ width: 100, height: 10, borderRadius: 4 }} />
      <div className="lb-skeleton" style={{ width: 40, height: 40, borderRadius: 20 }} />
    </div>
    {/* Form body */}
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div className="lb-skeleton" style={{ height: 48, borderRadius: 14 }} />
      {/* Color row */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="lb-skeleton"
            style={{ width: 32, height: 32, borderRadius: 16, flexShrink: 0 }}
          />
        ))}
      </div>
      {/* Description */}
      <div className="lb-skeleton" style={{ height: 80, borderRadius: 14 }} />
      {/* Section label */}
      <div className="lb-skeleton" style={{ height: 9, width: '22%', borderRadius: 3 }} />
      {/* Ingredients */}
      {[75, 60, 82, 55].map((w, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            paddingBottom: 12,
            borderBottom: '0.5px solid var(--line-soft)',
          }}
        >
          <div className="lb-skeleton" style={{ flex: 1, height: 40, borderRadius: 12 }} />
          <div
            className="lb-skeleton"
            style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}
          />
        </div>
      ))}
      {/* Section label */}
      <div
        className="lb-skeleton"
        style={{ height: 9, width: '18%', borderRadius: 3, marginTop: 4 }}
      />
      {/* Steps */}
      {[65, 80, 50].map((w, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 14,
            paddingBottom: 12,
            borderBottom: '0.5px solid var(--line-soft)',
          }}
        >
          <div
            className="lb-skeleton"
            style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, marginTop: 2 }}
          />
          <div className="lb-skeleton" style={{ height: 60, flex: 1, borderRadius: 12 }} />
        </div>
      ))}
    </div>
  </div>
)

export default RecipeFormSkeleton
