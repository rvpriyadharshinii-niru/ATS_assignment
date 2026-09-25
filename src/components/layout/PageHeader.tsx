import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  /** Renders a "Back" affordance above the title, linking here. */
  backTo?: string
  backLabel?: string
}

export function PageHeader({ eyebrow, title, description, actions, backTo, backLabel = 'Back' }: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-card px-8 py-5">
      {backTo && (
        <Link
          to={backTo}
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-palette-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>}
          <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
