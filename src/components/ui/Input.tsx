import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, id, className = '', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-content-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 rounded-input
            bg-surface-input text-content-primary
            border transition-colors duration-200
            placeholder:text-content-placeholder
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              error
                ? 'border-error focus:ring-error/30'
                : 'border-border focus:border-border-focus focus:ring-primary-500/30'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-error font-medium">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-content-secondary">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
