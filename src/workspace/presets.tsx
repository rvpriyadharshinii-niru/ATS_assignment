import { CalendarClock, GitCompareArrows, ListChecks, MessageSquareText, Users, Workflow } from 'lucide-react'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaceStore, type StartTaskOptions } from '../store/useWorkspaceStore'

export interface SuggestedTask {
  id: string
  label: string
  description: string
  query: string
  icon: typeof Users
  /** Resume the unfinished task for this preset instead of duplicating it. */
  key?: string
}

export const SUGGESTED_TASKS: SuggestedTask[] = [
  { id: 'review', label: 'Review applicants', description: 'Prepared, evidence-backed review of new applicants', query: "Review today's new applicants", icon: Users, key: 'applicant-review:spd' },
  { id: 'interviews', label: 'Prepare interviews', description: 'Candidate-specific guides for upcoming interviews', query: 'Prepare interviews for tomorrow', icon: CalendarClock, key: 'interview-prep' },
  { id: 'pipeline', label: 'Investigate pipeline', description: 'Bottlenecks, stalled candidates and next steps', query: 'What needs attention in my hiring pipeline?', icon: Workflow },
  { id: 'followups', label: 'Draft follow-ups', description: 'Reminders for feedback that is holding things up', query: 'Prepare follow-ups for everyone waiting on feedback', icon: MessageSquareText, key: 'follow-ups' },
  { id: 'compare', label: 'Compare candidates', description: 'Side-by-side evidence for the strongest applicants', query: 'Compare the strongest applicants for Product Designer', icon: GitCompareArrows },
  { id: 'clear', label: 'Clear pending tasks', description: 'Work through everything waiting on you', query: 'Help me clear my pending hiring tasks', icon: ListChecks, key: 'clear-tasks' },
]

export const EXAMPLE_PROMPTS = [
  "Review today's new applicants",
  'Who should I review first?',
  'What needs my attention today?',
  'Why is the Product Designer role delayed?',
  'Compare Ananya and Rahul',
  'What changed since my last visit?',
  'Prepare interviews for tomorrow',
  'Which candidates are stuck?',
]

/** Same question, same task: typed or clicked, a preset query resumes its existing task. */
function keyForQuery(query: string): string | undefined {
  return SUGGESTED_TASKS.find((task) => task.query.toLowerCase() === query.trim().toLowerCase())?.key
}

export function useLaunchTask() {
  const navigate = useNavigate()
  const startTask = useWorkspaceStore((state) => state.startTask)
  return useCallback(
    (query: string, options?: StartTaskOptions) => {
      const id = startTask(query, { key: keyForQuery(query), ...options })
      navigate(`/workspace/${id}`)
    },
    [navigate, startTask],
  )
}
