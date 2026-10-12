import { useParams } from 'react-router-dom'
import { isAgentId } from '../agents/display'
import { AssessmentStudio } from '../components/agents/studios/AssessmentStudio'
import { CandidateReviewStudio } from '../components/agents/studios/CandidateReviewStudio'
import { CoordinationStudio } from '../components/agents/studios/CoordinationStudio'
import { InterviewPrepStudio } from '../components/agents/studios/InterviewPrepStudio'
import { useAgentStore } from '../store/useAgentStore'

const INTRO: Record<string, string> = {
  'candidate-review': 'Pick a job and a candidate, run it, check the evidence, then refine and run again to compare.',
  'interview-coordination': 'Pick a scheduling situation and preview exactly what the agent would propose and send.',
  assessment: 'Draft an assessment, edit the questions, then approve it before candidates see it.',
  'interview-prep': 'Prepare an interview guide for a shortlisted candidate, linked to the evidence.',
}

export function AgentTestPage() {
  const { agentId } = useParams<{ agentId: string }>()
  const testedAgents = useAgentStore((state) => state.testedAgents)
  if (!isAgentId(agentId)) return null

  return (
    <div className="space-y-5 px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="max-w-3xl text-sm text-palette-neutral-600">{INTRO[agentId]}</p>
        <p className="inline-flex items-center gap-1.5 text-xs text-palette-neutral-550">
          <span className="h-1.5 w-1.5 rounded-full bg-palette-info-500" aria-hidden="true" />
          Preview · nothing changes until you approve{testedAgents.includes(agentId) ? '' : ' · run once before activating'}
        </p>
      </div>
      {agentId === 'candidate-review' && <CandidateReviewStudio />}
      {agentId === 'assessment' && <AssessmentStudio />}
      {agentId === 'interview-prep' && <InterviewPrepStudio />}
      {agentId === 'interview-coordination' && <CoordinationStudio />}
    </div>
  )
}
