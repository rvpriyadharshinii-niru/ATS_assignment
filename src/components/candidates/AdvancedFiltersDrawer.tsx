import * as Dialog from '@radix-ui/react-dialog'
import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { matchCriterionKeyword } from '../../lib/criterionKeywords'
import { useAppStore } from '../../store/useAppStore'
import type { Candidate, CandidateFilter, CandidateSource, CandidateStage, OpeningId, RecommendationLabel } from '../../types/domain'
import { getCriterionName } from '../../data/criteria'

const STAGE_OPTIONS: CandidateStage[] = ['Applied', 'AI Screened', 'HM Review', 'Interview', 'Final', 'Offer']
const RECOMMENDATION_OPTIONS: RecommendationLabel[] = ['Strong match', 'Good match', 'Potential match', 'Promising', 'Needs more information']
const SOURCE_OPTIONS: CandidateSource[] = ['LinkedIn', 'Career site', 'Referral', 'Agency', 'Manual', 'CSV Import']

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 py-1 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {label}
    </label>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-400">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

export function AdvancedFiltersDrawer({
  open,
  onOpenChange,
  openingId,
  pool,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  openingId: OpeningId
  pool: Candidate[]
}) {
  const filters = useAppStore((state) => state.filters)
  const addFilter = useAppStore((state) => state.addFilter)
  const removeFilter = useAppStore((state) => state.removeFilter)
  const clearFilters = useAppStore((state) => state.clearFilters)
  const [aiQuery, setAiQuery] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  const [experienceInput, setExperienceInput] = useState('')

  const locations = [...new Set(pool.map((candidate) => candidate.location).filter((value): value is string => Boolean(value)))].sort()

  function toggle(existing: CandidateFilter | undefined, build: () => CandidateFilter) {
    if (existing) removeFilter(existing.id)
    else addFilter(build())
  }

  function handleAiSubmit() {
    const query = aiQuery.trim()
    if (!query) return
    const criterionKey = matchCriterionKeyword(query)
    if (!criterionKey) {
      setAiError('No matching evidence area — try mentioning one like "design systems" or "AI product experience".')
      return
    }
    setAiError(null)
    const criterionName = getCriterionName(openingId, criterionKey)
    addFilter({ id: `ai-${criterionKey}`, label: `${criterionName} · Strong`, source: 'ai', kind: 'criterion', criterionKey, minStrength: 'Strong' })
    setAiQuery('')
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-palette-neutral-900/20" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[380px] max-w-[calc(100vw-2.5rem)] flex-col border-l border-border bg-card shadow-xl focus:outline-none">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
            <Dialog.Title className="text-sm font-semibold text-palette-neutral-900">Advanced filters</Dialog.Title>
            <div className="flex items-center gap-1">
              {filters.length > 0 && (
                <button type="button" onClick={clearFilters} className="text-xs font-medium text-primary hover:text-palette-brand-600">
                  Clear all
                </button>
              )}
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close filters"
                  className="rounded-md p-1.5 text-palette-neutral-400 hover:bg-muted hover:text-palette-neutral-600"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            <FilterSection title="AI search">
              <div className="flex items-center gap-1.5 rounded-lg border border-palette-brand-250 bg-palette-brand-100/40 p-1.5">
                <Sparkles className="ml-1 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <input
                  value={aiQuery}
                  onChange={(event) => setAiQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleAiSubmit()}
                  placeholder="e.g. Strong in design systems"
                  className="min-w-0 flex-1 bg-transparent px-1 py-1 text-sm text-foreground placeholder:text-palette-neutral-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAiSubmit}
                  className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Apply
                </button>
              </div>
              {aiError && <p className="mt-1.5 text-xs text-palette-warning-700">{aiError}</p>}
            </FilterSection>

            <FilterSection title="Stage">
              {STAGE_OPTIONS.map((stage) => {
                const existing = filters.find((f) => f.kind === 'stage' && f.stage === stage)
                return (
                  <CheckboxRow
                    key={stage}
                    label={stage}
                    checked={!!existing}
                    onChange={() => toggle(existing, () => ({ id: `stage-${stage}`, label: `Stage: ${stage}`, source: 'manual', kind: 'stage', stage }))}
                  />
                )
              })}
            </FilterSection>

            <FilterSection title="Recommendation">
              {RECOMMENDATION_OPTIONS.map((recommendation) => {
                const existing = filters.find((f) => f.kind === 'recommendation' && f.recommendation === recommendation)
                return (
                  <CheckboxRow
                    key={recommendation}
                    label={recommendation}
                    checked={!!existing}
                    onChange={() =>
                      toggle(existing, () => ({
                        id: `recommendation-${recommendation}`,
                        label: recommendation,
                        source: 'manual',
                        kind: 'recommendation',
                        recommendation,
                      }))
                    }
                  />
                )
              })}
            </FilterSection>

            <FilterSection title="Experience">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={experienceInput}
                  onChange={(event) => setExperienceInput(event.target.value)}
                  placeholder="Min years"
                  className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                <button
                  type="button"
                  onClick={() => {
                    const years = Number(experienceInput)
                    const existing = filters.find((f) => f.kind === 'experience')
                    if (existing) removeFilter(existing.id)
                    if (experienceInput.trim() && !Number.isNaN(years) && years > 0) {
                      addFilter({ id: 'experience-min', label: `Experience: ${years}+ yrs`, source: 'manual', kind: 'experience', minExperienceYears: years })
                    }
                  }}
                  className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Apply
                </button>
              </div>
            </FilterSection>

            {locations.length > 0 && (
              <FilterSection title="Location">
                {locations.map((location) => {
                  const existing = filters.find((f) => f.kind === 'location' && f.location === location)
                  return (
                    <CheckboxRow
                      key={location}
                      label={location}
                      checked={!!existing}
                      onChange={() =>
                        toggle(existing, () => ({ id: `location-${location}`, label: `Location: ${location}`, source: 'manual', kind: 'location', location }))
                      }
                    />
                  )
                })}
              </FilterSection>
            )}

            <FilterSection title="Source">
              {SOURCE_OPTIONS.map((candidateSource) => {
                const existing = filters.find((f) => f.kind === 'candidateSource' && f.candidateSource === candidateSource)
                return (
                  <CheckboxRow
                    key={candidateSource}
                    label={candidateSource}
                    checked={!!existing}
                    onChange={() =>
                      toggle(existing, () => ({
                        id: `source-${candidateSource}`,
                        label: `Source: ${candidateSource}`,
                        source: 'manual',
                        kind: 'candidateSource',
                        candidateSource,
                      }))
                    }
                  />
                )
              })}
            </FilterSection>
          </div>

          <div className="border-t border-border px-4 py-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="w-full rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Done
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
