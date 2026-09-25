import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { advanceConsequences, nextStage } from '../../lib/stage'
import { useAppStore } from '../../store/useAppStore'
import type { Candidate } from '../../types/domain'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { EmailComposeDialog } from './EmailComposeDialog'

type OpenDialog = 'advance' | 'hold' | 'reject' | 'email' | null

export function CandidateActionsMenu({ candidate }: { candidate: Candidate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const advanceCandidates = useAppStore((state) => state.advanceCandidates)
  const holdCandidates = useAppStore((state) => state.holdCandidates)
  const rejectCandidates = useAppStore((state) => state.rejectCandidates)
  const pushToast = useAppStore((state) => state.pushToast)
  const undoLastMutation = useAppStore((state) => state.undoLastMutation)
  const upcoming = nextStage(candidate.stage)

  if (candidate.rejected) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setMenuOpen((current) => !current)
        }}
        aria-label={`Actions for ${candidate.name}`}
        className="rounded-md p-1.5 text-palette-neutral-400 hover:bg-muted hover:text-palette-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
            {upcoming && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setDialog('advance')
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
              >
                Advance to {upcoming}
              </button>
            )}
            {!candidate.hold && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setDialog('hold')
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
              >
                Hold
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setDialog('email')
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              Send email
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setDialog('reject')
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-muted"
            >
              Reject
            </button>
          </div>
        </>
      )}

      {upcoming && (
        <ConfirmDialog
          open={dialog === 'advance'}
          onOpenChange={(open) => setDialog(open ? 'advance' : null)}
          title={`Advance ${candidate.name}?`}
          lines={[`${candidate.stage} → ${upcoming}`]}
          consequences={advanceConsequences(upcoming)}
          confirmLabel="Confirm & advance"
          onConfirm={() => {
            advanceCandidates([candidate.id], upcoming)
            setDialog(null)
            pushToast(`${candidate.name} moved to ${upcoming}.`, { actionLabel: 'Undo', onAction: undoLastMutation })
          }}
        />
      )}

      <ConfirmDialog
        open={dialog === 'hold'}
        onOpenChange={(open) => setDialog(open ? 'hold' : null)}
        title={`Hold ${candidate.name}?`}
        lines={[`Stays in ${candidate.stage}`]}
        consequences={['Flag them as on hold', 'Keep their current stage unchanged']}
        confirmLabel="Confirm hold"
        onConfirm={() => {
          holdCandidates([candidate.id])
          setDialog(null)
          pushToast(`${candidate.name} placed on hold.`)
        }}
      />

      <EmailComposeDialog open={dialog === 'email'} onOpenChange={(open) => setDialog(open ? 'email' : null)} candidate={candidate} />

      <ConfirmDialog
        open={dialog === 'reject'}
        onOpenChange={(open) => setDialog(open ? 'reject' : null)}
        title={`Reject ${candidate.name}?`}
        consequences={['Move them to Rejected', 'Remove them from the active hiring pipeline', 'Prepare candidate communication']}
        confirmLabel="Confirm rejection"
        tone="destructive"
        onConfirm={() => {
          rejectCandidates([candidate.id])
          setDialog(null)
          pushToast(`${candidate.name} rejected.`)
        }}
      />
    </div>
  )
}
