import * as Dialog from '@radix-ui/react-dialog'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BulkMoveStageDialog } from '../components/candidates/BulkMoveStageDialog'
import { CandidatesTable } from '../components/candidates/CandidatesTable'
import { ComparisonView } from '../components/candidates/ComparisonView'
import { FilterChips } from '../components/candidates/FilterChips'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { recommendedCandidateIds } from '../data/candidates'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { buildComparisonSummary } from '../lib/comparison'
import { candidateMatchesFilters } from '../lib/evidence'
import { useEffectiveCandidatesForOpening } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'
import type { Candidate, CandidateStage, OpeningId } from '../types/domain'

type SortKey = 'recommended' | 'experience' | 'score'
type ViewFilter = 'all' | 'recommended' | CandidateStage
const MAX_COMPARE = 3
const STAGE_OPTIONS: CandidateStage[] = ['Applied', 'AI Screened', 'HM Review', 'Interview', 'Final', 'Offer']

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
  const holdCandidates = useAppStore((state) => state.holdCandidates)
  const rejectCandidates = useAppStore((state) => state.rejectCandidates)
  const pool = useEffectiveCandidatesForOpening(opening?.hasDetailedData ? (opening.id as OpeningId) : undefined)
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('recommended')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [moveStageOpen, setMoveStageOpen] = useState(false)
  const [holdDialogOpen, setHoldDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

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
  const hasFilters = filters.length > 0
  const isSearching = searchQuery.trim().length > 0
  const query = searchQuery.trim().toLowerCase()

  const baseCandidates = hasFilters
    ? pool
    : viewFilter === 'all'
      ? pool
      : viewFilter === 'recommended'
        ? pool.filter((candidate) => recommendedCandidateIds.includes(candidate.id))
        : pool.filter((candidate) => candidate.stage === viewFilter)
  const filtered = baseCandidates.filter((candidate) => candidateMatchesFilters(candidate, filters))
  const searched = isSearching
    ? filtered.filter((candidate) =>
        [candidate.name, candidate.currentRole, candidate.currentCompany].some((value) => value?.toLowerCase().includes(query)),
      )
    : filtered
  const visibleCandidates = sortCandidates(searched, sortKey)

  function toggleRow(candidateId: string) {
    setSelectedIds((current) => (current.includes(candidateId) ? current.filter((cid) => cid !== candidateId) : [...current, candidateId]))
  }

  function toggleAll() {
    setSelectedIds((current) => (visibleCandidates.every((c) => current.includes(c.id)) ? [] : visibleCandidates.map((c) => c.id)))
  }

  const selectedCandidates = selectedIds.map((sid) => pool.find((candidate) => candidate.id === sid)).filter((c): c is Candidate => c !== undefined)
  const compareCandidates = selectedCandidates.slice(0, MAX_COMPARE)

  return (
    <div className="space-y-4 p-8">
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
          <span className="text-sm text-muted-foreground">{visibleCandidates.length} of {opening.totalCandidates}</span>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Show
          <select
            value={viewFilter}
            onChange={(event) => setViewFilter(event.target.value as ViewFilter)}
            disabled={hasFilters}
            className="rounded-lg border border-border bg-card py-2 pl-2.5 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <optgroup label="Filter">
              <option value="all">All candidates</option>
              <option value="recommended">Recommended</option>
            </optgroup>
            <optgroup label="By stage">
              {STAGE_OPTIONS.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      </div>

      <FilterChips />

      {visibleCandidates.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-palette-neutral-700">No candidates match the current view</p>
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
        <div className="pb-16">
          <CandidatesTable candidates={visibleCandidates} selectedIds={selectedIds} onToggleRow={toggleRow} onToggleAll={toggleAll} />
        </div>
      )}

      <Link to={`/openings/${id}/criteria`} className="inline-block text-xs font-medium text-primary hover:text-palette-brand-600">
        View configured criteria ({criteria.length})
      </Link>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg">
          <span className="text-sm font-medium text-foreground">{selectedIds.length} selected</span>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-sm font-medium text-muted-foreground hover:text-palette-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear
          </button>
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            disabled={selectedIds.length < 2}
            className="text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            Compare
          </button>
          <button
            type="button"
            onClick={() => setMoveStageOpen(true)}
            className="text-sm font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Move stage
          </button>
          <button
            type="button"
            onClick={() => setHoldDialogOpen(true)}
            className="text-sm font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Hold
          </button>
          <button
            type="button"
            onClick={() => setRejectDialogOpen(true)}
            className="text-sm font-medium text-destructive hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reject
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

      <BulkMoveStageDialog open={moveStageOpen} onOpenChange={setMoveStageOpen} candidates={selectedCandidates} />

      <ConfirmDialog
        open={holdDialogOpen}
        onOpenChange={setHoldDialogOpen}
        title={`Hold ${selectedIds.length} candidates?`}
        lines={selectedCandidates.map((c) => c.name)}
        consequences={['Flag them as on hold', 'Keep their current stage unchanged']}
        confirmLabel="Confirm hold"
        onConfirm={() => {
          holdCandidates(selectedIds)
          setHoldDialogOpen(false)
          setSelectedIds([])
        }}
      />

      <ConfirmDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title={`Reject ${selectedIds.length} candidates?`}
        lines={selectedCandidates.map((c) => c.name)}
        consequences={['Move them to Rejected', 'Remove them from the active hiring pipeline', 'Prepare candidate communication']}
        confirmLabel="Confirm rejection"
        tone="destructive"
        onConfirm={() => {
          rejectCandidates(selectedIds)
          setRejectDialogOpen(false)
          setSelectedIds([])
        }}
      />
    </div>
  )
}
