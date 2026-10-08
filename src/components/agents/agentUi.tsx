import { FlaskConical } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { AgentActivityStatus, AgentStatus } from '../../types/agents'

const STATUS_TONE: Record<AgentStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-palette-success-150 text-palette-success-700' },
  paused: { label: 'Paused', className: 'bg-palette-warning-150 text-palette-warning-700' },
  draft: { label: 'Draft', className: 'bg-palette-neutral-150 text-palette-neutral-600' },
}

export function AgentStatusPill({ status }: { status: AgentStatus }) {
  const tone = STATUS_TONE[status]
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', tone.className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {tone.label}
    </span>
  )
}

const ACTIVITY_TONE: Record<AgentActivityStatus, { label: string; className: string }> = {
  pending: { label: 'Awaiting approval', className: 'bg-palette-brand-100 text-palette-brand-700' },
  'needs-review': { label: 'Needs review', className: 'bg-palette-warning-150 text-palette-warning-700' },
  completed: { label: 'Completed', className: 'bg-palette-success-150 text-palette-success-700' },
  failed: { label: 'Failed', className: 'bg-palette-danger-150 text-palette-danger-700' },
  declined: { label: 'Declined', className: 'bg-palette-neutral-150 text-palette-neutral-600' },
}

export function ActivityStatusPill({ status }: { status: AgentActivityStatus }) {
  const tone = ACTIVITY_TONE[status]
  return <span className={cn('inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', tone.className)}>{tone.label}</span>
}

/** Every agent output in this prototype is a deterministic simulation — always say so next to it. */
export function SimulatedTag({ className }: { className?: string }) {
  return (
    <span
      title="Deterministic simulation using HireFlow's sample data. No live AI model was called."
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-dashed border-palette-neutral-400 px-1.5 py-0.5 text-[11px] font-medium text-palette-neutral-600',
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      Simulated
    </span>
  )
}

