import { ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buildStatusNote } from '../../lib/candidateStatus'
import { cn } from '../../lib/cn'
import type { Candidate } from '../../types/domain'
import { CandidateActionsMenu } from './CandidateActionsMenu'
import { RecommendationBadge } from './RecommendationBadge'

export type SortKey = 'name' | 'score' | 'stage' | 'updated'
export type SortDirection = 'asc' | 'desc'

const STAGE_TONE: Record<string, string> = {
  Applied: 'bg-palette-neutral-150 text-palette-neutral-600',
  'AI Screened': 'bg-palette-info-150 text-palette-info-700',
  'HM Review': 'bg-palette-brand-100 text-palette-brand-700',
  Interview: 'bg-palette-warning-150 text-palette-warning-700',
  Final: 'bg-palette-plum-150 text-palette-plum-700',
  Offer: 'bg-palette-success-150 text-palette-success-700',
}

function SortableHeaderCell({
  children,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
  className,
}: {
  children: React.ReactNode
  sortKey?: SortKey
  activeSortKey: SortKey | null
  sortDirection: SortDirection
  onSort: (key: SortKey) => void
  className?: string
}) {
  if (!sortKey) {
    return (
      <th
        className={cn(
          'sticky top-0 z-10 border-b border-border bg-palette-brand-100 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-brand-700',
          className,
        )}
      >
        {children}
      </th>
    )
  }
  const isActive = activeSortKey === sortKey
  return (
    <th className={cn('sticky top-0 z-10 border-b border-border bg-palette-brand-100 px-3 py-2.5 text-left', className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-0.5 text-xs font-semibold uppercase tracking-wide hover:text-palette-brand-800 focus-visible:outline-none',
          isActive ? 'text-palette-brand-800' : 'text-palette-brand-700',
        )}
      >
        {children}
        {isActive &&
          (sortDirection === 'asc' ? (
            <ChevronUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          ))}
      </button>
    </th>
  )
}

export function CandidatesTable({
  candidates,
  selectedIds,
  onToggleRow,
  onToggleAll,
  sortKey,
  sortDirection,
  onSort,
}: {
  candidates: Candidate[]
  selectedIds: string[]
  onToggleRow: (id: string) => void
  onToggleAll: () => void
  sortKey: SortKey | null
  sortDirection: SortDirection
  onSort: (key: SortKey) => void
}) {
  const allSelected = candidates.length > 0 && candidates.every((candidate) => selectedIds.includes(candidate.id))

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky top-0 z-10 w-10 border-b border-border bg-palette-brand-100 px-3 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Select all candidates"
                className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </th>
            <SortableHeaderCell sortKey="name" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
              Candidate
            </SortableHeaderCell>
            <SortableHeaderCell activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
              Role
            </SortableHeaderCell>
            <SortableHeaderCell activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
              Company
            </SortableHeaderCell>
            <SortableHeaderCell activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
              Recommendation
            </SortableHeaderCell>
            <SortableHeaderCell activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
              Priorities met
            </SortableHeaderCell>
            <SortableHeaderCell sortKey="score" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
              AI score
            </SortableHeaderCell>
            <SortableHeaderCell activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
              Source
            </SortableHeaderCell>
            <SortableHeaderCell sortKey="stage" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
              Stage
            </SortableHeaderCell>
            <SortableHeaderCell sortKey="updated" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
              Updated
            </SortableHeaderCell>
            <th className="sticky top-0 z-10 w-10 border-b border-border bg-palette-brand-100 px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate, index) => {
            const selected = selectedIds.includes(candidate.id)
            const statusNote = buildStatusNote(candidate)
            return (
              <tr
                key={candidate.id}
                className={cn(
                  'border-b border-border last:border-0 hover:bg-palette-brand-100/40',
                  index % 2 === 1 && 'bg-palette-neutral-100/40',
                  candidate.rejected && 'opacity-50',
                  selected && 'bg-palette-brand-100/60',
                )}
              >
                <td className="px-3 py-2.5 align-top">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleRow(candidate.id)}
                    aria-label={`Select ${candidate.name}`}
                    className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </td>
                <td className="px-3 py-2.5 align-top">
                  <Link
                    to={`/candidates/${candidate.id}`}
                    className="font-semibold text-palette-neutral-900 hover:text-primary focus-visible:outline-none focus-visible:underline"
                  >
                    {candidate.name}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {candidate.hold && (
                      <span className="rounded-full bg-palette-warning-150 px-1.5 py-0.5 text-[10px] font-medium text-palette-warning-700">On hold</span>
                    )}
                    {candidate.rejected && (
                      <span className="rounded-full bg-palette-neutral-150 px-1.5 py-0.5 text-[10px] font-medium text-palette-neutral-500">Rejected</span>
                    )}
                    {candidate.selected && (
                      <span className="rounded-full bg-palette-success-150 px-1.5 py-0.5 text-[10px] font-medium text-palette-success-700">Selected</span>
                    )}
                  </div>
                  {statusNote && <p className="mt-0.5 text-xs text-palette-neutral-500">{statusNote}</p>}
                </td>
                <td className="px-3 py-2.5 align-top text-foreground">{candidate.currentRole ?? '—'}</td>
                <td className="px-3 py-2.5 align-top text-muted-foreground">{candidate.currentCompany ?? '—'}</td>
                <td className="px-3 py-2.5 align-top">{candidate.recommendation ? <RecommendationBadge label={candidate.recommendation} /> : '—'}</td>
                <td className="px-3 py-2.5 align-top">
                  {candidate.prioritiesSupported !== undefined ? (
                    <span className="inline-flex rounded-md bg-palette-neutral-150 px-2 py-0.5 text-xs font-semibold text-palette-neutral-700">
                      {candidate.prioritiesSupported}/5
                    </span>
                  ) : (
                    <span className="inline-flex rounded-md bg-palette-neutral-100 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {candidate.notableGap ? 'Partial' : 'Needs info'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 align-top text-sm text-muted-foreground">
                  {candidate.screeningScore ?? '—'}
                </td>
                <td className="px-3 py-2.5 align-top text-muted-foreground">{candidate.source ?? '—'}</td>
                <td className="px-3 py-2.5 align-top">
                  <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', STAGE_TONE[candidate.stage])}>{candidate.stage}</span>
                </td>
                <td className="px-3 py-2.5 align-top text-xs text-muted-foreground">{candidate.updatedLabel ?? '—'}</td>
                <td className="px-3 py-2.5 align-top">
                  <CandidateActionsMenu candidate={candidate} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
