import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '../../lib/cn'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  lines?: string[]
  consequences: string[]
  confirmLabel: string
  tone?: 'default' | 'destructive'
  onConfirm: () => void
}

export function ConfirmDialog({ open, onOpenChange, title, lines = [], consequences, confirmLabel, tone = 'default', onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-palette-neutral-900/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-base font-semibold text-palette-neutral-900">{title}</Dialog.Title>
          {lines.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {lines.map((line) => (
                <p key={line} className="text-sm text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-lg bg-muted p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">This will</p>
            <ul className="mt-1.5 space-y-1">
              {consequences.map((consequence) => (
                <li key={consequence} className="text-sm text-foreground">
                  · {consequence}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                'rounded-lg px-3.5 py-2 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                tone === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground',
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
