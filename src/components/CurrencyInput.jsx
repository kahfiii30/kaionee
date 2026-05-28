export default function CurrencyInput({ value, onChange, placeholder, required, className }) {
  // Convert value to formatted string for display
  const displayValue = value ? 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) 
    : ''

  const handleChange = (e) => {
    // Remove all non-digit characters
    const rawValue = e.target.value.replace(/\D/g, '')
    // Call onChange with the raw numeric string (or empty string if nothing)
    onChange({ target: { value: rawValue } }) 
  }

  return (
    <input
      type="text"
      required={required}
      placeholder={placeholder}
      className={className}
      value={displayValue}
      onChange={handleChange}
    />
  )
}
