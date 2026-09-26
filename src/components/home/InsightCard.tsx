import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HomeInsight } from '../../data/insights'
import { useAppStore } from '../../store/useAppStore'

const actionButtonClass =
  'inline-flex min-w-[148px] items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** Either a real page destination or a query that continues the flow inside Copilot — narrowed once, here. */
function InsightAction({ action }: { action: NonNullable<HomeInsight['action']> }) {
  const submitCopilotMessage = useAppStore((state) => state.submitCopilotMessage)
  if ('to' in action) {
    return (
      <Link to={action.to} className={actionButtonClass}>
        {action.label}
      </Link>
    )
  }
  return (
    <button type="button" onClick={() => submitCopilotMessage(action.query)} className={actionButtonClass}>
      {action.label}
    </button>
  )
}

export function InsightCard({ insight }: { insight: HomeInsight }) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-lg border-b border-border px-4 py-3.5 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-palette-neutral-150 text-palette-neutral-500">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-palette-neutral-500">{insight.openingTitle}</p>
          <h3 className="mt-0.5 text-[15px] font-semibold text-palette-neutral-900">{insight.headline}</h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{insight.detail}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {insight.action && <InsightAction action={insight.action} />}
        {insight.secondaryAction && (
          <Link
            to={insight.secondaryAction.to}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-palette-neutral-900 focus-visible:outline-none focus-visible:underline"
          >
            {insight.secondaryAction.label}
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  )
}
