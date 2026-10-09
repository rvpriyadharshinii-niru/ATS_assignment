import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn'

export function StepLabel({ step, children, className }: { step: number; children: ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-palette-neutral-600', className)}>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-palette-neutral-200 text-[11px] font-semibold text-palette-neutral-700">{step}</span>
      {children}
    </p>
  )
}

export function EmptyStudio({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-palette-neutral-400 bg-card p-10 text-center">
      <p className="text-sm font-medium text-palette-neutral-900">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  )
}
