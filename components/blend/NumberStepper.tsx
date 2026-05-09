'use client'

interface NumberStepperProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  ariaLabel?: string
  over?: boolean
  size?: 'sm' | 'md'
}

export function NumberStepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  ariaLabel,
  over = false,
  size = 'md',
}: NumberStepperProps) {
  const btnHeight = size === 'sm' ? 'h-8 min-w-[28px]' : 'h-9 min-w-[36px]'
  const inputWidth = size === 'sm' ? 'w-10' : 'w-12'

  const baseBtn = `flex ${btnHeight} items-center justify-center px-2 text-base font-medium select-none transition-colors`
  const enabledBtn = over
    ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40'
    : 'border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-stone-500 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600'
  const disabledBtn = 'cursor-not-allowed opacity-40'

  const inputBase = `${inputWidth} border-y px-1 py-1.5 text-center text-base sm:text-sm focus:z-10 focus:outline-none focus:ring-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`
  const inputClass = over
    ? `${inputBase} border-red-300 bg-white text-red-800 focus:border-red-500 focus:ring-red-500 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100`
    : `${inputBase} border-stone-300 bg-white text-stone-900 focus:border-amber-500 focus:ring-amber-500 dark:border-stone-500 dark:bg-stone-600 dark:text-stone-100`

  const minusDisabled = value <= min
  const plusDisabled = value >= max

  return (
    <div className="inline-flex items-stretch" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={minusDisabled}
        aria-label="Decrease"
        className={`${baseBtn} rounded-l-md border ${minusDisabled ? `${enabledBtn} ${disabledBtn}` : enabledBtn}`}
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
        }}
        className={inputClass}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={plusDisabled}
        aria-label="Increase"
        className={`${baseBtn} rounded-r-md border ${plusDisabled ? `${enabledBtn} ${disabledBtn}` : enabledBtn}`}
      >
        +
      </button>
    </div>
  )
}
