import { Card, CardBody, CardHeader } from '@/components/ui/Card'

interface SelectedOilsCardProps {
  carriers: { name: string }[]
  essentials: { name: string }[]
}

export function SelectedOilsCard({ carriers, essentials }: SelectedOilsCardProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">In Your Blend</h2>
      </CardHeader>
      <CardBody className="space-y-3 text-sm">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Carriers ({carriers.length})
          </span>
          <p className="mt-0.5 text-stone-700 dark:text-stone-200">
            {carriers.length === 0
              ? <span className="italic text-stone-400 dark:text-stone-500">None yet</span>
              : carriers.map((c) => c.name).join(', ')}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Essentials ({essentials.length})
          </span>
          <p className="mt-0.5 text-stone-700 dark:text-stone-200">
            {essentials.length === 0
              ? <span className="italic text-stone-400 dark:text-stone-500">None yet</span>
              : essentials.map((e) => e.name).join(', ')}
          </p>
        </div>
      </CardBody>
    </Card>
  )
}
