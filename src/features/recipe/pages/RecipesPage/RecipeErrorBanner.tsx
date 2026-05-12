import ErrorBanner from '@/shared/components/ErrorBanner'

type RecipeErrorBannerProps = {
  message: string
}

const RecipeErrorBanner = ({ message }: RecipeErrorBannerProps) => (
  <ErrorBanner message={message} className="m-5" />
)

export default RecipeErrorBanner
