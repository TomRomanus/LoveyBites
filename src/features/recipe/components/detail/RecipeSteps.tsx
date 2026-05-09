type RecipeStepsProps = {
  steps: { phase?: string; text: string; ingredientRefs?: string[] }[]
  ingredientMap: Map<string, string>
}

const RecipeSteps = ({ steps, ingredientMap }: RecipeStepsProps) => (
  <div style={{ padding: '28px 22px 0' }}>
    <div className="lb-eyebrow">DEEL II</div>
    <h2
      style={{
        margin: '4px 0 16px',
        fontSize: 24,
        fontFamily: 'var(--serif)',
        fontStyle: 'italic',
        fontWeight: 500,
        letterSpacing: '-0.02em',
        lineHeight: 1.05,
      }}
    >
      Instructies
    </h2>
    {steps.map((step, i) => {
      const showPhase = step.phase !== (steps[i - 1]?.phase ?? '')
      return (
        <div key={i}>
          {showPhase && step.phase && (
            <>
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--bordeaux)',
                  marginBottom: 3,
                  marginTop: i > 0 ? 20 : 0,
                  fontWeight: 500,
                }}
              >
                {step.phase}
              </div>
              <div
                style={{
                  width: 22,
                  height: 1.5,
                  background: 'var(--bordeaux)',
                  borderRadius: 1,
                  opacity: 0.55,
                  marginBottom: 8,
                }}
              />
            </>
          )}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '8px 0',
              borderBottom: '0.5px solid var(--line-soft)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 22,
                color: 'var(--bordeaux)',
                fontWeight: 500,
                width: 22,
                flexShrink: 0,
                lineHeight: 1.1,
                paddingTop: 1,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              {step.ingredientRefs && step.ingredientRefs.length > 0 && (
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(107,31,42,0.55)',
                    marginBottom: 5,
                  }}
                >
                  {step.ingredientRefs.map((id) => ingredientMap.get(id) ?? id).join(' · ')}
                </div>
              )}
              <div style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.55 }}>{step.text}</div>
            </div>
          </div>
        </div>
      )
    })}
  </div>
)

export default RecipeSteps
