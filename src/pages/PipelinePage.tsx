import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
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

  const entryCount = stages[0].count

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-sm font-semibold text-palette-neutral-900">Stage progression</h2>
        <div className="mt-3 flex items-stretch gap-1.5">
          {stages.map((stage, index) => (
            <Fragment key={stage.stage}>
              <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-4 shadow-xs">
                <p className="truncate text-xs font-medium text-muted-foreground">{stage.stage}</p>
                <p className="mt-1 text-2xl font-semibold text-palette-neutral-900">{stage.count}</p>
                <div className="mt-3 h-1.5 rounded-full bg-palette-neutral-100">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${Math.max((stage.count / entryCount) * 100, stage.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
              {index < stages.length - 1 && (
                <div className="flex shrink-0 items-center text-palette-neutral-300">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-palette-neutral-900">Current status</h2>
        <p className="mt-2 text-sm text-foreground">{opening.situationSummary}</p>
      </div>
    </div>
  )
}
