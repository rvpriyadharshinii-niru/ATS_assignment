import {
  Activity,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileText,
  Home,
  Mail,
  MoreHorizontal,
  PauseCircle,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { useEffect, useState, type ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CriterionEvidenceList } from '../components/candidates/CriterionEvidence'
import { EmailComposeDialog } from '../components/candidates/EmailComposeDialog'
import { RecommendationBadge } from '../components/candidates/RecommendationBadge'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { buildStatusNote } from '../lib/candidateStatus'
import { cn } from '../lib/cn'
import { needsValidationCriteriaNames, strongCriteriaNames } from '../lib/criteriaSummary'
import { isUncertainStrength } from '../lib/evidence'
import { advanceConsequences, nextStage } from '../lib/stage'
import { useEffectiveCandidate } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'
import type { ActivityEvent, Candidate } from '../types/domain'

type OpenDialog = 'advance' | 'hold' | 'reject' | 'email' | null
type DetailTab = 'evidence' | 'activity'

function initialsFor(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function activityIcon(message: string): ComponentType<{ className?: string }> {
  if (message.startsWith('Moved')) return ArrowRight
  if (message.startsWith('Email sent')) return Mail
  if (message.startsWith('Flagged on hold')) return PauseCircle
  if (message.startsWith('Rejected')) return XCircle
  if (message.startsWith('Marked as the selected')) return CheckCircle2
  if (message.startsWith('Application received') || message.startsWith('Imported') || message.startsWith('Candidate added')) return FileText
  return Activity
}

function formatEventTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** Base context entries every candidate has, shown under the real (timestamped) activity log. */
function buildSeedEntries(candidate: Candidate): { label: string; detail?: string }[] {
  const entries: { label: string; detail?: string }[] = []
  if (candidate.source) {
    entries.push({
      label: `Application received via ${candidate.source}`,
      detail: candidate.updatedLabel ? (candidate.updatedLabel === 'Today' ? 'Today' : `${candidate.updatedLabel} ago`) : undefined,
    })
  }
  if (candidate.interviewStatus) entries.push({ label: candidate.interviewStatus })
  return entries
}

function OverflowMenu({ onEmail, onReject, rejected }: { onEmail: () => void; onReject: () => void; rejected: boolean }) {
  const [open, setOpen] = useState(false)
  if (rejected) return null
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="More actions"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-palette-neutral-500 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onEmail()
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              Send email
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onReject()
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-muted"
            >
              Reject
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function CandidateEvidencePage() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const candidate = useEffectiveCandidate(candidateId)
  const setSelectedCandidate = useAppStore((state) => state.setSelectedCandidate)
  const advanceCandidates = useAppStore((state) => state.advanceCandidates)
  const holdCandidates = useAppStore((state) => state.holdCandidates)
  const rejectCandidates = useAppStore((state) => state.rejectCandidates)
  const activityLog = useAppStore((state) => state.activityLog)
  const pushToast = useAppStore((state) => state.pushToast)
  const undoLastMutation = useAppStore((state) => state.undoLastMutation)
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
  const seedEntries = buildSeedEntries(candidate)
  const candidateEvents = activityLog.filter((event) => event.candidateId === candidate.id)
  const hasAssessment = candidate.evidence.length > 0 || !!candidate.recommendation || !!candidate.summary
  const strengths = strongCriteriaNames(candidate)
  const needsValidation = needsValidationCriteriaNames(candidate)

  return (
    <div className="space-y-4 p-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" aria-label="Home" className="hover:text-palette-neutral-900">
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-palette-neutral-300" aria-hidden="true" />
        <Link to={`/openings/${candidate.openingId}`} className="hover:text-palette-neutral-900">
          {opening?.title ?? 'Role'}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-palette-neutral-300" aria-hidden="true" />
        <Link to={`/openings/${candidate.openingId}/candidates`} className="hover:text-palette-neutral-900">
          Candidates
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-palette-neutral-300" aria-hidden="true" />
        <span className="font-medium text-palette-neutral-700">{candidate.name}</span>
      </nav>

      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-palette-brand-100 text-base font-semibold text-palette-brand-700">
              {initialsFor(candidate.name)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-palette-neutral-900">{candidate.name}</h1>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {candidate.currentRole && candidate.currentCompany ? `${candidate.currentRole} · ${candidate.currentCompany}` : opening?.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {[
                  candidate.location,
                  candidate.experienceYears !== undefined ? `${candidate.experienceYears} yrs experience` : undefined,
                  candidate.source ? `Source: ${candidate.source}` : undefined,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{candidate.stage}</span>
            {!candidate.rejected && (
              <>
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
                <OverflowMenu onEmail={() => setOpenDialog('email')} onReject={() => setOpenDialog('reject')} rejected={!!candidate.rejected} />
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3.5">
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
            <span className="text-sm text-palette-neutral-400">AI screening score {candidate.screeningScore}</span>
          )}
          {statusNote && <span className="text-sm font-medium text-palette-warning-700">{statusNote}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          {hasAssessment ? (
            <div className="rounded-xl border border-palette-brand-200 bg-palette-brand-100/30 p-5 shadow-xs">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">AI assessment</h2>
              </div>
              {(candidate.recommendation || candidate.prioritiesSupported !== undefined) && (
                <p className="mt-2 text-sm font-semibold text-palette-neutral-900">
                  {candidate.recommendation}
                  {candidate.recommendation && candidate.prioritiesSupported !== undefined && ' · '}
                  {candidate.prioritiesSupported !== undefined && `${candidate.prioritiesSupported} of 5 priorities supported`}
                </p>
              )}
              {strengths.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-palette-success-700">Strongest evidence</p>
                  <p className="mt-1 text-sm text-foreground">{strengths.join(', ')}</p>
                </div>
              )}
              {needsValidation.length > 0 && (
                <div className="mt-2.5">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-palette-warning-700">
                    <CircleHelp className="h-3 w-3" aria-hidden="true" />
                    Needs validation
                  </p>
                  <p className="mt-1 text-sm text-foreground">{needsValidation.join(', ')}</p>
                </div>
              )}
              {candidate.summary && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{candidate.summary}</p>}
              {!candidate.summary && candidate.notableGap && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{candidate.notableGap}</p>}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted p-5 text-sm text-muted-foreground shadow-xs">
              A detailed AI assessment isn&rsquo;t available for this candidate yet.
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
              <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                <CriterionEvidenceList criteria={criteria} evidence={candidate.evidence} />
                {hasUncertainty && (
                  <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    Criteria marked <span className="font-medium text-palette-warning-700">Unclear</span> or{' '}
                    <span className="font-medium text-palette-warning-700">Insufficient evidence</span> reflect missing information, not a negative
                    finding.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                {candidateEvents.length === 0 && seedEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {candidateEvents.map((event: ActivityEvent) => {
                      const Icon = activityIcon(event.message)
                      return (
                        <li key={event.id} className="flex gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-palette-brand-100 text-primary">
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-sm text-foreground">{event.message}</p>
                            <p className="text-xs text-muted-foreground">{formatEventTime(event.timestamp)}</p>
                          </div>
                        </li>
                      )
                    })}
                    {seedEntries.map((entry, index) => {
                      const Icon = activityIcon(entry.label)
                      return (
                        <li key={`seed-${index}`} className="flex gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-palette-neutral-150 text-palette-neutral-500">
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-sm text-foreground">{entry.label}</p>
                            {entry.detail && <p className="text-xs text-muted-foreground">{entry.detail}</p>}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-400">Details</h3>
            <dl className="mt-2.5 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Stage</dt>
                <dd className="font-medium text-foreground">{candidate.stage}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Source</dt>
                <dd className="font-medium text-foreground">{candidate.source ?? '—'}</dd>
              </div>
              {candidate.email && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="truncate font-medium text-foreground">{candidate.email}</dd>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium text-foreground">{candidate.phone}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Last activity</dt>
                <dd className="font-medium text-foreground">{candidate.updatedLabel ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="font-medium text-foreground">Priya Sharma</dd>
              </div>
            </dl>
          </div>

          {opening && (
            <Link
              to={`/openings/${opening.id}/criteria`}
              className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground shadow-xs hover:border-palette-brand-250 hover:bg-accent"
            >
              <Briefcase className="h-4 w-4 shrink-0 text-palette-neutral-400" aria-hidden="true" />
              View {opening.title} hiring criteria
            </Link>
          )}

          {candidate.notes && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-400">Notes</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">{candidate.notes}</p>
            </div>
          )}
        </div>
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
            pushToast(`${candidate.name} moved to ${upcomingStage}.`, { actionLabel: 'Undo', onAction: undoLastMutation })
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
          pushToast(`${candidate.name} placed on hold.`)
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
          pushToast(`${candidate.name} rejected.`)
        }}
      />

      <EmailComposeDialog open={openDialog === 'email'} onOpenChange={(open) => setOpenDialog(open ? 'email' : null)} candidate={candidate} />
    </div>
  )
}
