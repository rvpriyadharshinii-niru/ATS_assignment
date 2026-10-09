import { ArrowRight, ArrowUp, Bot, ChevronRight, Eye, Handshake, ListChecks, Repeat, Send, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AgentStatusPill } from '../components/agents/agentUi'
import { TaskStatusPill } from '../components/workspace/ui'
import { btn, displayStatus, relativeTime, useNow } from '../components/workspace/styles'
import { AGENT_DEFINITIONS, AGENT_ORDER } from '../data/agents'
import { cn } from '../lib/cn'
import { useAllEffectiveCandidates } from '../store/candidateSelectors'
import { useAgentStore } from '../store/useAgentStore'
import { useAppStore } from '../store/useAppStore'
import { useAllTasks } from '../store/useWorkspaceStore'
import { attentionItems, buildSessionItems, plural } from '../workspace/derive'
import { EXAMPLE_PROMPTS, SUGGESTED_TASKS, useLaunchTask } from '../workspace/presets'

const TRUST_LEVELS = [
  { icon: Eye, label: 'Observe', body: 'Ask what changed, with sources.', query: 'What changed since my last visit?' },
  { icon: Handshake, label: 'Collaborate', body: 'AI drafts, you edit.', query: 'Prepare interview questions for Ananya' },
  { icon: Send, label: 'Delegate', body: 'AI prepares several actions for approval.', query: 'Prepare follow-ups for everyone waiting on feedback' },
  { icon: Repeat, label: 'Automate', body: 'Agents handle recurring work within limits.', to: '/agents' },
]

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
  const sessionKinds = [
    [sessionItems.filter((item) => item.kind === 'shortlist').length, 'shortlist'],
    [sessionItems.filter((item) => item.kind === 'own-feedback' || item.kind === 'reminder').length, 'feedback follow-up'],
    [sessionItems.filter((item) => item.kind === 'agent-proposal').length, 'agent proposal'],
    [sessionItems.filter((item) => item.kind === 'guide').length, 'interview guide'],
  ] as const

  const submit = (query: string) => {
    if (query.trim()) launch(query.trim())
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8 lg:pt-12">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm text-palette-neutral-550">{greeting()}, Priya</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-palette-neutral-900 sm:text-3xl">What would you like to get done?</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit(text)
          }}
          className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 pl-4 shadow-sm focus-within:border-palette-brand-400 focus-within:ring-4 focus-within:ring-palette-brand-100"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-palette-brand-500" aria-hidden="true" />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={`Try “${EXAMPLE_PROMPTS[placeholderIndex]}”`}
            aria-label="Describe a hiring task"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-palette-neutral-900 placeholder:text-palette-neutral-450 focus:outline-none"
          />
          <button type="submit" disabled={!text.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40" aria-label="Start task">
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {EXAMPLE_PROMPTS.slice(1, 5).map((prompt) => (
            <button key={prompt} type="button" className={btn.chip} onClick={() => submit(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3">
        {SUGGESTED_TASKS.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => launch(task.query)}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left transition-colors hover:border-palette-brand-300 hover:bg-palette-brand-100/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <task.icon className="h-[18px] w-[18px] shrink-0 text-palette-neutral-500 group-hover:text-palette-brand-600" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-palette-neutral-900">{task.label}</span>
              <span className="hidden truncate text-xs text-palette-neutral-550 sm:block">{task.description}</span>
            </span>
          </button>
        ))}
      </section>

      {sessionItems.length > 0 && (
        <section className="mx-auto mt-6 max-w-4xl">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-palette-brand-200 bg-palette-brand-100/60 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-palette-brand-500 text-white">
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-palette-neutral-900">Help me clear my hiring tasks</p>
              <p className="mt-0.5 text-sm text-palette-neutral-700">
                {existingSession?.session
                  ? `${existingSession.session.items.filter((item) => item.status !== 'todo').length} of ${existingSession.session.items.length} handled. Pick up where you left off.`
                  : `${plural(sessionItems.length, 'task')} prepared and ready for your decision: ${sessionKinds
                      .filter(([count]) => count > 0)
                      .map(([count, label]) => plural(count, label))
                      .join(', ')}.`}
              </p>
            </div>
            <button type="button" className={cn(btn.primary, 'px-4 py-2')} onClick={() => launch('Help me clear my pending hiring tasks')}>
              {existingSession ? 'Resume session' : 'Start'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-palette-neutral-900">Prepared for you</h2>
            <span className="text-xs text-palette-neutral-550">Work the AI has already started</span>
          </div>
          {attention.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">You're all caught up. Nothing needs you right now.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {attention.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => launch(item.query)} className="group flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', item.tone === 'urgent' ? 'bg-palette-danger-500' : 'bg-palette-brand-400')} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-palette-neutral-900">{item.what}</span>
                      <span className="mt-0.5 block text-sm text-palette-neutral-700">{item.why}</span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-palette-brand-700">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        {item.prepared}
                      </span>
                    </span>
                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-palette-neutral-700 group-hover:text-palette-brand-700">
                      <span className="hidden sm:inline">{item.cta}</span>
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-8">
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-palette-neutral-900">Resume work</h2>
              <Link to="/workspace" className="text-xs font-medium text-palette-neutral-600 hover:text-palette-brand-700">
                All tasks
              </Link>
            </div>
            {resumable.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">Tasks you start or save will wait here.</p>
            ) : (
              <ul className="space-y-1.5">
                {resumable.map((task) => (
                  <li key={task.id}>
                    <button type="button" onClick={() => navigate(`/workspace/${task.id}`)} className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-left hover:bg-muted/60">
                      <span className="block truncate text-sm font-medium text-palette-neutral-900">{task.title}</span>
                      <span className="mt-1 flex items-center gap-2">
                        <TaskStatusPill status={displayStatus(task, now)} />
                        <span className="text-xs text-palette-neutral-550">
                          {task.saved ? 'Saved · ' : ''}
                          {relativeTime(task.updatedAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-palette-neutral-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-palette-neutral-900">Let agents handle recurring work</h2>
            </div>
            <p className="mt-1 text-xs text-palette-neutral-600">Supervised agents work within the permissions you set and ask before anything consequential.</p>
            <ul className="mt-3 space-y-1.5">
              {AGENT_ORDER.map((id) => (
                <li key={id} className="flex items-center justify-between gap-2 text-sm">
                  <Link to={`/agents/${id}`} className="truncate text-palette-neutral-800 hover:text-palette-brand-700">
                    {AGENT_DEFINITIONS[id].name.replace(' Agent', '')}
                  </Link>
                  <AgentStatusPill status={agents[id].status} />
                </li>
              ))}
            </ul>
            <Link to="/agents" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-palette-brand-700 hover:underline">
              Explore agents
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-palette-neutral-900">Ways to work with AI</h2>
        <p className="mt-0.5 text-xs text-palette-neutral-550">Start wherever you're comfortable. You stay in control at every level.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_LEVELS.map((level, index) => (
            <button
              key={level.label}
              type="button"
              onClick={() => (level.to ? navigate(level.to) : level.query && launch(level.query))}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left hover:border-palette-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <level.icon className="mt-0.5 h-4 w-4 shrink-0 text-palette-neutral-500" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium text-palette-neutral-900">
                  {index + 1}. {level.label}
                </span>
                <span className="block text-xs text-palette-neutral-600">{level.body}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
