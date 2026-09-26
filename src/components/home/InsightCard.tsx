import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import type { HomeInsight } from '../../data/insights'
import { useAppStore } from '../../store/useAppStore'

const actionButtonClass =
  'inline-flex items-center gap-1 rounded-lg bg-[image:var(--gradient-brand_wash)] px-3.5 py-2 text-sm font-medium text-background shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

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

export function InsightCard({ insight, primary = false }: { insight: HomeInsight; primary?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-6 rounded-lg px-4 py-4',
        primary ? 'bg-palette-brand-100/70' : 'border-b border-border last:border-b-0',
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            primary ? 'bg-[image:var(--gradient-brand_wash)] text-background' : 'bg-palette-neutral-150 text-palette-neutral-500',
          )}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-palette-brand-600">{insight.openingTitle}</p>
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
