type RecipeErrorBannerProps = {
  message: string
}

const RecipeErrorBanner = ({ message }: RecipeErrorBannerProps) => (
  <div
    style={{
      margin: '20px',
      padding: '14px',
      background: 'var(--bordeaux-tint)',
      borderRadius: '0 12px 12px 0',
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--bordeaux)',
      borderLeft: '3px solid var(--bordeaux)',
    }}
  >
    {message}
  </div>
)

export default RecipeErrorBanner
