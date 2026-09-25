import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border bg-card px-8 py-5">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
