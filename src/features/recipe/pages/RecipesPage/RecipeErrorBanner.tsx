type RecipeErrorBannerProps = {
  message: string
}

const RecipeErrorBanner = ({ message }: RecipeErrorBannerProps) => (
  <div className="m-5 p-[14px] bg-bordeaux-tint rounded-[0_12px_12px_0] text-[13px] font-medium text-bordeaux border-l-[3px] border-bordeaux">
    {message}
  </div>
)

export default RecipeErrorBanner
