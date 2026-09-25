import { useParams } from 'react-router-dom'
import { getOpening } from '../data/openings'

export function InterviewsPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  if (!opening) return null

  return (
    <div className="p-8">
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-palette-neutral-900">Current interview status</h2>
        <p className="mt-2 text-sm text-foreground">{opening.situationSummary}</p>
      </div>
    </div>
  )
}
