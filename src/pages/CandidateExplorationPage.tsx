import * as Dialog from '@radix-ui/react-dialog'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { ComparisonView } from '../components/candidates/ComparisonView'
import { FilterChips } from '../components/candidates/FilterChips'
import { recommendedCandidateIds } from '../data/candidates'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { buildComparisonSummary } from '../lib/comparison'
import { candidateMatchesFilters } from '../lib/evidence'
import { useEffectiveCandidatesForOpening } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'
import type { Candidate, OpeningId } from '../types/domain'

type SortKey = 'recommended' | 'experience' | 'score'
const MAX_COMPARE = 3

function sortCandidates(list: Candidate[], sortKey: SortKey): Candidate[] {
  if (sortKey === 'experience') return [...list].sort((a, b) => (b.experienceYears ?? 0) - (a.experienceYears ?? 0))
  if (sortKey === 'score') return [...list].sort((a, b) => (b.screeningScore ?? -1) - (a.screeningScore ?? -1))
  return list
}

export function CandidateExplorationPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const filters = useAppStore((state) => state.filters)
  const clearFilters = useAppStore((state) => state.clearFilters)
  const pool = useEffectiveCandidatesForOpening(opening?.hasDetailedData ? (opening.id as OpeningId) : undefined)
  const [showAll, setShowAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('recommended')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  if (!opening || !opening.hasDetailedData) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Candidate records for this opening aren&rsquo;t available yet.</p>
        </div>
      </div>
    )
  }

  const id = opening.id as OpeningId
  const criteria = getCriteria(id)
  const recommendedCount = pool.filter((candidate) => recommendedCandidateIds.includes(candidate.id)).length
  const hasFilters = filters.length > 0
  const isSearching = searchQuery.trim().length > 0
  const query = searchQuery.trim().toLowerCase()

  const baseCandidates = hasFilters || showAll || isSearching ? pool : pool.filter((candidate) => recommendedCandidateIds.includes(candidate.id))
  const filtered = baseCandidates.filter((candidate) => candidateMatchesFilters(candidate, filters))
  const searched = isSearching
    ? filtered.filter((candidate) =>
        [candidate.name, candidate.currentRole, candidate.currentCompany].some((value) => value?.toLowerCase().includes(query)),
      )
    : filtered
  const visibleCandidates = sortCandidates(searched, sortKey)

  function toggleCompare(candidateId: string) {
    setCompareIds((current) => {
      if (current.includes(candidateId)) return current.filter((id) => id !== candidateId)
      if (current.length >= MAX_COMPARE) return current
      return [...current, candidateId]
    })
  }

  const compareCandidates = compareIds.map((cid) => pool.find((candidate) => candidate.id === cid)).filter((c): c is Candidate => c !== undefined)

  return (
    <div className="grid grid-cols-3 gap-6 p-8">
      <div className="col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-[220px] max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-palette-neutral-400" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search candidates…"
                aria-label="Search candidates"
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-palette-neutral-900 placeholder:text-palette-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Sort
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="rounded-lg border border-border bg-card py-2 pl-2.5 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="recommended">Recommended</option>
                <option value="experience">Experience</option>
                <option value="score">AI Screening Score</option>
              </select>
            </label>
          </div>
          {!hasFilters && !isSearching && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showAll ? 'Show recommended candidates' : 'View all candidates'}
            </button>
          )}
        </div>

        <FilterChips />

        {visibleCandidates.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm font-medium text-palette-neutral-700">No candidates match the current view</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search term, or relax the applied filters.</p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 pb-16">
            {visibleCandidates.map((candidate) => (
              <div key={candidate.id} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={compareIds.includes(candidate.id)}
                  onChange={() => toggleCompare(candidate.id)}
                  disabled={!compareIds.includes(candidate.id) && compareIds.length >= MAX_COMPARE}
                  aria-label={`Select ${candidate.name} for comparison`}
                  className="h-4 w-4 shrink-0 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                />
                <div className="min-w-0 flex-1">
                  <CandidateCard candidate={candidate} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Candidate pool</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-semibold text-palette-neutral-900">{opening.totalCandidates}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-palette-neutral-900">{pool.length}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Detailed</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-palette-brand-600">{recommendedCount}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Recommended</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-palette-neutral-900">Configured criteria</h2>
            <Link to={`/openings/${id}/criteria`} className="text-xs font-medium text-primary hover:text-palette-brand-600">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {criteria.map((criterion) => (
              <li key={criterion.key} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">{criterion.name}</span>
                <span className="text-xs text-muted-foreground">{criterion.priority}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg">
          <span className="text-sm text-foreground">{compareIds.length} selected for comparison</span>
          <button
            type="button"
            onClick={() => setCompareIds([])}
            className="text-sm font-medium text-muted-foreground hover:text-palette-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            disabled={compareIds.length < 2}
            className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            Compare
          </button>
        </div>
      )}

      <Dialog.Root open={compareOpen} onOpenChange={setCompareOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-palette-neutral-900/30" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-2.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
            <div className="flex items-center justify-between gap-4">
              <Dialog.Title className="text-base font-semibold text-palette-neutral-900">Compare candidates</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close comparison"
                  className="rounded-md p-1.5 text-palette-neutral-400 hover:bg-muted hover:text-palette-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>
            {compareCandidates.length >= 2 && (
              <div className="mt-4">
                <ComparisonView candidates={compareCandidates} criteria={criteria} summary={buildComparisonSummary(compareCandidates, criteria)} />
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
