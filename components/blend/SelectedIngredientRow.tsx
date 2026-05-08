'use client'

interface SelectedIngredientRowProps {
  name: string
  botanicalName: string
  value: number
  unit: 'ml' | 'drops'
  onChange: (value: number) => void
  onRemove: () => void
  removeAriaLabel: string
}

export function SelectedIngredientRow({
  name,
  botanicalName,
  value,
  unit,
  onChange,
  onRemove,
  removeAriaLabel,
}: SelectedIngredientRowProps) {
  const max = unit === 'ml' ? 500 : 100
  const min = unit === 'ml' ? 0 : 1

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/40">
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-amber-900 dark:text-amber-200">{name}</span>
        <span className="ml-1.5 text-[10px] italic text-amber-600 dark:text-amber-500">{botanicalName}</span>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(ev) => onChange(parseFloat(ev.target.value) || min)}
        className="w-16 rounded border border-amber-300 bg-white px-1.5 py-1.5 text-right text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100"
      />
      <span className="text-xs text-amber-600 dark:text-amber-500">{unit}</span>
      <button
        onClick={onRemove}
        className="-mr-1 rounded-full p-1.5 text-amber-400 hover:bg-red-50 hover:text-red-500 dark:text-amber-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        aria-label={removeAriaLabel}
      >
        ✕
      </button>
    </div>
  )
}
