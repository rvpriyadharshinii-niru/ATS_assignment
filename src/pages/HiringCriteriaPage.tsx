import { MoreHorizontal, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { AVAILABLE_CRITERIA_CATALOG } from '../data/criteria'
import { getOpening } from '../data/openings'
import { useAppStore } from '../store/useAppStore'
import { useCriteria } from '../store/criteriaSelectors'
import type { CriterionKey, CriterionPriority, OpeningId } from '../types/domain'

const SPD_DESCRIPTION =
  'Senior product designer responsible for complex enterprise product experiences, working across product strategy, interaction design, systems thinking and cross-functional collaboration. Experience with AI products and scalable design systems is valuable.'

function AddCriterionDialog({
  open,
  onOpenChange,
  openingId,
  existingKeys,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  openingId: OpeningId
  existingKeys: Set<CriterionKey>
}) {
  const addCriterion = useAppStore((state) => state.addCriterion)
  const pushToast = useAppStore((state) => state.pushToast)
  const available = AVAILABLE_CRITERIA_CATALOG.filter((entry) => !existingKeys.has(entry.key))
  const [selectedKey, setSelectedKey] = useState<CriterionKey | ''>('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-palette-neutral-900/30 p-4" onClick={() => onOpenChange(false)}>
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-palette-neutral-900">Add criterion</h2>
        {available.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Every available criterion is already configured for this role.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Pick a criterion to start evaluating candidates against.</p>
            <select
              value={selectedKey}
              onChange={(event) => setSelectedKey(event.target.value as CriterionKey)}
              className="mt-3 w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="">Select a criterion…</option>
              {available.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.name}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedKey}
            onClick={() => {
              const criterion = AVAILABLE_CRITERIA_CATALOG.find((entry) => entry.key === selectedKey)
              if (criterion) {
                addCriterion(openingId, criterion)
                pushToast(`${criterion.name} added to hiring criteria.`)
              }
              setSelectedKey('')
              onOpenChange(false)
            }}
            className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add criterion
          </button>
        </div>
      </div>
    </div>
  )
}

function CriterionMenu({ onRemove }: { onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="More actions"
        className="rounded-md p-1.5 text-palette-neutral-400 hover:bg-muted hover:text-palette-neutral-600"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 w-32 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onRemove()
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-muted"
            >
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function HiringCriteriaPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const filters = useAppStore((state) => state.filters)
  const setCriterionPriority = useAppStore((state) => state.setCriterionPriority)
  const removeCriterion = useAppStore((state) => state.removeCriterion)
  const pushToast = useAppStore((state) => state.pushToast)
  const criteria = useCriteria(opening?.id as OpeningId)
  const [addOpen, setAddOpen] = useState(false)
  const [removeKey, setRemoveKey] = useState<CriterionKey | null>(null)

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

  const id = opening.id as OpeningId
  const existingKeys = new Set(criteria.map((entry) => entry.key))
  const removeTarget = criteria.find((entry) => entry.key === removeKey)

  return (
    <div className="grid grid-cols-3 gap-5 p-6">
      <div className="col-span-2 space-y-5">
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Job description</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{SPD_DESCRIPTION}</p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-palette-neutral-900">Configured hiring criteria</h2>
              <p className="mt-1 text-sm text-muted-foreground">These are the persistent criteria Copilot uses when evaluating candidates for this role.</p>
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add criterion
            </button>
          </div>

          <div className="mt-3 divide-y divide-border">
            {criteria.map((criterion) => (
              <div key={criterion.key} className="py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-palette-neutral-900">{criterion.name}</p>
                    {criterion.description && <p className="mt-1 text-sm text-muted-foreground">{criterion.description}</p>}
                    <p className="mt-1.5 text-xs text-palette-neutral-400">Evidence sources: Resume · Application · Screening</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <select
                      value={criterion.priority}
                      onChange={(event) => {
                        setCriterionPriority(id, criterion.key, event.target.value as CriterionPriority)
                        pushToast('Criterion priority updated.')
                      }}
                      aria-label={`${criterion.name} priority`}
                      className="rounded-full border border-palette-neutral-250 bg-palette-neutral-150 px-2.5 py-1 text-xs font-medium text-palette-neutral-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
                    >
                      <option value="High">High priority</option>
                      <option value="Medium">Medium priority</option>
                    </select>
                    <CriterionMenu onRemove={() => setRemoveKey(criterion.key)} />
                  </div>
                </div>
              </div>
            ))}
            {criteria.length === 0 && <p className="py-4 text-sm text-muted-foreground">No criteria configured yet.</p>}
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-xl border border-palette-brand-200 bg-palette-brand-100 p-5 shadow-xs">
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

      <AddCriterionDialog open={addOpen} onOpenChange={setAddOpen} openingId={id} existingKeys={existingKeys} />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveKey(null)}
        title={`Remove ${removeTarget?.name}?`}
        consequences={['Stop scoring candidates against this criterion', 'Existing evidence already recorded is kept, not deleted']}
        confirmLabel="Confirm & remove"
        tone="destructive"
        onConfirm={() => {
          if (removeKey) {
            const name = removeTarget?.name
            removeCriterion(id, removeKey)
            if (name) pushToast(`${name} removed from hiring criteria.`)
          }
          setRemoveKey(null)
        }}
      />
    </div>
  )
}
