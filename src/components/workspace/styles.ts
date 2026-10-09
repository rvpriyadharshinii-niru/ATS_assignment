import { useEffect, useState } from 'react'
import type { TaskStatus, WorkspaceTask } from '../../types/workspace'

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-palette-neutral-700 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  ghost:
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-palette-neutral-600 hover:bg-muted hover:text-palette-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  danger:
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-palette-danger-600 hover:bg-palette-danger-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  chip: 'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[13px] font-medium text-palette-neutral-700 transition-colors hover:border-palette-brand-300 hover:bg-palette-brand-100 hover:text-palette-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
}

export const inputBase =
  'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-palette-neutral-900 placeholder:text-palette-neutral-450 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30'

/**
 * Current time that keeps ticking until `until` has passed, so simulated progress plays out and then
 * settles. The clock is state, never read during render, which keeps components pure.
 */
export function useNow(until = 0, interval = 120): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (now >= until) return
    const timer = window.setInterval(() => setNow(Date.now()), interval)
    return () => window.clearInterval(timer)
  }, [now, until, interval])
  return now
}

export function displayStatus(task: WorkspaceTask, now: number): TaskStatus {
  return now < task.revealAt ? 'preparing' : task.status
}

export function relativeTime(timestamp: number, now = Date.now()): string {
  const minutes = Math.round((now - timestamp) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days}d ago`
}
