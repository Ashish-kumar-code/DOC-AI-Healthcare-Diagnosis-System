import { ChevronDown } from 'lucide-react';

export function Select({ label, name, options = [], error, register, required, disabled, placeholder, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={name}
          disabled={disabled}
          className={`input appearance-none pr-10 ${error ? 'input-error' : ''}`}
          {...(register ? register(name, { required: required && `${label || name} is required` }) : { name })}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
      </div>
      {error && <p className="text-danger text-sm mt-1.5">{error}</p>}
    </div>
  );
}
