import { Link, useParams } from 'react-router-dom'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { useAppStore } from '../store/useAppStore'
import type { OpeningId } from '../types/domain'

const SPD_DESCRIPTION =
  'Senior product designer responsible for complex enterprise product experiences, working across product strategy, interaction design, systems thinking and cross-functional collaboration. Experience with AI products and scalable design systems is valuable.'

export function HiringCriteriaPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const filters = useAppStore((state) => state.filters)
  if (!opening) return null

  if (!opening.hasDetailedData) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Configured criteria for this opening aren&rsquo;t available yet.</p>
        </div>
      </div>
    )
  }

  const criteria = getCriteria(opening.id as OpeningId)

  return (
    <div className="grid grid-cols-3 gap-6 p-8">
      <div className="col-span-2 space-y-6">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Job description</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{SPD_DESCRIPTION}</p>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Configured hiring criteria</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These are the persistent criteria Copilot uses by default when evaluating candidates for this role.
          </p>
          <div className="mt-4 divide-y divide-border">
            {criteria.map((criterion) => (
              <div key={criterion.key} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-palette-neutral-900">{criterion.name}</span>
                <span className="rounded-full bg-palette-neutral-150 px-2.5 py-1 text-xs font-medium text-palette-neutral-600">
                  {criterion.priority} priority
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-palette-brand-200 bg-palette-brand-100 p-5">
          <h2 className="text-sm font-semibold text-palette-brand-700">Temporary exploration lens</h2>
          <p className="mt-1 text-sm text-palette-brand-700/80">
            Priya can temporarily change how Copilot prioritizes candidates through conversation or manual filters. This never
            changes the official criteria above.
          </p>
          {filters.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {filters.map((filter) => (
                <li key={filter.id} className="text-sm font-medium text-palette-brand-700">
                  {filter.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-palette-brand-700/70">No temporary lens is currently active.</p>
          )}
          <Link to={`/openings/${opening.id}/candidates`} className="mt-3 inline-block text-sm font-medium text-palette-brand-700 underline">
            Open candidate exploration
          </Link>
        </section>
      </div>
    </div>
  )
}
