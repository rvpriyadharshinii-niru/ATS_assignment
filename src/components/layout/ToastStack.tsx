import { CheckCircle2, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export function ToastStack() {
  const toasts = useAppStore((state) => state.toasts)
  const dismissToast = useAppStore((state) => state.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2.5 rounded-lg border border-border bg-card py-2.5 pl-3.5 pr-2.5 shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-palette-success-600" aria-hidden="true" />
          <p className="text-sm text-foreground">{toast.message}</p>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.()
                dismissToast(toast.id)
              }}
              className="shrink-0 text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-md p-1 text-palette-neutral-400 hover:bg-muted hover:text-palette-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
