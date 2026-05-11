import { Link } from 'react-router-dom'
import { X, Check, Loader } from 'lucide-react'
import IconButton from '@/shared/components/IconButton'

type Mode = 'url' | 'text' | 'photo' | 'manual'

type RecipeFormHeaderProps = {
  isEdit: boolean
  mode: Mode | null
  saving: boolean
  title: string
  onBack: () => void
}

const baseHeaderCls =
  'bg-[rgba(248,244,237,0.92)] backdrop-blur-[10px] px-5 pt-6 pb-[14px] flex items-center justify-between border-b-[0.5px] border-ink/14'
const monoTitleCls = 'font-mono text-[11px] tracking-[0.12em] uppercase text-stone font-medium'

const RecipeFormHeader = ({ isEdit, mode, saving, title, onBack }: RecipeFormHeaderProps) => {
  return (
    <div className={`${baseHeaderCls}${isEdit ? ' sticky top-0 z-10' : ''}`}>
      {mode !== null || isEdit ? (
        <IconButton
          data-testid="form-close-btn"
          onClick={onBack}
          className="bg-transparent border-[0.5px] border-ink/14 text-ink shrink-0"
        >
          <X size={13} strokeWidth={2.2} />
        </IconButton>
      ) : (
        <Link
          data-testid="form-close-btn"
          to="/"
          className="w-10 h-10 rounded-[20px] bg-transparent border-[0.5px] border-ink/14 text-ink flex items-center justify-center cursor-pointer shrink-0 no-underline"
        >
          <X size={13} strokeWidth={2.2} />
        </Link>
      )}
      <div className={monoTitleCls}>{title}</div>
      {isEdit ? (
        <button
          type="submit"
          form="recipe-form"
          disabled={saving}
          className={`w-10 h-10 rounded-[20px] border-0 text-white flex items-center justify-center shrink-0 ${saving ? 'bg-stone-2 cursor-default' : 'bg-bordeaux cursor-pointer'}`}
        >
          {saving ? (
            <Loader
              size={13}
              strokeWidth={2.2}
              style={{ animation: 'lb-spin 1s linear infinite' }}
            />
          ) : (
            <Check size={13} strokeWidth={2.5} />
          )}
        </button>
      ) : (
        <div className="w-10" />
      )}
    </div>
  )
}

export default RecipeFormHeader
