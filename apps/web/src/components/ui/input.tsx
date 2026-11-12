import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      id,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const describedBy = error ? `${inputId}-error` : ariaDescribedBy

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--muted)] mb-1.5"
          >
            {label}
            {required && <span className="text-[var(--danger)] ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'w-full h-10 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--raised)] px-4',
            'text-[var(--step-body)] text-[var(--ink)] placeholder:text-[var(--muted-light)]',
            'transition-colors duration-120',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent)]/15',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--surface)]',
            error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/15',
            className
          )}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy}
          ref={ref}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-1.5 text-xs font-medium text-[var(--danger)]"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }