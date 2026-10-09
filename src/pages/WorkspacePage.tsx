import { Bookmark, MessageSquare, PanelLeftOpen, Plus, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ConversationPanel } from '../components/workspace/ConversationPanel'
import { WorkSurface } from '../components/workspace/WorkSurface'
import { TaskStatusPill } from '../components/workspace/ui'
import { btn, displayStatus, relativeTime, useNow } from '../components/workspace/styles'
import { cn } from '../lib/cn'
import { useAllTasks, useOpenTasks, useWorkspaceStore } from '../store/useWorkspaceStore'
import type { WorkspaceTask } from '../types/workspace'
import { SUGGESTED_TASKS, useLaunchTask } from '../workspace/presets'

function TaskSwitcher({ activeId }: { activeId?: string }) {
  const open = useOpenTasks()
  const closeTask = useWorkspaceStore((state) => state.closeTask)
  const newTask = useWorkspaceStore((state) => state.newTask)
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-card px-3 py-1.5">
      {open.map((task) => (
        <div
          key={task.id}
          className={cn(
            'group flex max-w-[240px] shrink-0 items-center gap-1 rounded-lg pl-2.5 pr-1 text-sm',
            task.id === activeId ? 'bg-palette-brand-100 text-palette-brand-800' : 'text-palette-neutral-600 hover:bg-muted',
          )}
        >
          <Link to={`/workspace/${task.id}`} className="flex min-w-0 items-center gap-1.5 py-1.5" title={task.title}>
            {task.saved && <Bookmark className="h-3 w-3 shrink-0" aria-label="Saved" />}
            <span className="truncate font-medium">{task.title}</span>
          </Link>
          <button
            type="button"
            aria-label={`Close ${task.title}`}
            onClick={() => {
              closeTask(task.id)
              const next = open.find((entry) => entry.id !== task.id)
              if (task.id === activeId) navigate(next ? `/workspace/${next.id}` : '/workspace')
            }}
            className="rounded p-1 opacity-60 hover:bg-palette-neutral-200 hover:opacity-100"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => navigate(`/workspace/${newTask()}`)} className={cn(btn.ghost, 'shrink-0')}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        New task
      </button>
      <Link to="/workspace" className={cn(btn.ghost, 'ml-auto shrink-0')}>
        All tasks
      </Link>
    </div>
  )
}

function SplitWorkspace({ task }: { task: WorkspaceTask }) {
  const panelWidth = useWorkspaceStore((state) => state.panelWidth)
  const collapsed = useWorkspaceStore((state) => state.panelCollapsed)
  const setPanel = useWorkspaceStore((state) => state.setPanel)
  const [mobileTab, setMobileTab] = useState<'chat' | 'work'>('work')
  const dragging = useRef(false)
  const viewKey = JSON.stringify(task.view)
  const lastViewKey = useRef(viewKey)

  // On narrow screens, a request that changes the work surface switches to it automatically.
  useEffect(() => {
    if (lastViewKey.current !== viewKey) setMobileTab('work')
    lastViewKey.current = viewKey
  }, [viewKey])

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current) return
      const container = document.getElementById('workspace-split')
      if (!container) return
      const left = container.getBoundingClientRect().left
      setPanel({ width: Math.max(300, Math.min(560, event.clientX - left)) })
    }
    const up = () => {
      dragging.current = false
      document.body.style.cursor = ''
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [setPanel])

  return (
    <>
      <div className="flex border-b border-border bg-card lg:hidden" role="tablist" aria-label="Workspace panels">
        {(['chat', 'work'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mobileTab === tab}
            onClick={() => setMobileTab(tab)}
            className={cn('flex-1 border-b-2 py-2 text-sm font-medium', mobileTab === tab ? 'border-primary text-palette-brand-700' : 'border-transparent text-palette-neutral-600')}
          >
            {tab === 'chat' ? 'Conversation' : 'Workspace'}
          </button>
        ))}
      </div>
      <div id="workspace-split" className="flex min-h-0 flex-1">
        {collapsed ? (
          <div className="hidden w-12 shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-3 lg:flex">
            <button type="button" className={btn.ghost} onClick={() => setPanel({ collapsed: false })} aria-label="Show conversation" title="Show conversation">
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            </button>
            <MessageSquare className="h-4 w-4 text-palette-neutral-400" aria-hidden="true" />
          </div>
        ) : (
          <>
            <div style={{ width: panelWidth }} className="hidden min-h-0 shrink-0 border-r border-border lg:block">
              <ConversationPanel task={task} onCollapse={() => setPanel({ collapsed: true })} />
            </div>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize conversation panel"
              tabIndex={0}
              onPointerDown={() => {
                dragging.current = true
                document.body.style.cursor = 'col-resize'
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') setPanel({ width: Math.max(300, panelWidth - 24) })
                if (event.key === 'ArrowRight') setPanel({ width: Math.min(560, panelWidth + 24) })
              }}
              className="-ml-px hidden w-1.5 shrink-0 cursor-col-resize hover:bg-palette-brand-200 focus-visible:bg-palette-brand-300 focus-visible:outline-none lg:block"
            />
          </>
        )}
        <div className={cn('min-h-0 min-w-0 flex-1 lg:hidden', mobileTab === 'chat' ? 'block' : 'hidden')}>
          <ConversationPanel task={task} />
        </div>
        <div className={cn('min-h-0 min-w-0 flex-1 lg:block', mobileTab === 'work' ? 'block' : 'hidden')}>
          <WorkSurface task={task} />
        </div>
      </div>
    </>
  )
}

function TaskIndex() {
  const tasks = useAllTasks()
  const now = useNow()
  const launch = useLaunchTask()
  const newTask = useWorkspaceStore((state) => state.newTask)
  const navigate = useNavigate()
  const groups = [
    { title: 'In progress', items: tasks.filter((task) => !['completed', 'partial'].includes(task.status) || task.saved) },
    { title: 'Completed', items: tasks.filter((task) => ['completed', 'partial'].includes(task.status) && !task.saved) },
  ]
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">AI Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every task you've delegated, with its conversation and prepared work. Pick up exactly where you left off.</p>
        </div>
        <button type="button" className={btn.primary} onClick={() => navigate(`/workspace/${newTask()}`)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New task
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_TASKS.map((task) => (
          <button key={task.id} type="button" className={btn.chip} onClick={() => launch(task.query)}>
            <task.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {task.label}
          </button>
        ))}
      </div>
      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="mb-2 text-sm font-semibold text-palette-neutral-900">
            {group.title} · {group.items.length}
          </h2>
          {group.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">Nothing here yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {group.items.map((task) => (
                <li key={task.id}>
                  <Link to={`/workspace/${task.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted">
                    <Sparkles className="h-4 w-4 shrink-0 text-palette-brand-500" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-palette-neutral-900">{task.title}</span>
                      <span className="block text-xs text-palette-neutral-550">
                        {task.messages.filter((message) => message.role === 'user').length} requests · updated {relativeTime(task.updatedAt)}
                        {task.saved ? ' · saved' : ''}
                      </span>
                    </span>
                    <TaskStatusPill status={displayStatus(task, now)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

export function WorkspacePage() {
  const { taskId } = useParams()
  const task = useWorkspaceStore((state) => (taskId ? state.tasks[taskId] : undefined))
  const activate = useWorkspaceStore((state) => state.activate)

  const exists = !!task
  useEffect(() => {
    if (taskId && exists) activate(taskId)
  }, [taskId, exists, activate])

  if (taskId && !task) return <Navigate to="/workspace" replace />
  return (
    <div className="flex h-full min-h-0 flex-col">
      <TaskSwitcher activeId={taskId} />
      {task ? <SplitWorkspace key={task.id} task={task} /> : <div className="min-h-0 flex-1 overflow-y-auto">{<TaskIndex />}</div>}
    </div>
  )
}
