import { GitCompare, Search, Sparkles, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RecommendationBadge } from '../components/candidates/RecommendationBadge'
import { Avatar, EmptyState } from '../components/workspace/ui'
import { btn, inputBase } from '../components/workspace/styles'
import { getOpening, openings } from '../data/openings'
import { hasSourceDocuments } from '../data/sources'
import { cn } from '../lib/cn'
import { STAGE_TONE } from '../lib/stageTone'
import { useAllEffectiveCandidates } from '../store/candidateSelectors'
import { useLaunchTask } from '../workspace/presets'

/**
 * Cross-job directory: the structured, no-chat way to find people. Selecting two or three rows and
 * choosing "Compare with AI" opens the same comparison task a typed request would.
 */
export function CandidatesPage() {
  const candidates = useAllEffectiveCandidates()
  const launch = useLaunchTask()
  const [query, setQuery] = useState('')
  const [job, setJob] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return candidates
      .filter((candidate) => showInactive || !candidate.rejected)
      .filter((candidate) => job === 'all' || candidate.openingId === job)
      .filter((candidate) => !needle || [candidate.name, candidate.currentRole, candidate.currentCompany, candidate.location, candidate.stage].some((value) => value?.toLowerCase().includes(needle)))
      .sort((a, b) => (b.screeningScore ?? -1) - (a.screeningScore ?? -1))
  }, [candidates, query, job, showInactive])

  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : current.length >= 3 ? current : [...current, id]))
  const selectedCandidates = selected.map((id) => candidates.find((candidate) => candidate.id === id)).filter((candidate) => !!candidate)

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">Candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everyone across your open jobs. Select two or three people to compare them with AI, or open a profile.</p>
        </div>
        <button type="button" className={btn.secondary} onClick={() => launch("Review today's new applicants", { key: 'applicant-review:spd' })}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Review new applicants with AI
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-palette-neutral-400" aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, role, company, location or stage" className={cn(inputBase, 'pl-9')} aria-label="Search candidates" />
        </label>
        <select value={job} onChange={(event) => setJob(event.target.value)} className={cn(inputBase, 'w-auto')} aria-label="Job">
          <option value="all">All jobs</option>
          {openings.map((opening) => (
            <option key={opening.id} value={opening.id}>
              {opening.title}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-palette-neutral-700">
          <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
          Show declined
        </label>
      </div>

      {selected.length > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-palette-brand-300 bg-palette-brand-100 px-4 py-2.5">
          <p className="text-sm font-medium text-palette-brand-800">
            {selectedCandidates.map((candidate) => candidate.name).join(', ')}
            {selected.length >= 3 && <span className="ml-2 text-xs font-normal">(3 is the most AI compares at once)</span>}
          </p>
          <div className="ml-auto flex gap-2">
            <button type="button" className={btn.ghost} onClick={() => setSelected([])}>
              Clear
            </button>
            <button
              type="button"
              className={btn.primary}
              disabled={selected.length < 2}
              title={selected.length < 2 ? 'Select at least two people' : undefined}
              onClick={() => launch(`Compare ${selectedCandidates.map((candidate) => candidate.name).join(' and ')}`, { candidateIds: selected })}
            >
              <GitCompare className="h-4 w-4" aria-hidden="true" />
              Compare with AI
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No one matches" body="Try a different search or job." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-palette-neutral-550">
                <th className="w-10 px-3 py-2.5">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-2.5 font-semibold">Candidate</th>
                <th className="px-3 py-2.5 font-semibold">Job</th>
                <th className="px-3 py-2.5 font-semibold">Stage</th>
                <th className="px-3 py-2.5 font-semibold">AI fit</th>
                <th className="px-3 py-2.5 font-semibold">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((candidate) => {
                const checked = selected.includes(candidate.id)
                return (
                  <tr key={candidate.id} className={cn('hover:bg-muted/60', checked && 'bg-palette-brand-100/40', candidate.rejected && 'opacity-60')}>
                    <td className="px-3 py-2.5">
                      <input type="checkbox" checked={checked} onChange={() => toggle(candidate.id)} disabled={!checked && selected.length >= 3} aria-label={`Select ${candidate.name}`} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Link to={`/candidates/${candidate.id}`} className="flex items-center gap-2.5">
                        <Avatar name={candidate.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block font-medium text-palette-neutral-900 hover:underline">{candidate.name}</span>
                          <span className="block truncate text-xs text-palette-neutral-550">{[candidate.currentRole, candidate.currentCompany].filter(Boolean).join(' · ') || '—'}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-palette-neutral-700">{getOpening(candidate.openingId)?.title}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', STAGE_TONE[candidate.stage])}>{candidate.rejected ? 'Declined' : candidate.stage}</span>
                    </td>
                    <td className="px-3 py-2.5">{candidate.recommendation ? <RecommendationBadge label={candidate.recommendation} /> : <span className="text-xs text-palette-neutral-500">Not assessed</span>}</td>
                    <td className="px-3 py-2.5 text-xs text-palette-neutral-600">{hasSourceDocuments(candidate.id) ? 'Resume on file' : 'Summary only'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
