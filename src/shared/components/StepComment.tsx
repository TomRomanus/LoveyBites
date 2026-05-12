import { MessageCircleHeart } from 'lucide-react'
import { cn } from '@/lib/utils'

type StepCommentProps = {
  comment: string
  theme?: 'light' | 'dark'
  className?: string
}

const StepComment = ({ comment, theme = 'light', className }: StepCommentProps) => (
  <div data-comment className={cn('flex gap-[7px] items-start', className)}>
    <MessageCircleHeart
      size={16}
      className="shrink-0 mt-[6px] text-honey-700/75"
      strokeWidth={1.5}
    />
    <div
      className={cn(
        'flex-1 rounded-md px-[10px] py-[6px] text-[13px] leading-[1.5]',
        theme === 'dark' ? 'bg-honey-700/15 text-paper/75' : 'bg-honey-700/10 text-ink-2',
      )}
    >
      {comment}
    </div>
  </div>
)

export default StepComment
