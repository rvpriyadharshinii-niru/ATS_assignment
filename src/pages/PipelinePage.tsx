import { useParams } from 'react-router-dom'
import { getOpening } from '../data/openings'
import { getPipelineStages } from '../data/pipeline'
import type { OpeningId } from '../types/domain'

export function PipelinePage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  if (!opening) return null

  const stages = getPipelineStages(opening.id as OpeningId)

  if (stages.length === 0) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{opening.situationSummary}</p>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...stages.map((stage) => stage.count), 1)

  return (
    <div className="p-8">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-palette-neutral-900">Stage progression</h2>
        <div className="mt-5 grid grid-cols-6 gap-3">
          {stages.map((stage) => (
            <div key={stage.stage} className="text-center">
              <div className="flex h-24 items-end justify-center rounded-lg bg-palette-neutral-100">
                <div
                  className="w-full rounded-t-lg bg-palette-brand-300"
                  style={{ height: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 6 : 0)}%` }}
                />
              </div>
              <p className="mt-2 text-lg font-semibold text-palette-neutral-900">{stage.count}</p>
              <p className="text-xs text-muted-foreground">{stage.stage}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
