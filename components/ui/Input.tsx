import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

const fieldClasses =
  'rounded-md border border-stone-300 bg-white px-3 py-2 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-stone-50 disabled:text-stone-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</label>
      )}
      <input
        ref={ref}
        className={`${fieldClasses} ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</label>
      )}
      <textarea
        ref={ref}
        className={`${fieldClasses} ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'
