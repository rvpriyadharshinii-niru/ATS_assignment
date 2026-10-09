import { FileText, FlaskConical, Quote } from 'lucide-react'
import type { ReactNode } from 'react'
import { citationLabel } from '../../data/sources'
import { cn } from '../../lib/cn'
import { displayStrength } from '../../lib/evidence'
import type { EvidenceStrength } from '../../types/domain'
import type { TaskStatus } from '../../types/workspace'

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-[11px] font-semibold uppercase tracking-wide text-palette-neutral-550', className)}>{children}</p>
}

const STATUS: Record<TaskStatus, { label: string; className: string; dot: string }> = {
  preparing: { label: 'Preparing', className: 'bg-palette-brand-100 text-palette-brand-700', dot: 'bg-palette-brand-500 animate-pulse' },
  'in-progress': { label: 'In progress', className: 'bg-palette-info-150 text-palette-info-700', dot: 'bg-palette-info-500' },
  'needs-clarification': { label: 'Needs your input', className: 'bg-palette-warning-150 text-palette-warning-700', dot: 'bg-palette-warning-500' },
  ready: { label: 'Ready for review', className: 'bg-palette-brand-100 text-palette-brand-700', dot: 'bg-palette-brand-500' },
  'awaiting-approval': { label: 'Awaiting approval', className: 'bg-palette-warning-150 text-palette-warning-700', dot: 'bg-palette-warning-500' },
  completed: { label: 'Completed', className: 'bg-palette-success-150 text-palette-success-700', dot: 'bg-palette-success-500' },
  partial: { label: 'Partially completed', className: 'bg-palette-warning-150 text-palette-warning-700', dot: 'bg-palette-warning-500' },
  failed: { label: 'Failed', className: 'bg-palette-danger-150 text-palette-danger-700', dot: 'bg-palette-danger-500' },
}

export function TaskStatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  const tone = STATUS[status]
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium', tone.className, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} aria-hidden="true" />
      {tone.label}
    </span>
  )
}

const STRENGTH_TONE: Record<EvidenceStrength, string> = {
  Strong: 'bg-palette-success-150 text-palette-success-700',
  Good: 'bg-palette-info-150 text-palette-info-700',
  Moderate: 'bg-palette-neutral-200 text-palette-neutral-700',
  Limited: 'bg-palette-neutral-200 text-palette-neutral-700',
  Possible: 'bg-palette-warning-150 text-palette-warning-700',
  Unclear: 'bg-palette-warning-150 text-palette-warning-700',
  'Not available': 'bg-palette-warning-150 text-palette-warning-700',
}

export function StrengthPill({ strength, className }: { strength: EvidenceStrength; className?: string }) {
  return <span className={cn('inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold', STRENGTH_TONE[strength], className)}>{displayStrength(strength)}</span>
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-palette-neutral-200 font-semibold text-palette-neutral-700',
        size === 'sm' ? 'h-6 w-6 text-[10px]' : size === 'lg' ? 'h-11 w-11 text-sm' : 'h-8 w-8 text-xs',
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

/** Every AI-prepared surface says, quietly, that it is a deterministic simulation. */
export function SimulatedNote({ className, children = 'Simulated AI preparation' }: { className?: string; children?: ReactNode }) {
  return (
    <span
      title="Prepared by HireFlow's deterministic simulation over the prototype data. No live AI model was called."
      className={cn('inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-dashed border-palette-neutral-400 px-1.5 py-0.5 text-[11px] font-medium text-palette-neutral-600', className)}
    >
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      {children}
    </span>
  )
}

export function CitationChip({ passageId, onOpen, conflict }: { passageId: string; onOpen?: () => void; conflict?: boolean }) {
  const label = citationLabel(passageId)
  const Icon = label.startsWith('Resume') ? FileText : Quote
  const className = cn(
    'inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
    conflict ? 'border-palette-warning-400 bg-palette-warning-100 text-palette-warning-700' : 'border-border bg-palette-neutral-100 text-palette-neutral-600',
  )
  if (!onOpen) {
    return (
      <span className={className}>
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
    )
  }
  return (
    <button type="button" onClick={onOpen} className={cn(className, 'hover:border-palette-brand-300 hover:text-palette-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </button>
  )
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: typeof FileText; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <Icon className="h-6 w-6 text-palette-neutral-450" aria-hidden="true" />
      <p className="mt-2 text-sm font-semibold text-palette-neutral-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
