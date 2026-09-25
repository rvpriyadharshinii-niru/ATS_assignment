import { Activity, ArrowLeft, ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CriterionEvidenceList } from '../components/candidates/CriterionEvidence'
import { RecommendationBadge } from '../components/candidates/RecommendationBadge'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { buildStatusNote } from '../lib/candidateStatus'
import { isUncertainStrength } from '../lib/evidence'
import { advanceConsequences, nextStage } from '../lib/stage'
import { useEffectiveCandidate } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'
import type { Candidate } from '../types/domain'
import { cn } from '../lib/cn'

type OpenDialog = 'advance' | 'hold' | 'reject' | null
type DetailTab = 'evidence' | 'activity'

interface ActivityEntry {
  label: string
  detail?: string
}

function buildActivityEntries(candidate: Candidate): ActivityEntry[] {
  const entries: ActivityEntry[] = []
  if (candidate.source) {
    entries.push({
      label: `Application received via ${candidate.source}`,
      detail: candidate.updatedLabel ? (candidate.updatedLabel === 'Today' ? 'Today' : `${candidate.updatedLabel} ago`) : undefined,
    })
  }
  entries.push({ label: `Currently in ${candidate.stage}` })
  if (candidate.interviewStatus) entries.push({ label: candidate.interviewStatus })
  if (candidate.hold) entries.push({ label: 'Flagged on hold' })
  if (candidate.selected) entries.push({ label: 'Marked as the selected candidate' })
  if (candidate.rejected) entries.push({ label: 'Rejected — removed from the active pipeline' })
  return entries
}

export function CandidateEvidencePage() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const candidate = useEffectiveCandidate(candidateId)
  const setSelectedCandidate = useAppStore((state) => state.setSelectedCandidate)
  const advanceCandidates = useAppStore((state) => state.advanceCandidates)
  const holdCandidates = useAppStore((state) => state.holdCandidates)
  const rejectCandidates = useAppStore((state) => state.rejectCandidates)
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('evidence')

  useEffect(() => {
    if (candidate) setSelectedCandidate(candidate.id, candidate.openingId)
  }, [candidate, setSelectedCandidate])

  if (!candidate) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">This candidate record is not available in the prototype.</p>
        </div>
      </div>
    )
  }

  const opening = getOpening(candidate.openingId)
  const criteria = getCriteria(candidate.openingId)
  const hasUncertainty = candidate.evidence.some((evidence) => isUncertainStrength(evidence.strength))
  const statusNote = buildStatusNote(candidate)
  const upcomingStage = nextStage(candidate.stage)
  const activityEntries = buildActivityEntries(candidate)

  return (
    <div className="space-y-6 p-8">
      <Link
        to={`/openings/${candidate.openingId}/candidates`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-palette-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {opening?.title ?? 'Candidates'}
      </Link>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">{candidate.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {candidate.currentRole && `${candidate.currentRole} · ${candidate.currentCompany} · `}
              {candidate.experienceYears !== undefined && `${candidate.experienceYears} yrs experience`}
              {candidate.experienceYears !== undefined && candidate.location && ' · '}
              {candidate.location}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{candidate.stage}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {candidate.recommendation && <RecommendationBadge label={candidate.recommendation} />}
          {candidate.hold && (
            <span className="rounded-full bg-palette-warning-150 px-2.5 py-1 text-xs font-medium text-palette-warning-700">On hold</span>
          )}
          {candidate.rejected && (
            <span className="rounded-full bg-palette-neutral-150 px-2.5 py-1 text-xs font-medium text-palette-neutral-500">Rejected</span>
          )}
          {candidate.selected && (
            <span className="rounded-full bg-palette-success-150 px-2.5 py-1 text-xs font-medium text-palette-success-700">Selected</span>
          )}
          {candidate.prioritiesSupported !== undefined && (
            <span className="text-sm font-medium text-palette-neutral-700">{candidate.prioritiesSupported} / 5 priorities supported</span>
          )}
          {candidate.screeningScore !== undefined && (
            <span className="text-sm text-palette-neutral-400">AI Screening Score: {candidate.screeningScore}</span>
          )}
        </div>

        {statusNote && <p className="mt-3 text-sm font-medium text-palette-neutral-600">{statusNote}</p>}

        {!candidate.rejected && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {upcomingStage && (
              <button
                type="button"
                onClick={() => setOpenDialog('advance')}
                className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Advance to {upcomingStage}
              </button>
            )}
            {!candidate.hold && (
              <button
                type="button"
                onClick={() => setOpenDialog('hold')}
                className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-palette-neutral-700 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Hold
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpenDialog('reject')}
              className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-palette-neutral-700 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {candidate.summary && (
        <div className="rounded-xl border border-border bg-palette-brand-100/30 p-5 shadow-xs">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">AI assessment</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">{candidate.summary}</p>
        </div>
      )}

      <div>
        <nav className="-mb-px flex items-center gap-5 border-b border-border" aria-label="Candidate sections">
          {(
            [
              { key: 'evidence', label: 'Evidence', icon: ClipboardList },
              { key: 'activity', label: 'Activity', icon: Activity },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium transition-colors focus-visible:outline-none',
                activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-palette-neutral-900',
              )}
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'evidence' ? (
          <div className="mt-5 rounded-xl border border-border bg-card p-6 shadow-xs">
            <CriterionEvidenceList criteria={criteria} evidence={candidate.evidence} />
            {hasUncertainty && (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                Criteria marked <span className="font-medium text-palette-warning-700">Unclear</span> or{' '}
                <span className="font-medium text-palette-warning-700">Not available</span> reflect missing information, not a negative finding.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-border bg-card p-6 shadow-xs">
            <ul className="space-y-4">
              {activityEntries.map((entry, index) => (
                <li key={`${entry.label}-${index}`} className="flex gap-3">
                  <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-foreground">{entry.label}</p>
                    {entry.detail && <p className="text-xs text-muted-foreground">{entry.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {upcomingStage && (
        <ConfirmDialog
          open={openDialog === 'advance'}
          onOpenChange={(open) => setOpenDialog(open ? 'advance' : null)}
          title={`Advance ${candidate.name}?`}
          lines={[`${candidate.stage} → ${upcomingStage}`]}
          consequences={advanceConsequences(upcomingStage)}
          confirmLabel="Confirm & advance"
          onConfirm={() => {
            advanceCandidates([candidate.id], upcomingStage)
            setOpenDialog(null)
          }}
        />
      )}

      <ConfirmDialog
        open={openDialog === 'hold'}
        onOpenChange={(open) => setOpenDialog(open ? 'hold' : null)}
        title={`Hold ${candidate.name}?`}
        lines={[`Stays in ${candidate.stage}`]}
        consequences={['Flag them as on hold', 'Keep their current stage unchanged']}
        confirmLabel="Confirm hold"
        onConfirm={() => {
          holdCandidates([candidate.id])
          setOpenDialog(null)
        }}
      />

      <ConfirmDialog
        open={openDialog === 'reject'}
        onOpenChange={(open) => setOpenDialog(open ? 'reject' : null)}
        title={`Reject ${candidate.name}?`}
        lines={opening ? [opening.title] : []}
        consequences={['Move them to Rejected', 'Remove them from the active hiring pipeline', 'Prepare candidate communication']}
        confirmLabel="Confirm rejection"
        tone="destructive"
        onConfirm={() => {
          rejectCandidates([candidate.id])
          setOpenDialog(null)
        }}
      />
    </div>
  )
}
