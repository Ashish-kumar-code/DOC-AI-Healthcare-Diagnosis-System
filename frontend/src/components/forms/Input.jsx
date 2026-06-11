import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Input({ label, name, type = 'text', placeholder, error, icon: Icon, register, required, disabled, className = '', ...rest }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
        )}
        <input
          id={name}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          className={`input ${Icon ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''} ${error ? 'input-error' : ''}`}
          {...(register ? register(name, { required: required && `${label || name} is required` }) : { name })}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-danger text-sm mt-1.5">{error}</p>}
    </div>
  );
}
