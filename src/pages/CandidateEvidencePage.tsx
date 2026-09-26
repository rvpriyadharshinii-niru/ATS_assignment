import {
  Activity,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Download,
  FileText,
  Home,
  Info,
  Mail,
  MoreHorizontal,
  PauseCircle,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useEffect, useState, type ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { IconBadge } from '../components/ui/IconBadge'
import { CriteriaMatchVisual } from '../components/candidates/CriteriaMatchVisual'
import { CriterionEvidenceList } from '../components/candidates/CriterionEvidence'
import { EmailComposeDialog } from '../components/candidates/EmailComposeDialog'
import { RecommendationBadge } from '../components/candidates/RecommendationBadge'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import {
  buildStatusNote,
  deriveAppliedDate,
  deriveCandidateEmail,
  deriveDayGroupLabel,
  deriveEducation,
  deriveExperience,
  deriveLinks,
  deriveSeedActivity,
  deriveSkills,
} from '../lib/candidateStatus'
import { cn } from '../lib/cn'
import { needsValidationCriteriaNames, strongCriteriaNames } from '../lib/criteriaSummary'
import { isUncertainStrength } from '../lib/evidence'
import { downloadResumePdf } from '../lib/generateResumePdf'
import { advanceConsequences, advanceCtaLabel, nextStage } from '../lib/stage'
import { STAGE_TONE } from '../lib/stageTone'
import { useEffectiveCandidate } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'

type OpenDialog = 'advance' | 'hold' | 'reject' | 'email' | null
type DetailTab = 'assessment' | 'evidence' | 'resume' | 'profile' | 'details' | 'criteria' | 'activity'

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
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
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
  const [activeTab, setActiveTab] = useState<DetailTab>('assessment')

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
  const hasAssessment = candidate.evidence.length > 0 || !!candidate.recommendation || !!candidate.summary
  const strengths = strongCriteriaNames(candidate)
  const needsValidation = needsValidationCriteriaNames(candidate)
  const skills = deriveSkills(candidate)
  const experience = deriveExperience(candidate)
  const education = deriveEducation(candidate)
  const links = deriveLinks(candidate)

  const activityFeed: { id: string; timestamp: number; label: string; detail?: string }[] = [
    ...activityLog
      .filter((event) => event.candidateId === candidate.id)
      .map((event) => ({ id: event.id, timestamp: event.timestamp, label: event.message, detail: undefined })),
    ...deriveSeedActivity(candidate),
  ].sort((a, b) => b.timestamp - a.timestamp)
  const activityGroups: { dayLabel: string; items: typeof activityFeed }[] = []
  for (const item of activityFeed) {
    const dayLabel = deriveDayGroupLabel(item.timestamp)
    const lastGroup = activityGroups[activityGroups.length - 1]
    if (lastGroup && lastGroup.dayLabel === dayLabel) lastGroup.items.push(item)
    else activityGroups.push({ dayLabel, items: [item] })
  }

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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight text-palette-neutral-900">{candidate.name}</h1>
                <span className={cn('shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', STAGE_TONE[candidate.stage])}>
                  {candidate.stage}
                </span>
              </div>
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
            <button
              type="button"
              onClick={() => downloadResumePdf(candidate)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-palette-neutral-700 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download resume
            </button>
            {!candidate.rejected && (
              <>
                {!candidate.hold && (
                  <button
                    type="button"
                    onClick={() => setOpenDialog('hold')}
                    className="rounded-lg border border-palette-danger-300 px-3.5 py-2 text-sm font-medium text-palette-danger-700 hover:bg-palette-danger-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Hold
                  </button>
                )}
                {upcomingStage && (
                  <button
                    type="button"
                    onClick={() => setOpenDialog('advance')}
                    className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {advanceCtaLabel(upcomingStage)}
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
            <span className="text-sm text-palette-neutral-500">AI screening score {candidate.screeningScore}</span>
          )}
          {statusNote && <span className="text-sm font-medium text-palette-warning-700">{statusNote}</span>}
        </div>
      </div>

      <div>
        <nav className="-mb-px flex items-center gap-5 border-b border-border" aria-label="Candidate sections">
          {(
            [
              { key: 'assessment', label: 'AI Assessment', icon: Sparkles },
              { key: 'evidence', label: 'Evidence', icon: ClipboardList },
              { key: 'resume', label: 'Resume', icon: FileText },
              { key: 'profile', label: 'Profile', icon: UserRound },
              { key: 'details', label: 'Details', icon: Info },
              { key: 'criteria', label: 'Criteria', icon: Briefcase },
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

        {activeTab === 'assessment' ? (
          hasAssessment ? (
            <div className="mt-4 rounded-xl border border-palette-brand-200 bg-palette-brand-100/30 p-5 shadow-xs">
              <div className="flex items-center gap-2">
                <IconBadge icon={Sparkles} color="brand" size="sm" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">AI assessment</h2>
              </div>
              {(candidate.recommendation || candidate.prioritiesSupported !== undefined) && (
                <p className="mt-2 text-sm font-semibold text-palette-neutral-900">
                  {candidate.recommendation}
                  {candidate.recommendation && candidate.prioritiesSupported !== undefined && ' · '}
                  {candidate.prioritiesSupported !== undefined && `${candidate.prioritiesSupported} of 5 priorities supported`}
                </p>
              )}

              {criteria.length > 0 && (
                <div className="mt-4 border-t border-border pt-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">How the profile matches each criterion</p>
                  <CriteriaMatchVisual criteria={criteria} evidence={candidate.evidence} />
                </div>
              )}

              {strengths.length > 0 && (
                <div className="mt-4 border-t border-border pt-3.5">
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
            <div className="mt-4 rounded-xl border border-border bg-muted p-5 text-sm text-muted-foreground shadow-xs">
              A detailed AI assessment isn&rsquo;t available for this candidate yet.
            </div>
          )
        ) : activeTab === 'evidence' ? (
              <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                <CriterionEvidenceList criteria={criteria} evidence={candidate.evidence} experience={experience} />
                {hasUncertainty && (
                  <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    Criteria marked <span className="font-medium text-palette-warning-700">Unclear</span> or{' '}
                    <span className="font-medium text-palette-warning-700">Insufficient evidence</span> reflect missing information, not a negative
                    finding. Missing evidence is never treated as negative evidence.
                  </p>
                )}
              </div>
            ) : activeTab === 'resume' ? (
              <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <p className="text-sm font-semibold text-palette-neutral-900">{candidate.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[deriveCandidateEmail(candidate), candidate.phone, candidate.location].filter(Boolean).join(' · ')}
                    </p>
                    {(candidate.currentRole || candidate.currentCompany) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[candidate.currentRole, candidate.currentCompany].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadResumePdf(candidate)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-palette-neutral-700 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Download resume
                  </button>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Experience</p>
                  <div className="mt-2 space-y-3">
                    {experience.map((entry) => (
                      <div key={`${entry.company}-${entry.dateRange}`}>
                        <p className="text-sm font-medium text-foreground">
                          {entry.role} · {entry.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.dateRange} · {entry.duration}
                        </p>
                        <ul className="mt-1 space-y-1 text-sm leading-relaxed text-foreground/90">
                          {entry.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-2">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-palette-neutral-300" aria-hidden="true" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Skills</p>
                  <p className="mt-1.5 text-sm text-foreground">{skills.join(', ')}</p>
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Education</p>
                  <p className="mt-1.5 text-sm text-foreground">{education.degree}</p>
                  <p className="text-xs text-muted-foreground">
                    {education.school} · {education.dateRange}
                  </p>
                </div>

                <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  Representative summary compiled from the application. Source: Resume · Application form.
                </p>
              </div>
            ) : activeTab === 'profile' ? (
              <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-palette-neutral-100 px-2.5 py-1 text-xs font-medium text-palette-neutral-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Experience</h3>
                  <div className="mt-2.5 space-y-4">
                    {experience.map((entry) => (
                      <div key={`${entry.company}-${entry.dateRange}`}>
                        <p className="text-sm font-semibold text-foreground">{entry.company}</p>
                        <p className="text-sm text-foreground">{entry.role}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.dateRange} · {entry.duration}
                          {entry.location && ` · ${entry.location}`}
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {entry.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-palette-neutral-300" aria-hidden="true" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Education</h3>
                  <p className="mt-1.5 text-sm text-foreground">{education.degree}</p>
                  <p className="text-xs text-muted-foreground">
                    {education.school} · {education.dateRange}
                  </p>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Links</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground">LinkedIn: {links.linkedin}</p>
                  <p className="text-xs text-muted-foreground">Portfolio: {links.portfolio}</p>
                </div>
              </div>
            ) : activeTab === 'details' ? (
              <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Stage</dt>
                    <dd className="font-medium text-foreground">{candidate.stage}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="truncate font-medium text-foreground">{deriveCandidateEmail(candidate)}</dd>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="font-medium text-foreground">{candidate.phone}</dd>
                    </div>
                  )}
                  {candidate.location && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Location</dt>
                      <dd className="font-medium text-foreground">{candidate.location}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Source</dt>
                    <dd className="font-medium text-foreground">{candidate.source ?? '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Applied</dt>
                    <dd className="font-medium text-foreground">{deriveAppliedDate(candidate)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Owner</dt>
                    <dd className="font-medium text-foreground">Priya Sharma</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Last activity</dt>
                    <dd className="font-medium text-foreground">{candidate.updatedLabel ?? '—'}</dd>
                  </div>
                </dl>
                {candidate.notes && (
                  <div className="mt-4 border-t border-border pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Notes</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">{candidate.notes}</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'criteria' ? (
              <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                {criteria.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hiring criteria are configured for this role yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {criteria.map((criterion) => (
                      <li key={criterion.key} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{criterion.name}</p>
                          {criterion.description && <p className="mt-0.5 text-xs text-muted-foreground">{criterion.description}</p>}
                        </div>
                        <span className="shrink-0 rounded-md bg-palette-neutral-100 px-2 py-0.5 text-xs font-medium text-palette-neutral-700">
                          {criterion.priority}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {opening && (
                  <Link
                    to={`/openings/${opening.id}/criteria`}
                    className="mt-4 inline-flex items-center gap-1.5 border-t border-border pt-3 text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Manage {opening.title} hiring criteria
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                {activityGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-5">
                    {activityGroups.map((group) => (
                      <div key={group.dayLabel}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">{group.dayLabel}</p>
                        <ul className="mt-2 space-y-3">
                          {group.items.map((item) => {
                            const Icon = activityIcon(item.label)
                            return (
                              <li key={item.id} className="flex gap-3">
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-palette-brand-100 text-primary">
                                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                </span>
                                <div>
                                  <p className="text-xs text-muted-foreground">{formatEventTime(item.timestamp)}</p>
                                  <p className="text-sm text-foreground">{item.label}</p>
                                  {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
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
