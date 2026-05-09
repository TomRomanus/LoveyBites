type FormFieldProps = {
  label: string
  required?: boolean
  children: React.ReactNode
}

const FormField = ({ label, required, children }: FormFieldProps) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8 }}>
      <span className="lb-eyebrow">{label}</span>
      {required && <span style={{ color: 'var(--bordeaux)', fontSize: 11 }}>*</span>}
    </div>
    {children}
  </div>
)

export default FormField
