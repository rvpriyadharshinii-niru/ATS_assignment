import { BookOpenCheck, CalendarClock, ClipboardCheck, UserCheck } from 'lucide-react'
import type { ComponentType } from 'react'
import { AGENT_DEFINITIONS } from '../data/agents'
import type { AgentActivityStatus, AgentId, CandidateReviewVerdict, CriterionFinding } from '../types/agents'

export const AGENT_ICON: Record<AgentId, ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  'candidate-review': UserCheck,
  'interview-coordination': CalendarClock,
  assessment: ClipboardCheck,
  'interview-prep': BookOpenCheck,
}

export const ACTIVITY_STATUS_LABEL: Record<AgentActivityStatus, string> = {
  pending: 'Awaiting approval',
  'needs-review': 'Needs review',
  completed: 'Completed',
  failed: 'Failed',
  declined: 'Declined',
}

export const VERDICT_TONE: Record<CandidateReviewVerdict, string> = {
  shortlist: 'bg-palette-success-150 text-palette-success-700 ring-1 ring-inset ring-palette-success-400/30',
  'shortlist-validate': 'bg-palette-info-150 text-palette-info-700 ring-1 ring-inset ring-palette-info-400/30',
  'human-review': 'bg-palette-warning-150 text-palette-warning-700 ring-1 ring-inset ring-palette-warning-400/30',
  'insufficient-evidence': 'bg-palette-warning-150 text-palette-warning-700 ring-1 ring-inset ring-palette-warning-400/30',
}

export const FINDING_LABEL: Record<CriterionFinding, { label: string; className: string }> = {
  supporting: { label: 'Supporting', className: 'text-palette-success-700' },
  partial: { label: 'Partial', className: 'text-palette-neutral-700' },
  gap: { label: 'Gap (limited evidence)', className: 'text-palette-danger-700' },
  missing: { label: 'Missing evidence', className: 'text-palette-warning-700' },
}

export function formatRelative(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp)
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export const inputClass =
  'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-palette-neutral-900 placeholder:text-palette-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40'

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-palette-neutral-700 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export const sectionLabelClass = 'text-xs font-semibold uppercase tracking-wide text-palette-neutral-600'

export function isAgentId(value: string | undefined): value is AgentId {
  return !!value && value in AGENT_DEFINITIONS
}
