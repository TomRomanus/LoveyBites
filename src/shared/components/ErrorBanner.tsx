type ErrorBannerProps = {
  message: string
  className?: string
}

const ErrorBanner = ({ message, className = '' }: ErrorBannerProps) => (
  <div
    className={`p-[14px] bg-bordeaux-tint rounded-[0_12px_12px_0] text-[13px] font-medium text-bordeaux border-l-[3px] border-bordeaux ${className}`}
  >
    {message}
  </div>
)

export default ErrorBanner
