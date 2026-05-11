import { forwardRef } from 'react'

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className = '', type = 'button', children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`w-10 h-10 rounded-[20px] flex items-center justify-center cursor-pointer ${className}`}
      {...rest}
    >
      {children}
    </button>
  ),
)

IconButton.displayName = 'IconButton'

export default IconButton
