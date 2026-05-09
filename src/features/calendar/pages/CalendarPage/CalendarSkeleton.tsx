const CalendarSkeleton = () => {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 120px' }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 5,
            padding: '15px 0',
            borderBottom: i < 6 ? '0.5px solid var(--line)' : 'none',
            minHeight: 38,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '17px 22px',
              columnGap: 5,
              alignItems: 'center',
              flexShrink: 0,
              width: 48,
              marginTop: 1,
            }}
          >
            <div className="lb-skeleton" style={{ width: 14, height: 9, borderRadius: 2 }} />
            <div className="lb-skeleton" style={{ width: 22, height: 22, borderRadius: '50%' }} />
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              paddingRight: 6,
              paddingTop: 3,
            }}
          >
            {([1, 2, 1, 0, 1, 2, 0] as const)[i] > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div
                  className="lb-skeleton"
                  style={{ width: 2.5, height: 13, borderRadius: 2, flexShrink: 0 }}
                />
                <div
                  className="lb-skeleton"
                  style={{
                    height: 13,
                    borderRadius: 5,
                    flex: 1,
                    maxWidth: ['60%', '45%', '70%', '30%', '55%', '40%', '65%'][i],
                  }}
                />
              </div>
            )}
            {([1, 2, 1, 0, 1, 2, 0] as const)[i] > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div
                  className="lb-skeleton"
                  style={{ width: 2.5, height: 13, borderRadius: 2, flexShrink: 0 }}
                />
                <div
                  className="lb-skeleton"
                  style={{
                    height: 13,
                    borderRadius: 5,
                    flex: 1,
                    maxWidth: ['75%', '35%', '55%', '80%', '40%', '50%', '70%'][i],
                  }}
                />
              </div>
            )}
          </div>
          <div
            style={{
              width: 0,
              alignSelf: 'stretch',
              borderLeft: '0.5px solid var(--line)',
              flexShrink: 0,
            }}
          />
          <div
            className="lb-skeleton"
            style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, marginTop: 3 }}
          />
        </div>
      ))}
    </div>
  )
}

export default CalendarSkeleton
