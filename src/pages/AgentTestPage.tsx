import { Play } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { isAgentId } from '../agents/display'
import { AssessmentStudio } from '../components/agents/studios/AssessmentStudio'
import { CandidateReviewStudio } from '../components/agents/studios/CandidateReviewStudio'
import { CoordinationStudio } from '../components/agents/studios/CoordinationStudio'
import { InterviewPrepStudio } from '../components/agents/studios/InterviewPrepStudio'
import { useAgentStore } from '../store/useAgentStore'

const INTRO: Record<string, string> = {
  'candidate-review': 'Pick a job and a candidate, run the agent, inspect its reasoning, then refine its instructions and run again to compare.',
  'interview-coordination': 'Simulate a scheduling situation and preview exactly what the agent would propose and send.',
  assessment: 'Generate a draft assessment, edit the questions, check them, and preview a results summary before you approve it.',
  'interview-prep': 'Generate a structured interview guide for a shortlisted candidate, linked to requirements and evidence.',
}

export function AgentTestPage() {
  const { agentId } = useParams<{ agentId: string }>()
  const testedAgents = useAgentStore((state) => state.testedAgents)
  if (!isAgentId(agentId)) return null

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-palette-neutral-900">
            <Play className="h-4 w-4 text-palette-brand-500" aria-hidden="true" />
            Run the agent
          </h2>
          <p className="text-sm text-muted-foreground">{INTRO[agentId]}</p>
        </div>
        <p className="rounded-lg border border-palette-info-300 bg-palette-info-100 px-3 py-1.5 text-xs font-medium text-palette-info-800">
          Preview · nothing is changed or sent until you approve it{testedAgents.includes(agentId) ? '' : ' · run once before activating'}
        </p>
      </div>
      {agentId === 'candidate-review' && <CandidateReviewStudio />}
      {agentId === 'assessment' && <AssessmentStudio />}
      {agentId === 'interview-prep' && <InterviewPrepStudio />}
      {agentId === 'interview-coordination' && <CoordinationStudio />}
    </div>
  )
}
