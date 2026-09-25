import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { FilterChips } from '../components/candidates/FilterChips'
import { getCandidatesForOpening, recommendedCandidateIds } from '../data/candidates'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { candidateMatchesFilters } from '../lib/evidence'
import { useAppStore } from '../store/useAppStore'
import type { OpeningId } from '../types/domain'

export function CandidateExplorationPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)
  const filters = useAppStore((state) => state.filters)
  const clearFilters = useAppStore((state) => state.clearFilters)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (opening) setSelectedOpening(opening.id)
  }, [opening, setSelectedOpening])

  if (!opening || !opening.hasDetailedData) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm text-neutral-500">Detailed candidate records are not yet available for this opening in the prototype.</p>
      </div>
    )
  }

  const criteria = getCriteria(opening.id as OpeningId)
  const pool = getCandidatesForOpening(opening.id as OpeningId)
  const hasFilters = filters.length > 0
  const baseCandidates = hasFilters || showAll ? pool : pool.filter((candidate) => recommendedCandidateIds.includes(candidate.id))
  const visibleCandidates = baseCandidates.filter((candidate) => candidateMatchesFilters(candidate, filters))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{opening.title}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {opening.totalCandidates} total candidates · {pool.length} with detailed records in this prototype
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Configured criteria</p>
        <p className="mt-1 text-sm text-neutral-600">
          {criteria.map((criterion, index) => (
            <span key={criterion.key}>
              {criterion.name}
              <span className="text-neutral-400"> ({criterion.priority})</span>
              {index < criteria.length - 1 && <span className="text-neutral-300"> · </span>}
            </span>
          ))}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips />
        {!hasFilters && (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {showAll ? 'Show recommended candidates' : 'View all candidates'}
          </button>
        )}
      </div>

      {visibleCandidates.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-neutral-700">No candidates match the current filters</p>
          <p className="mt-1 text-sm text-neutral-500">Try relaxing or removing a filter to see more candidates.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Clear filters
          </button>
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
