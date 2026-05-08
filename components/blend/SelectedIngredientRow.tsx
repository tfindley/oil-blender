'use client'

interface SelectedIngredientRowProps {
  name: string
  botanicalName: string
  value: number
  unit: 'ml' | 'drops'
  onChange: (value: number) => void
  onRemove: () => void
  removeAriaLabel: string
  over?: boolean
}

export function SelectedIngredientRow({
  name,
  botanicalName,
  value,
  unit,
  onChange,
  onRemove,
  removeAriaLabel,
  over = false,
}: SelectedIngredientRowProps) {
  const max = unit === 'ml' ? 500 : 100
  const min = unit === 'ml' ? 0 : 1

  const containerClass = over
    ? 'flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 dark:border-red-700 dark:bg-red-950/40'
    : 'flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-600 dark:bg-stone-700'

  const nameClass = over
    ? 'text-sm font-medium text-red-900 dark:text-red-200'
    : 'text-sm font-medium text-stone-800 dark:text-stone-100'

  const botanicalClass = over
    ? 'ml-1.5 text-[10px] italic text-red-600 dark:text-red-400'
    : 'ml-1.5 text-[10px] italic text-stone-400 dark:text-stone-500'

  const inputClass = over
    ? 'w-16 rounded border border-red-400 bg-white px-1.5 py-1.5 text-right text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/40 dark:text-red-100'
    : 'w-16 rounded border border-stone-300 bg-white px-1.5 py-1.5 text-right text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-500 dark:bg-stone-600 dark:text-stone-100'

  const unitClass = over
    ? 'text-xs text-red-600 dark:text-red-400'
    : 'text-xs text-stone-400 dark:text-stone-500'

  return (
    <div className={containerClass}>
      <div className="min-w-0 flex-1">
        <span className={nameClass}>{name}</span>
        <span className={botanicalClass}>{botanicalName}</span>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(ev) => onChange(parseFloat(ev.target.value) || min)}
        className={inputClass}
      />
      <span className={unitClass}>{unit}</span>
      <button
        onClick={onRemove}
        className="-mr-1 rounded-full p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        aria-label={removeAriaLabel}
      >
        ✕
      </button>
    </div>
  )
}
