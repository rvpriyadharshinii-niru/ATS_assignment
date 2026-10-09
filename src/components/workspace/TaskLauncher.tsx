import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import { EXAMPLE_PROMPTS, SUGGESTED_TASKS } from '../../workspace/presets'
import { btn } from './styles'

/** Never an empty chat: a new task always opens with concrete things the AI can do. */
export function TaskLauncher({ taskId }: { taskId: string }) {
  const send = useWorkspaceStore((state) => state.send)
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <div>
        <h2 className="text-lg font-semibold text-palette-neutral-900">What should we work on?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick a task, or describe it in the conversation. The work will appear here for you to inspect and approve.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SUGGESTED_TASKS.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => send(taskId, task.query)}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-palette-brand-300 hover:bg-palette-brand-100/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <task.icon className="mt-0.5 h-5 w-5 shrink-0 text-palette-brand-600" aria-hidden="true" />
            <span>
              <span className="block text-sm font-semibold text-palette-neutral-900">{task.label}</span>
              <span className="block text-xs text-palette-neutral-600">{task.description}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button key={prompt} type="button" className={btn.chip} onClick={() => send(taskId, prompt)}>
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
