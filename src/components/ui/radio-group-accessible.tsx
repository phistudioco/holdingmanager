import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface RadioOption<T = string> {
  value: T
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
}

export interface RadioGroupAccessibleProps<T = string> {
  name: string
  label: string
  value: T
  options: RadioOption<T>[]
  onChange: (value: T) => void
  orientation?: 'horizontal' | 'vertical'
  error?: string
  required?: boolean
  className?: string
  'aria-describedby'?: string
}

/**
 * Groupe de boutons radio accessible
 * Conforme WCAG AA avec structure ARIA correcte
 */
export function RadioGroupAccessible<T extends string = string>({
  name,
  label,
  value,
  options,
  onChange,
  orientation = 'horizontal',
  error,
  required = false,
  className,
  'aria-describedby': ariaDescribedby,
}: RadioGroupAccessibleProps<T>) {
  const errorId = error ? `${name}-error` : undefined
  const describedBy = [ariaDescribedby, errorId].filter(Boolean).join(' ') || undefined

  return (
    <fieldset
      className={cn('space-y-3', className)}
      aria-required={required}
      aria-invalid={!!error}
      aria-describedby={describedBy}
    >
      <legend className="text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="requis">
            *
          </span>
        )}
      </legend>

      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          'flex gap-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        )}
      >
        {options.map((option) => {
          const isChecked = value === option.value
          const optionId = `${name}-${option.value}`

          return (
            <label
              key={String(option.value)}
              htmlFor={optionId}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                'hover:border-phi-primary/50 hover:bg-phi-primary/5',
                'focus-within:ring-2 focus-within:ring-phi-primary/30',
                isChecked
                  ? 'border-phi-primary bg-phi-primary/10'
                  : 'border-gray-200 bg-white',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={String(option.value)}
                checked={isChecked}
                onChange={() => !option.disabled && onChange(option.value)}
                disabled={option.disabled}
                required={required}
                aria-checked={isChecked}
                aria-label={option.label}
                className="sr-only"
              />

              {/* Indicateur visuel du radio */}
              <span
                className={cn(
                  'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  isChecked ? 'border-phi-primary' : 'border-gray-300'
                )}
                aria-hidden="true"
              >
                {isChecked && (
                  <span className="w-3 h-3 rounded-full bg-phi-primary"></span>
                )}
              </span>

              <div className="flex-1 min-w-0">
                {option.icon && <div className="mb-2">{option.icon}</div>}
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.description && (
                  <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                )}
              </div>
            </label>
          )
        })}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-red-600 mt-2" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
