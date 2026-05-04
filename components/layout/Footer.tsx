export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center gap-2 text-center text-sm text-stone-500 dark:text-stone-400">
          <span className="text-2xl">🌿</span>
          <p className="font-serif text-stone-700 dark:text-stone-300">Potions &amp; Lotions</p>
          <p>Always patch test. Essential oils are potent — use with care.</p>
          <p className="text-xs">Not medical advice. Consult a professional for therapeutic use.</p>
        </div>
      </div>
    </footer>
  )
}
