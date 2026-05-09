const RecipeListSkeleton = () => (
  <div style={{ padding: '10px 20px 120px' }}>
    {[62, 48, 70, 55, 65, 50].map((titleW, i) => (
      <div key={i} style={{ padding: '10px 0', borderBottom: '0.5px solid var(--line)' }}>
        <div className="lb-skeleton" style={{ height: 20, width: `${titleW}%` }} />
        <div
          style={{
            width: 24,
            height: 1.5,
            background: 'var(--bordeaux)',
            borderRadius: 1,
            opacity: 0.25,
            margin: '4px 0',
          }}
        />
        <div className="lb-skeleton" style={{ height: 12, width: '78%', marginBottom: 3 }} />
        <div className="lb-skeleton" style={{ height: 12, width: '55%' }} />
        <div
          className="lb-skeleton"
          style={{
            height: 9,
            width: ['45%', '38%', '52%', '42%', '48%', '35%'][i],
            marginTop: 4,
            marginBottom: 4,
          }}
        />
        <div className="lb-skeleton" style={{ height: 13, width: 73 }} />
      </div>
    ))}
  </div>
)

export default RecipeListSkeleton
