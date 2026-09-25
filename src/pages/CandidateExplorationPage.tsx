import * as Dialog from '@radix-ui/react-dialog'
import { Download, Plus, Search, SlidersHorizontal, Sparkles, Star, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AddCandidateDialog } from '../components/candidates/AddCandidateDialog'
import { AdvancedFiltersDrawer } from '../components/candidates/AdvancedFiltersDrawer'
import { BulkMoveStageDialog } from '../components/candidates/BulkMoveStageDialog'
import { CandidatesTable, type SortDirection, type SortKey } from '../components/candidates/CandidatesTable'
import { ComparisonView } from '../components/candidates/ComparisonView'
import { FilterChips } from '../components/candidates/FilterChips'
import { ImportCsvDialog } from '../components/candidates/ImportCsvDialog'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { recommendedCandidateIds } from '../data/candidates'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { buildComparisonSummary } from '../lib/comparison'
import { candidatesToCsv, downloadTextFile } from '../lib/exportCsv'
import { candidateMatchesFilters } from '../lib/evidence'
import { cn } from '../lib/cn'
import { STAGE_ORDER } from '../lib/stage'
import { useEffectiveCandidatesForOpening } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'
import type { Candidate, OpeningId } from '../types/domain'

const MAX_COMPARE = 3
const DEFAULT_DIRECTION: Record<SortKey, SortDirection> = { name: 'asc', score: 'desc', stage: 'asc', updated: 'asc' }

function parseUpdatedDays(label?: string): number {
  if (!label) return Number.POSITIVE_INFINITY
  if (label === 'Today') return 0
  const match = /^(\d+)d$/.exec(label)
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

function sortCandidates(list: Candidate[], sortKey: SortKey | null, direction: SortDirection): Candidate[] {
  if (!sortKey) return list
  const factor = direction === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name) * factor
    if (sortKey === 'score') return ((a.screeningScore ?? -1) - (b.screeningScore ?? -1)) * factor
    if (sortKey === 'stage') return (STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage)) * factor
    return (parseUpdatedDays(a.updatedLabel) - parseUpdatedDays(b.updatedLabel)) * factor
  })
}

export function CandidateExplorationPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const filters = useAppStore((state) => state.filters)
  const clearFilters = useAppStore((state) => state.clearFilters)
  const holdCandidates = useAppStore((state) => state.holdCandidates)
  const rejectCandidates = useAppStore((state) => state.rejectCandidates)
  const openCopilot = useAppStore((state) => state.openCopilot)
  const pool = useEffectiveCandidatesForOpening(opening?.hasDetailedData ? (opening.id as OpeningId) : undefined)
  const [recommendedOnly, setRecommendedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [moveStageOpen, setMoveStageOpen] = useState(false)
  const [holdDialogOpen, setHoldDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

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

  const baseCandidates = recommendedOnly ? pool.filter((candidate) => recommendedCandidateIds.includes(candidate.id)) : pool
  const filtered = baseCandidates.filter((candidate) => candidateMatchesFilters(candidate, filters))
  const searched = isSearching
    ? filtered.filter((candidate) =>
        [candidate.name, candidate.currentRole, candidate.currentCompany].some((value) => value?.toLowerCase().includes(query)),
      )
    : filtered
  const visibleCandidates = sortCandidates(searched, sortKey, sortDirection)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection(DEFAULT_DIRECTION[key])
    }
  }

  function toggleRow(candidateId: string) {
    setSelectedIds((current) => (current.includes(candidateId) ? current.filter((cid) => cid !== candidateId) : [...current, candidateId]))
  }

  function toggleAll() {
    setSelectedIds((current) => (visibleCandidates.every((c) => current.includes(c.id)) ? [] : visibleCandidates.map((c) => c.id)))
  }

  const selectedCandidates = selectedIds.map((sid) => pool.find((candidate) => candidate.id === sid)).filter((c): c is Candidate => c !== undefined)
  const compareCandidates = selectedCandidates.slice(0, MAX_COMPARE)

  function handleExport(scope: 'all' | 'selected') {
    const rows = scope === 'selected' ? selectedCandidates : visibleCandidates
    downloadTextFile(`${opening!.title.toLowerCase().replace(/\s+/g, '-')}-candidates.csv`, candidatesToCsv(rows))
  }

  return (
    <div className="space-y-3 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-palette-neutral-900">Candidates</h1>
          <p className="text-sm text-muted-foreground">
            {visibleCandidates.length} of {opening.totalCandidates}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('all')}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Import
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add candidate
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          {hasFilters && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{filters.length}</span>}
        </button>
        <button
          type="button"
          onClick={() => setRecommendedOnly((current) => !current)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            recommendedOnly ? 'border-palette-brand-300 bg-accent text-accent-foreground' : 'border-border text-foreground hover:bg-muted',
          )}
        >
          <Star className="h-4 w-4" aria-hidden="true" />
          Recommended
        </button>
      </div>

      <FilterChips />

      {visibleCandidates.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-palette-neutral-700">No candidates match {hasFilters || recommendedOnly ? 'these filters' : 'this search'}.</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            {(hasFilters || recommendedOnly) && (
              <button
                type="button"
                onClick={() => {
                  clearFilters()
                  setRecommendedOnly(false)
                }}
                className="text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              onClick={openCopilot}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Ask Copilot to broaden this search
            </button>
          </div>
        </div>
      ) : (
        <div className="pb-16">
          <CandidatesTable
            candidates={visibleCandidates}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </div>
      )}

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
            onClick={() => handleExport('selected')}
            className="text-sm font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Export
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

      <AdvancedFiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} openingId={id} pool={pool} />
      <AddCandidateDialog open={addOpen} onOpenChange={setAddOpen} openingId={id} openingTitle={opening.title} />
      <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} openingId={id} openingTitle={opening.title} />
    </div>
  )
}
