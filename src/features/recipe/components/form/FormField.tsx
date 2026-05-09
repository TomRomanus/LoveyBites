type FormFieldProps = {
  label: string
  required?: boolean
  children: React.ReactNode
}

const FormField = ({ label, required, children }: FormFieldProps) => (
  <div>
    <div className="flex items-baseline gap-0.5 mb-2">
      <span className="lb-eyebrow">{label}</span>
      {required && <span className="text-bordeaux text-[11px]">*</span>}
    </div>
    {children}
  </div>
)

export default FormField
