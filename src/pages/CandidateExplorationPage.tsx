import { Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { FilterChips } from '../components/candidates/FilterChips'
import { getCandidatesForOpening, recommendedCandidateIds } from '../data/candidates'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { candidateMatchesFilters } from '../lib/evidence'
import { useAppStore } from '../store/useAppStore'
import type { Candidate, OpeningId } from '../types/domain'

type SortKey = 'recommended' | 'experience' | 'score'

function sortCandidates(list: Candidate[], sortKey: SortKey): Candidate[] {
  if (sortKey === 'experience') return [...list].sort((a, b) => b.experienceYears - a.experienceYears)
  if (sortKey === 'score') return [...list].sort((a, b) => (b.screeningScore ?? -1) - (a.screeningScore ?? -1))
  return list
}

export function CandidateExplorationPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const filters = useAppStore((state) => state.filters)
  const clearFilters = useAppStore((state) => state.clearFilters)
  const [showAll, setShowAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('recommended')

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
  const pool = getCandidatesForOpening(id)
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
          <div className="space-y-2">
            {visibleCandidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
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
    </div>
  )
}
