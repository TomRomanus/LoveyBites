import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'
import { cn } from '@/lib/utils'

const leafInputCls =
  'flex-1 bg-transparent border-0 outline-none font-sans text-[14px] text-ink px-1 py-[10px] resize-none leading-[1.45]'

type IngredientInputFieldProps = {
  value: string
  ordered: boolean
  autoFocus: boolean
  placeholder: string
  onChange: (value: string) => void
}

const IngredientInputField = ({
  value,
  ordered,
  autoFocus,
  placeholder,
  onChange,
}: IngredientInputFieldProps) => (
  <AutoGrowTextarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={1}
    autoFocus={autoFocus}
    className={
      ordered
        ? cn(leafInputCls, 'flex-none w-full box-border leading-[1.5] py-0 pr-1 pl-0')
        : `${leafInputCls} flex-1 w-full !pt-[9px] !pb-[11px]`
    }
    placeholder={placeholder}
  />
)

export default IngredientInputField
