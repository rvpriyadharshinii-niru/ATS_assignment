import { ArrowUp, Bot, ChevronRight, ListChecks, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TaskStatusPill } from '../components/workspace/ui'
import { btn, displayStatus, relativeTime, useNow } from '../components/workspace/styles'
import { AGENT_ORDER } from '../data/agents'
import { cn } from '../lib/cn'
import { useAllEffectiveCandidates } from '../store/candidateSelectors'
import { useAgentStore } from '../store/useAgentStore'
import { useAppStore } from '../store/useAppStore'
import { useAllTasks } from '../store/useWorkspaceStore'
import { attentionItems, buildSessionItems } from '../workspace/derive'
import { EXAMPLE_PROMPTS, SUGGESTED_TASKS, useLaunchTask } from '../workspace/presets'


function greeting(): string {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export function HomePage() {
  const now = useNow()
  const launch = useLaunchTask()
  const navigate = useNavigate()
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)
  const candidates = useAllEffectiveCandidates()
  const agents = useAgentStore((state) => state.agents)
  const activity = useAgentStore((state) => state.activity)
  const tasks = useAllTasks()
  const [text, setText] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

  useEffect(() => {
    const timer = window.setInterval(() => setPlaceholderIndex((index) => (index + 1) % EXAMPLE_PROMPTS.length), 3500)
    return () => window.clearInterval(timer)
  }, [])

  const agentPending = activity.filter((item) => item.status === 'pending').length
  const attention = attentionItems(candidates, agentPending)
  const sessionItems = useMemo(() => buildSessionItems(candidates, activity), [candidates, activity])
  const existingSession = tasks.find((task) => task.key === 'clear-tasks' && task.status !== 'completed')
  const resumable = tasks.filter((task) => task.status !== 'completed' || task.saved).slice(0, 4)

  const submit = (query: string) => {
    if (query.trim()) launch(query.trim())
  }

  const starters = SUGGESTED_TASKS.filter((task) => ['review', 'interviews', 'pipeline', 'compare'].includes(task.id))
  const activeAgents = AGENT_ORDER.filter((id) => agents[id].status === 'active').length
  const agentWaiting = activity.filter((item) => item.status === 'pending' || item.status === 'needs-review').length

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 lg:pt-16">
      <section className="mx-auto max-w-2xl">
        <p className="text-sm text-palette-neutral-550">{greeting()}, Priya</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-palette-neutral-900 sm:text-[28px]">What would you like to get done?</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit(text)
          }}
          className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 pl-4 shadow-xs focus-within:border-palette-brand-300 focus-within:ring-4 focus-within:ring-palette-brand-100"
        >
          <Sparkles className="h-[18px] w-[18px] shrink-0 text-palette-brand-500" aria-hidden="true" />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={`Try “${EXAMPLE_PROMPTS[placeholderIndex]}”`}
            aria-label="Describe a hiring task"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-palette-neutral-900 placeholder:text-palette-neutral-450 focus:outline-none"
          />
          <button type="submit" disabled={!text.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-30" aria-label="Start task">
            <ArrowUp className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {starters.map((task) => (
            <button key={task.id} type="button" onClick={() => launch(task.query)} className={btn.chip} title={task.description}>
              <task.icon className="h-3.5 w-3.5 text-palette-neutral-500" aria-hidden="true" />
              {task.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-14 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-palette-neutral-900">Needs you</h2>
            {sessionItems.length > 0 && (
              <button type="button" className={btn.secondary} onClick={() => launch('Help me clear my pending hiring tasks')}>
                <ListChecks className="h-4 w-4" aria-hidden="true" />
                {existingSession?.session
                  ? `Resume · ${existingSession.session.items.filter((item) => item.status !== 'todo').length} of ${existingSession.session.items.length} done`
                  : `Work through all ${sessionItems.length}`}
              </button>
            )}
          </div>
          {attention.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">You're all caught up. Nothing needs you right now.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {attention.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => launch(item.query)} className="group flex w-full items-center gap-3 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" title={item.prepared}>
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', item.tone === 'urgent' ? 'bg-palette-warning-500' : 'bg-palette-neutral-400')} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-palette-neutral-900">{item.what}</span>
                      <span className="block truncate text-[13px] text-palette-neutral-550">{item.why}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm text-palette-neutral-600 group-hover:text-palette-neutral-900">
                      <span className="hidden sm:inline">{item.cta}</span>
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-10">
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-palette-neutral-900">Resume work</h2>
              <Link to="/workspace" className="text-xs font-medium text-palette-neutral-550 hover:text-palette-neutral-900">
                All tasks
              </Link>
            </div>
            {resumable.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tasks you start or save will wait here.</p>
            ) : (
              <ul className="space-y-0.5">
                {resumable.map((task) => (
                  <li key={task.id}>
                    <button type="button" onClick={() => navigate(`/workspace/${task.id}`)} className="-mx-2 w-[calc(100%+1rem)] rounded-lg px-2 py-2 text-left hover:bg-muted">
                      <span className="block truncate text-sm text-palette-neutral-900">{task.title}</span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <TaskStatusPill status={displayStatus(task, now)} />
                        <span className="text-xs text-palette-neutral-500">{relativeTime(task.updatedAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Link to="/agents" className="group flex items-center gap-3 rounded-lg border border-border px-3.5 py-3 hover:bg-muted">
            <Bot className="h-4 w-4 shrink-0 text-palette-neutral-500" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-palette-neutral-900">AI Agents</span>
              <span className="block text-xs text-palette-neutral-550">
                {activeAgents} active{agentWaiting ? ` · ${agentWaiting} waiting on you` : ''}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-palette-neutral-400 group-hover:text-palette-neutral-700" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  )
}
