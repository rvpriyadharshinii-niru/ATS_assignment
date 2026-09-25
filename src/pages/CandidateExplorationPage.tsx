import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)
  const filters = useAppStore((state) => state.filters)
  const clearFilters = useAppStore((state) => state.clearFilters)
  const [showAll, setShowAll] = useState(false)
  const [criteriaOpen, setCriteriaOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('recommended')

  useEffect(() => {
    if (opening) setSelectedOpening(opening.id)
  }, [opening, setSelectedOpening])

  if (!opening || !opening.hasDetailedData) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Candidate records for this opening aren&rsquo;t available yet.</p>
      </div>
    )
  }

  const criteria = getCriteria(opening.id as OpeningId)
  const pool = getCandidatesForOpening(opening.id as OpeningId)
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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">{opening.title}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
          <span>{opening.totalCandidates} total candidates</span>
          <span className="text-palette-neutral-300">·</span>
          <span>Evaluating against {criteria.length} configured criteria</span>
          <button
            type="button"
            onClick={() => setCriteriaOpen((current) => !current)}
            className="font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {criteriaOpen ? 'Hide criteria' : 'View criteria'}
          </button>
        </div>
        {criteriaOpen && (
          <div className="mt-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
            {criteria.map((criterion, index) => (
              <span key={criterion.key}>
                {criterion.name}
                <span className="text-muted-foreground"> ({criterion.priority})</span>
                {index < criteria.length - 1 && <span className="text-palette-neutral-300"> · </span>}
              </span>
            ))}
          </div>
        )}
      </div>

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
          <p className="font-sans mt-1 text-sm text-muted-foreground">Try a different search term, or relax the applied filters.</p>
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
  )
}
