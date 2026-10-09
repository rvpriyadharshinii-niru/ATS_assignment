import { ArrowRight, ClipboardCheck, BookOpenCheck, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { sectionLabelClass, VERDICT_TONE } from '../../agents/display'
import { generateInterviewGuide, runCandidateReview } from '../../agents/simulate'
import { cn } from '../../lib/cn'
import { useAgentStore } from '../../store/useAgentStore'
import { useAppStore } from '../../store/useAppStore'
import type { Candidate } from '../../types/domain'
import { IconBadge } from '../ui/IconBadge'
import { AgentActivityList } from './AgentActivityList'
import { AgentStatusPill, SimulatedTag } from './agentUi'
import { AssessmentResultView } from './AssessmentResultView'

const linkClass = 'inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:underline'

/**
 * The candidate profile's view of agent work. HireFlow stays the source of truth: everything here
 * is derived from this candidate's live record and the agents' current configuration.
 */
export function CandidateAgentFindings({ candidate }: { candidate: Candidate }) {
  const agents = useAgentStore((state) => state.agents)
  const assessment = useAgentStore((state) => state.assessmentResults[candidate.id])
  useAppStore((state) => state.criteriaVersion)

  const review = agents['candidate-review']
  const reviewInScope = review.config.openingIds.includes(candidate.openingId)
  const output = reviewInScope && candidate.evidence.length > 0 ? runCandidateReview(candidate, candidate.openingId, review.config) : undefined

  const prep = agents['interview-prep']
  const shortlisted = candidate.stage === 'HM Review' || candidate.stage === 'Interview' || candidate.stage === 'Final'
  const guide = shortlisted && prep.config.openingIds.includes(candidate.openingId) ? generateInterviewGuide(candidate, 'Portfolio review', prep.config) : undefined

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
              <IconBadge icon={UserCheck} color="brand" size="sm" />
              Candidate review
            </h3>
            <AgentStatusPill status={review.status} />
          </div>
          {output ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium', VERDICT_TONE[output.verdict])}>{output.verdictLabel}</span>
                <SimulatedTag />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{output.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Evidence fit {output.fit}% · coverage {output.coverage}% · confidence {output.confidence} · configuration v{review.version}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {reviewInScope ? 'No evidence is recorded for this candidate yet, so the agent has nothing to review.' : 'This opening isn’t in the agent’s scope.'}
            </p>
          )}
          <Link to={`/agents/candidate-review/test?candidate=${candidate.id}`} className={cn(linkClass, 'mt-3')}>
            Open in Testing Studio
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
              <IconBadge icon={ClipboardCheck} color="brand" size="sm" />
              Assessment
            </h3>
            <AgentStatusPill status={agents.assessment.status} />
          </div>
          {assessment ? (
            <p className="mt-3 text-sm text-foreground">
              <span className="font-medium">{assessment.title}</span>
              <span className="text-muted-foreground"> · {assessment.status}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No assessment has been sent to this candidate.</p>
          )}
          <Link to="/agents/assessment/test" className={cn(linkClass, 'mt-3')}>
            Review the assessment draft
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
              <IconBadge icon={BookOpenCheck} color="brand" size="sm" />
              Interview preparation
            </h3>
            <AgentStatusPill status={prep.status} />
          </div>
          {guide ? (
            <p className="mt-3 text-sm text-foreground">
              A guide would cover {guide.validate.length} area{guide.validate.length === 1 ? '' : 's'} to validate
              {guide.validate.length > 0 && <span className="text-muted-foreground"> ({guide.validate.map((item) => item.requirement.split(' · ')[0]).join(', ')})</span>} and{' '}
              {guide.explore.length} to explore further.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Guides are prepared once a candidate is shortlisted (HM Review or later).</p>
          )}
          {guide && (
            <Link to={`/agents/interview-prep/test?candidate=${candidate.id}`} className={cn(linkClass, 'mt-3')}>
              Open interview guide
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          )}
        </section>
      </div>

      {assessment && assessment.items.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className={sectionLabelClass}>Assessment results</p>
          <div className="mt-2">
            <AssessmentResultView result={assessment} />
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between gap-3">
          <p className={sectionLabelClass}>Agent activity for {candidate.name.split(' ')[0]}</p>
          <Link to="/agents?tab=activity" className={linkClass}>
            All agent activity
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-2">
          <AgentActivityList candidateId={candidate.id} showFilters={false} emptyMessage="No agent has worked on this candidate yet." />
        </div>
      </section>
    </div>
  )
}
