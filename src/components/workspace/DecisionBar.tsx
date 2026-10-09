import { Check, Clock, UserX } from 'lucide-react'
import { useState } from 'react'
import { advanceConsequences, advanceCtaLabel, nextStage } from '../../lib/stage'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import type { Candidate } from '../../types/domain'
import type { WorkspaceTask } from '../../types/workspace'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { btn } from './styles'

/**
 * Human decision controls. Every consequential option opens a confirmation that lists exactly
 * what will change; Defer changes nothing. There is no AI-initiated rejection anywhere.
 */
export function DecisionBar({ task, candidate, compact = false }: { task: WorkspaceTask; candidate: Candidate; compact?: boolean }) {
  const approveAdvance = useWorkspaceStore((state) => state.approveAdvance)
  const decide = useWorkspaceStore((state) => state.decide)
  const declineCandidate = useWorkspaceStore((state) => state.declineCandidate)
  const [dialog, setDialog] = useState<'advance' | 'decline' | null>(null)
  const decision = task.decisions[candidate.id]
  const toStage = nextStage(candidate.stage)

  if (candidate.rejected) {
    return <p className="text-sm text-muted-foreground">{candidate.name} is no longer in the active pipeline.</p>
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {decision === 'shortlisted' ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-palette-success-150 px-2.5 py-1.5 text-sm font-medium text-palette-success-700">
          <Check className="h-4 w-4" aria-hidden="true" />
          Moved to {candidate.stage}
        </span>
      ) : (
        toStage && (
          <button type="button" className={btn.primary} onClick={() => setDialog('advance')}>
            {advanceCtaLabel(toStage)}
          </button>
        )
      )}
      {decision === 'deferred' ? (
        <button type="button" className={btn.secondary} onClick={() => decide(task.id, candidate.id, null)}>
          <Clock className="h-4 w-4" aria-hidden="true" />
          Deferred · undo
        </button>
      ) : (
        decision !== 'shortlisted' && (
          <button type="button" className={btn.secondary} onClick={() => decide(task.id, candidate.id, 'deferred')}>
            Defer
          </button>
        )
      )}
      {!compact && decision !== 'shortlisted' && (
        <button type="button" className={btn.danger} onClick={() => setDialog('decline')}>
          <UserX className="h-4 w-4" aria-hidden="true" />
          Decline…
        </button>
      )}
      {toStage && (
        <ConfirmDialog
          open={dialog === 'advance'}
          onOpenChange={(open) => setDialog(open ? 'advance' : null)}
          title={`${advanceCtaLabel(toStage)}: ${candidate.name}?`}
          lines={[`${candidate.stage} → ${toStage}. You can undo this from the confirmation message.`]}
          consequences={advanceConsequences(toStage)}
          confirmLabel={advanceCtaLabel(toStage)}
          onConfirm={() => {
            approveAdvance(task.id, [candidate.id], toStage)
            setDialog(null)
          }}
        />
      )}
      <ConfirmDialog
        open={dialog === 'decline'}
        onOpenChange={(open) => setDialog(open ? 'decline' : null)}
        title={`Decline ${candidate.name}?`}
        lines={['This is your decision, not an AI recommendation. HireFlow never declines candidates automatically.']}
        consequences={['Remove the candidate from the active pipeline', 'Record your decision in their activity log', 'No message is sent to the candidate']}
        confirmLabel="Decline candidate"
        tone="destructive"
        onConfirm={() => {
          declineCandidate(task.id, candidate.id)
          setDialog(null)
        }}
      />
    </div>
  )
}
