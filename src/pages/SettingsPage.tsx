import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useAppStore } from '../store/useAppStore'

export function SettingsPage() {
  const resetDemoData = useAppStore((state) => state.resetDemoData)
  const pushToast = useAppStore((state) => state.pushToast)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div>
      <PageHeader title="Settings" description="Account and profile information." backTo="/" />
      <div className="space-y-5 p-8">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-palette-brand-100 text-base font-semibold text-palette-brand-700">
              P
            </span>
            <div>
              <p className="text-sm font-semibold text-palette-neutral-900">Priya Sharma</p>
              <p className="text-sm text-muted-foreground">Hiring Manager · Product &amp; Design</p>
            </div>
          </div>
        </div>

        <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Demo data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Undo every change made during this session — candidate moves, added candidates, criteria edits and Copilot actions —
            and restore the prototype to its original state.
          </p>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset demo data
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reset demo data?"
        consequences={[
          'Restore every candidate to their original stage',
          'Remove candidates added during this session',
          'Restore hiring criteria to their original configuration',
          'Clear filters, activity history and Copilot conversations',
        ]}
        confirmLabel="Reset"
        tone="destructive"
        onConfirm={() => {
          resetDemoData()
          setConfirmOpen(false)
          pushToast('Demo data reset.')
        }}
      />
    </div>
  )
}
