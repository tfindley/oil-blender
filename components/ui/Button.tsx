'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-amber-700 text-white hover:bg-amber-800 disabled:bg-amber-300',
  secondary: 'bg-stone-100 text-stone-800 border border-stone-300 hover:bg-stone-200 disabled:opacity-50',
  ghost: 'text-stone-600 hover:bg-stone-100 disabled:opacity-40',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
)

Button.displayName = 'Button'
