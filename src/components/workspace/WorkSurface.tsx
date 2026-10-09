import { ArrowLeft, Loader2 } from 'lucide-react'
import { getCandidate } from '../../data/candidates'
import { getCriterionName } from '../../data/criteria'
import { STEP_DURATION_MS } from '../../store/useWorkspaceStore'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import type { WorkspaceTask, WorkspaceView } from '../../types/workspace'
import { listJoin } from '../../workspace/derive'
import { SimulatedNote } from './ui'
import { btn, useNow } from './styles'
import { ApplicantReviewView } from './views/ApplicantReviewView'
import { AssessmentView } from './views/AssessmentView'
import { BriefingView } from './views/BriefingView'
import { CandidateFitView } from './views/CandidateFitView'
import { ClearTasksView } from './views/ClearTasksView'
import { ComparisonWorkspaceView } from './views/ComparisonWorkspaceView'
import { FollowUpsView } from './views/FollowUpsView'
import { InterviewGuideEditor } from './views/InterviewGuideEditor'
import { InterviewPrepView } from './views/InterviewPrepView'
import { PipelineView } from './views/PipelineView'
import { SourceView } from './views/SourceView'
import { TaskLauncher } from './TaskLauncher'

function viewTitle(view: WorkspaceView): { title: string; subtitle?: string } {
  const name = (id: string) => getCandidate(id)?.name ?? 'Candidate'
  switch (view.type) {
    case 'launcher':
      return { title: 'Start a task' }
    case 'applicant-review':
      return { title: 'Applicant review', subtitle: 'Senior Product Designer · prepared for you' }
    case 'candidate':
      return { title: view.focus === 'gaps' ? `Gaps · ${name(view.candidateId)}` : `Evidence-backed review · ${name(view.candidateId)}`, subtitle: 'Each rating links to its source passage' }
    case 'source': {
      const candidate = getCandidate(view.candidateId)
      return {
        title: `Source documents · ${name(view.candidateId)}`,
        subtitle: view.criterionKey && candidate ? `Evidence for ${getCriterionName(candidate.openingId, view.criterionKey)}` : 'Original resume and scorecards',
      }
    }
    case 'comparison':
      return { title: `Comparison · ${listJoin(view.candidateIds.map((id) => name(id).split(' ')[0]))}`, subtitle: 'Criterion by criterion, with sources' }
    case 'interview-guide':
      return { title: `Interview guide · ${name(view.candidateId)}`, subtitle: view.gapsOnly ? 'Focused on what the evidence does not show yet' : 'Editable before you save' }
    case 'interview-prep':
      return { title: 'Upcoming interviews', subtitle: 'Senior Product Designer' }
    case 'pipeline':
      return { title: view.focus === 'delay' ? 'Why the role is delayed' : 'Pipeline investigation', subtitle: 'Senior Product Designer · live from HireFlow' }
    case 'follow-ups':
      return { title: 'Follow-ups awaiting approval', subtitle: 'Nothing is sent until you approve' }
    case 'clear-tasks':
      return { title: 'Clear my hiring tasks', subtitle: 'Approve, edit, skip or defer each one' }
    case 'briefing':
      return { title: view.mode === 'changes' ? 'Since your last visit' : 'Needs your attention' }
    case 'assessment':
      return { title: 'Assessment draft', subtitle: 'Senior Product Designer' }
  }
}

function ViewBody({ task }: { task: WorkspaceTask }) {
  const view = task.view
  switch (view.type) {
    case 'launcher':
      return <TaskLauncher taskId={task.id} />
    case 'applicant-review':
      return <ApplicantReviewView task={task} openingId={view.openingId} candidateId={view.candidateId} />
    case 'candidate':
      return <CandidateFitView key={`${view.candidateId}-${view.focus}`} task={task} candidateId={view.candidateId} focus={view.focus} />
    case 'source':
      return <SourceView task={task} candidateId={view.candidateId} passageIds={view.passageIds} criterionKey={view.criterionKey} />
    case 'comparison':
      return <ComparisonWorkspaceView task={task} candidateIds={view.candidateIds} />
    case 'interview-guide':
      return <InterviewGuideEditor task={task} candidateId={view.candidateId} />
    case 'interview-prep':
      return <InterviewPrepView task={task} candidateIds={view.candidateIds} />
    case 'pipeline':
      return <PipelineView task={task} openingId={view.openingId} focus={view.focus} stage={view.stage} />
    case 'follow-ups':
      return <FollowUpsView task={task} />
    case 'clear-tasks':
      return <ClearTasksView task={task} />
    case 'briefing':
      return <BriefingView task={task} mode={view.mode} />
    case 'assessment':
      return <AssessmentView openingId={view.openingId} />
  }
}

function Preparing({ task, now }: { task: WorkspaceTask; now: number }) {
  const message = [...task.messages].reverse().find((entry) => entry.role === 'ai' && entry.steps)
  const steps = message?.steps ?? []
  const done = message ? Math.floor((now - message.createdAt) / STEP_DURATION_MS) : 0
  const current = steps[Math.min(done, steps.length - 1)]
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-center" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-palette-brand-500" aria-hidden="true" />
      <p className="text-sm font-medium text-palette-neutral-800">{current?.label ?? 'Preparing'}…</p>
      <p className="text-xs text-palette-neutral-500">
        Step {Math.min(done + 1, steps.length)} of {steps.length} · simulated preparation over HireFlow's data
      </p>
      <div className="mt-2 w-64 space-y-2" aria-hidden="true">
        <div className="h-3 animate-pulse rounded bg-palette-neutral-200" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-palette-neutral-200" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-palette-neutral-200" />
      </div>
    </div>
  )
}

export function WorkSurface({ task }: { task: WorkspaceTask }) {
  const back = useWorkspaceStore((state) => state.back)
  const now = useNow(task.revealAt)
  const preparing = now < task.revealAt
  const { title, subtitle } = viewTitle(task.view)
  const previous = task.history[task.history.length - 1]

  return (
    <div className="flex h-full min-h-0 flex-col">
      {task.view.type !== 'launcher' && (
        <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
          {previous && (
            <button type="button" className={btn.ghost} onClick={() => back(task.id)} aria-label={`Back to ${viewTitle(previous).title}`} title={`Back to ${viewTitle(previous).title}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-palette-neutral-900">{title}</h2>
            {subtitle && <p className="truncate text-xs text-palette-neutral-550">{subtitle}</p>}
          </div>
          <SimulatedNote className="hidden sm:inline-flex" />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto bg-background px-5 py-5">{preparing ? <Preparing task={task} now={now} /> : <ViewBody task={task} />}</div>
    </div>
  )
}
