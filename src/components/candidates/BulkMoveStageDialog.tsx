import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { Candidate, CandidateStage } from '../../types/domain'

const STAGES: CandidateStage[] = ['Applied', 'AI Screened', 'HM Review', 'Interview', 'Final', 'Offer']

export function BulkMoveStageDialog({ open, onOpenChange, candidates }: { open: boolean; onOpenChange: (open: boolean) => void; candidates: Candidate[] }) {
  const advanceCandidates = useAppStore((state) => state.advanceCandidates)
  const [target, setTarget] = useState<CandidateStage>('Interview')

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-palette-neutral-900/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-base font-semibold text-palette-neutral-900">Move {candidates.length} candidates</Dialog.Title>
          <label className="mt-3 block text-xs font-medium text-muted-foreground">
            Move to stage
            <select
              value={target}
              onChange={(event) => setTarget(event.target.value as CandidateStage)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-3 rounded-lg bg-muted p-3">
            {candidates.map((candidate) => (
              <p key={candidate.id} className="text-sm text-foreground">
                {candidate.name} — {candidate.stage} → {target}
              </p>
            ))}
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
              onClick={() => {
                advanceCandidates(
                  candidates.map((candidate) => candidate.id),
                  target,
                )
                onOpenChange(false)
              }}
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Confirm & move {candidates.length}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
