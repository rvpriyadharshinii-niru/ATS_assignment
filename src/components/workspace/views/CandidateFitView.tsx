import { AlertTriangle, ChevronRight, CircleHelp, ExternalLink, FileX, Info, MessageSquareWarning, Scale, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCriteria } from '../../../data/criteria'
import { getOpening } from '../../../data/openings'
import { getEvidenceSource, getSourceDocuments } from '../../../data/sources'
import { cn } from '../../../lib/cn'
import { STRENGTH_RANK } from '../../../lib/evidence'
import { STAGE_TONE } from '../../../lib/stageTone'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { Candidate, CriterionKey, EvidenceStrength } from '../../../types/domain'
import type { WorkspaceTask } from '../../../types/workspace'
import { applicantReviewSet, evidenceFor, firstName, gapCriteria, midSentence, peerPosition, recommendationSentence } from '../../../workspace/derive'
import { RecommendationBadge } from '../../candidates/RecommendationBadge'
import { DecisionBar } from '../DecisionBar'
import { Avatar, CitationChip, EmptyState, Label, StrengthPill } from '../ui'
import { btn, inputBase } from '../styles'

const STRENGTH_OPTIONS: EvidenceStrength[] = ['Strong', 'Good', 'Moderate', 'Limited', 'Unclear']

function peersFor(candidate: Candidate, all: Candidate[]): Candidate[] {
  if (['Applied', 'AI Screened', 'HM Review'].includes(candidate.stage)) {
    const set = applicantReviewSet(all, candidate.openingId)
    const pool = [...set.reviewFirst, ...set.worthALook, ...set.needsInfo]
    return pool.includes(candidate) || pool.some((entry) => entry.id === candidate.id) ? pool : [candidate, ...pool]
  }
  return all.filter((other) => other.openingId === candidate.openingId && other.stage === candidate.stage && other.evidence.length > 0 && !other.rejected)
}

function ChallengePanel({ task, candidate, onClose }: { task: WorkspaceTask; candidate: Candidate; onClose: () => void }) {
  const recordAssessment = useWorkspaceStore((state) => state.recordAssessment)
  const criteria = getCriteria(candidate.openingId)
  const [key, setKey] = useState<CriterionKey>(task.focusCriterionKey ?? gapCriteria(candidate)[0]?.key ?? criteria[0].key)
  const [strength, setStrength] = useState<EvidenceStrength>('Good')
  const [note, setNote] = useState('')
  const ai = evidenceFor(candidate, key)
  return (
    <div className="rounded-xl border border-palette-brand-250 bg-palette-brand-100/60 p-4">
      <div className="flex items-start gap-2">
        <MessageSquareWarning className="mt-0.5 h-4 w-4 text-palette-brand-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-palette-neutral-900">Record your own assessment</p>
          <p className="mt-0.5 text-xs text-palette-neutral-600">Your view is shown next to the AI's, labelled as yours. The AI rating stays visible so the difference is on record.</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 @lg:grid-cols-2">
        <label className="block text-xs font-medium text-palette-neutral-700">
          Criterion
          <select value={key} onChange={(event) => setKey(event.target.value as CriterionKey)} className={cn(inputBase, 'mt-1')}>
            {criteria.map((criterion) => (
              <option key={criterion.key} value={criterion.key}>
                {criterion.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-palette-neutral-700">
          Your rating {ai && <span className="font-normal text-palette-neutral-550">(AI: {ai.strength})</span>}
          <select value={strength} onChange={(event) => setStrength(event.target.value as EvidenceStrength)} className={cn(inputBase, 'mt-1')}>
            {STRENGTH_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 block text-xs font-medium text-palette-neutral-700">
        What do you know that the documents don't show?
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} className={cn(inputBase, 'mt-1')} placeholder="e.g. Discussed team scope on the intro call: she leads two designers." />
      </label>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={btn.primary}
          disabled={!note.trim()}
          onClick={() => {
            recordAssessment(task.id, candidate.id, key, strength, note.trim())
            onClose()
          }}
        >
          Save my assessment
        </button>
        <button type="button" className={btn.secondary} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export function CandidateFitView({ task, candidateId, focus, embedded = false }: { task: WorkspaceTask; candidateId: string; focus?: 'gaps' | 'challenge'; embedded?: boolean }) {
  const all = useAllEffectiveCandidates()
  const candidate = all.find((entry) => entry.id === candidateId)
  const setView = useWorkspaceStore((state) => state.setView)
  const focusCriterion = useWorkspaceStore((state) => state.focusCriterion)
  const send = useWorkspaceStore((state) => state.send)
  const clearAssessment = useWorkspaceStore((state) => state.clearAssessment)
  const own = useWorkspaceStore((state) => state.managerAssessments[candidateId])
  const [showMethod, setShowMethod] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(focus === 'challenge')

  if (!candidate) return <EmptyState icon={UserRound} title="Candidate not found" body="This candidate is no longer in HireFlow." />
  const opening = getOpening(candidate.openingId)
  const criteria = getCriteria(candidate.openingId)
  const peers = peersFor(candidate, all)
  const gaps = gapCriteria(candidate)
  const docs = getSourceDocuments(candidate.id)
  const otherPeers = peers.filter((peer) => peer.id !== candidate.id).slice(0, 3)

  const openSource = (key: CriterionKey) => {
    const source = getEvidenceSource(candidate.id, key)
    focusCriterion(task.id, candidate.id, key)
    setView(task.id, { type: 'source', candidateId: candidate.id, passageIds: [...source.passageIds, ...(source.conflict?.passageIds ?? [])], criterionKey: key })
  }

  const sortedCriteria =
    focus === 'gaps' ? [...criteria].sort((a, b) => (gaps.some((gap) => gap.key === b.key) ? 1 : 0) - (gaps.some((gap) => gap.key === a.key) ? 1 : 0)) : criteria

  return (
    <div className="@container space-y-5">
      {!embedded && (
        <div className="flex flex-wrap items-start gap-3">
          <Avatar name={candidate.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-palette-neutral-900">{candidate.name}</h2>
            <p className="text-sm text-muted-foreground">
              {[candidate.currentRole, candidate.currentCompany].filter(Boolean).join(' · ') || 'Current role not on file'}
              {candidate.experienceYears ? ` · ${candidate.experienceYears} yrs` : ''}
              {candidate.location ? ` · ${candidate.location}` : ''}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-palette-neutral-600">
              Applying for {opening?.title}
              <span className={cn('rounded-md px-1.5 py-0.5 font-medium', STAGE_TONE[candidate.stage])}>{candidate.stage}</span>
              {candidate.rejected && <span className="rounded-md bg-palette-neutral-200 px-1.5 py-0.5 font-medium">Removed from pipeline</span>}
            </p>
          </div>
          <Link to={`/candidates/${candidate.id}`} className={btn.ghost}>
            Full profile
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}

      {candidate.evidence.length === 0 ? (
        <EmptyState
          icon={FileX}
          title="No evidence to assess"
          body={`HireFlow has no resume, scorecard or criteria evidence for ${firstName(candidate)}. The AI won't make a recommendation without it.`}
          action={
            <Link to={`/candidates/${candidate.id}`} className={btn.secondary}>
              Open profile
            </Link>
          }
        />
      ) : (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              {candidate.recommendation && <RecommendationBadge label={candidate.recommendation} />}
              <span className="text-xs text-palette-neutral-550">AI recommendation · for your review</span>
              <button type="button" onClick={() => setShowMethod((value) => !value)} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-palette-neutral-600 hover:text-palette-neutral-900">
                <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
                How is this assessed?
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-palette-neutral-800">{recommendationSentence(candidate)}</p>
            {own && Object.keys(own).length > 0 && (
              <p className="mt-2 rounded-md bg-palette-brand-100 px-2.5 py-1.5 text-xs text-palette-brand-700">Includes your own assessment on {Object.keys(own).length} criterion. See “You” in the table.</p>
            )}
            {showMethod && (
              <div className="mt-3 rounded-lg bg-palette-neutral-100 p-3 text-xs leading-relaxed text-palette-neutral-700">
                <p>
                  There is no single match score. Each of the {criteria.length} criteria is rated from the passages below, from Strong to Insufficient. Missing evidence is shown as missing, never counted against
                  the candidate.
                </p>
                {candidate.screeningScore !== undefined && (
                  <p className="mt-1.5">
                    Screening score {candidate.screeningScore}/100 comes from the earlier AI screening step. It's shown for reference only: it can't tell you what's missing, and it shouldn't
                    decide on its own.
                  </p>
                )}
                <p className="mt-1.5">Never used: name, photo, age, gender, location, nationality or employment gaps.</p>
              </div>
            )}
          </section>

          {gaps.length > 0 && (
            <section className={cn('rounded-xl border p-4', focus === 'gaps' ? 'border-palette-warning-400 bg-palette-warning-100' : 'border-border bg-card')}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-palette-warning-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-palette-neutral-900">Not yet demonstrated</p>
                <span className="text-xs text-palette-neutral-550">missing evidence, not negative evidence</span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {gaps.map((gap) => {
                  const source = getEvidenceSource(candidate.id, gap.key)
                  const evidence = evidenceFor(candidate, gap.key)
                  return (
                    <li key={gap.key} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-medium text-palette-neutral-900">{criteria.find((criterion) => criterion.key === gap.key)?.name}</span>
                      {evidence && <StrengthPill strength={evidence.strength} />}
                      <span className="text-palette-neutral-700">{source.note ?? evidence?.detail}</span>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={btn.secondary} onClick={() => send(task.id, `Prepare questions to validate the gaps for ${firstName(candidate)}`)}>
                  Prepare questions for these
                </button>
              </div>
            </section>
          )}

          <section>
            <div className="mb-2 flex items-center justify-between">
              <Label>Job criteria and evidence</Label>
              <span className="text-xs text-palette-neutral-550">Click a row to open the source passage</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {sortedCriteria.map((criterion, index) => {
                const evidence = evidenceFor(candidate, criterion.key)
                const source = getEvidenceSource(candidate.id, criterion.key)
                const mine = own?.[criterion.key]
                const position = evidence ? peerPosition(candidate, peers, criterion.key) : undefined
                const isGap = gaps.some((gap) => gap.key === criterion.key)
                return (
                  <div
                    key={criterion.key}
                    className={cn(
                      'group grid gap-x-4 gap-y-1.5 px-4 py-3 @xl:grid-cols-[minmax(150px,200px)_1fr]',
                      index > 0 && 'border-t border-border',
                      task.focusCriterionKey === criterion.key && 'bg-palette-brand-100/50',
                      focus === 'gaps' && isGap && 'bg-palette-warning-100/60',
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-palette-neutral-900">{criterion.name}</p>
                      <p className="text-xs text-palette-neutral-550">{criterion.priority} priority</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {evidence ? <StrengthPill strength={evidence.strength} /> : <StrengthPill strength="Not available" />}
                        {mine && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-palette-brand-150 px-1.5 py-0.5 text-[11px] font-semibold text-palette-brand-700" title={mine.note}>
                            You: {mine.strength}
                            <button type="button" aria-label="Remove your assessment" onClick={() => clearAssessment(task.id, candidate.id, criterion.key)} className="hover:text-palette-brand-900">
                              ×
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openSource(criterion.key)}
                        disabled={!docs.length}
                        className="w-full text-left text-sm leading-snug text-palette-neutral-800 hover:text-palette-brand-700 disabled:cursor-default disabled:hover:text-palette-neutral-800"
                      >
                        {evidence?.detail ?? 'No evidence recorded for this criterion.'}
                        {docs.length > 0 && <ChevronRight className="ml-1 inline h-3.5 w-3.5 text-palette-neutral-450 group-hover:text-palette-brand-600" aria-hidden="true" />}
                      </button>
                      {mine && <p className="mt-1 text-xs text-palette-brand-700">Your note: {mine.note}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {source.passageIds.map((id) => (
                          <CitationChip key={id} passageId={id} onOpen={() => openSource(criterion.key)} />
                        ))}
                        {source.conflict?.passageIds.map((id) => <CitationChip key={id} passageId={id} conflict onOpen={() => openSource(criterion.key)} />)}
                        {!source.passageIds.length && <span className="text-[11px] font-medium text-palette-warning-700">No supporting passage found</span>}
                        {position && STRENGTH_RANK[evidence!.strength] >= STRENGTH_RANK.Good && <span className="text-[11px] text-palette-neutral-550">· {position} reviewed</span>}
                      </div>
                      {source.conflict && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-palette-warning-700">
                          <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          Conflicting sources: {source.conflict.note}
                        </p>
                      )}
                      {source.note && !isGap && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-palette-neutral-600">
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {source.note}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {challengeOpen ? (
            <ChallengePanel task={task} candidate={candidate} onClose={() => setChallengeOpen(false)} />
          ) : (
            <button type="button" onClick={() => setChallengeOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-palette-neutral-600 hover:text-palette-brand-700">
              <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
              Disagree with a rating? Record your own assessment
            </button>
          )}

          {otherPeers.length > 0 && (
            <section>
              <Label className="mb-2">Compare with other applicants</Label>
              <div className="flex flex-wrap gap-2">
                {otherPeers.map((peer) => (
                  <button key={peer.id} type="button" className={btn.secondary} onClick={() => send(task.id, `Compare ${firstName(candidate)} with ${peer.name}`)}>
                    vs {peer.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-border bg-palette-neutral-100 p-4">
            <Label>Suggested next step</Label>
            <p className="mt-1 text-sm text-palette-neutral-800">
              {candidate.recommendation === 'Needs more information'
                ? `Ask ${firstName(candidate)} for a portfolio or fuller resume before deciding. Nothing here is a reason to reject.`
                : gaps.filter((gap) => gap.kind !== 'partial').length
                  ? `Shortlist if the strengths matter most for this role, and validate ${gaps
                      .filter((gap) => gap.kind !== 'partial')
                      .map((gap) => criteria.find((criterion) => criterion.key === gap.key)?.name ?? '')
                      .map(midSentence)
                      .join(' and ')} in the interview.`
                  : 'Evidence supports every criterion. Use the interview to check depth and personal contribution.'}
            </p>
            <div className="mt-3">
              <DecisionBar task={task} candidate={candidate} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
