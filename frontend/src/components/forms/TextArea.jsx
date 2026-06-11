export function TextArea({ label, name, placeholder, error, register, required, maxLength, rows = 4, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`input resize-none ${error ? 'input-error' : ''}`}
        {...(register ? register(name, { required: required && `${label || name} is required` }) : { name })}
      />
      <div className="flex justify-between mt-1.5">
        {error && <p className="text-danger text-sm">{error}</p>}
        {maxLength && <span className="text-xs text-text-tertiary ml-auto">{maxLength} max</span>}
      </div>
    </div>
  );
}
