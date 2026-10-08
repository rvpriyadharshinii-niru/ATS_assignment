import { Play, Send } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../../../agents/display'
import { actionGate, generateInterviewGuide, ROUND_TYPES } from '../../../agents/simulate'
import { deriveInterviewType } from '../../../lib/candidateStatus'
import { cn } from '../../../lib/cn'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useAgentStore } from '../../../store/useAgentStore'
import { useAppStore } from '../../../store/useAppStore'
import type { InterviewGuide } from '../../../types/agents'
import { InterviewGuideView } from '../InterviewGuideView'
import { EmptyStudio, StepLabel } from './studioUi'

const SHORTLISTED_STAGES = new Set(['HM Review', 'Interview', 'Final'])

export function InterviewPrepStudio() {
  const record = useAgentStore((state) => state.agents['interview-prep'])
  const markTested = useAgentStore((state) => state.markTested)
  const pushToast = useAppStore((state) => state.pushToast)
  useAppStore((state) => state.criteriaVersion)
  const allCandidates = useAllEffectiveCandidates()
  const [searchParams] = useSearchParams()

  const pool = allCandidates.filter((candidate) => record.config.openingIds.includes(candidate.openingId) && SHORTLISTED_STAGES.has(candidate.stage) && !candidate.rejected)
  const requested = searchParams.get('candidate')
  const [candidateId, setCandidateId] = useState<string>(pool.find((candidate) => candidate.id === requested)?.id ?? pool[0]?.id ?? '')
  const candidate = pool.find((entry) => entry.id === candidateId)
  const [roundType, setRoundType] = useState<string>(candidate ? deriveInterviewType(candidate) : ROUND_TYPES[0].label)
  const [guide, setGuide] = useState<InterviewGuide | null>(null)
  const share = actionGate('interview-prep', record.config, 'share-panel')

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
      <section className="space-y-4 self-start rounded-xl border border-border bg-card p-4 shadow-xs">
        <div>
          <StepLabel step={1}>Shortlisted candidate</StepLabel>
          <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto pr-1">
            {pool.map((entry) => (
              <li key={entry.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm',
                    candidateId === entry.id ? 'border-primary bg-palette-brand-100/50' : 'border-transparent hover:bg-muted/60',
                  )}
                >
                  <input
                    type="radio"
                    name="prep-candidate"
                    checked={candidateId === entry.id}
                    onChange={() => {
                      setCandidateId(entry.id)
                      setRoundType(deriveInterviewType(entry))
                      setGuide(null)
                    }}
                    className="accent-[var(--primary)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-palette-neutral-900">{entry.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {entry.stage}
                      {entry.evidence.length === 0 ? ' · no evidence recorded yet' : ''}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <StepLabel step={2}>Interview round</StepLabel>
          <select aria-label="Interview round" className={cn(inputClass, 'mt-2')} value={roundType} onChange={(event) => setRoundType(event.target.value)}>
            {ROUND_TYPES.map((round) => (
              <option key={round.label} value={round.label}>
                {round.label} · {round.minutes} min
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={cn(primaryButtonClass, 'w-full')}
          disabled={!candidate}
          onClick={() => {
            if (!candidate) return
            setGuide(generateInterviewGuide(candidate, roundType, record.config))
            markTested('interview-prep')
          }}
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          Generate guide
        </button>
        <p className="text-xs text-muted-foreground">Uses configuration v{record.version}. Nothing is shared while testing.</p>
      </section>

      <div className="min-w-0 space-y-4">
        {guide ? (
          <>
            <InterviewGuideView guide={guide} />
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
              <button
                type="button"
                className={secondaryButtonClass}
                disabled={!share.enabled}
                onClick={() => pushToast('Test mode: the guide was not shared. In live mode it would go to the interview panel’s kit.')}
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Share with panel
              </button>
              <p className="text-xs text-muted-foreground">
                {!share.enabled
                  ? 'Sharing is turned off in Configuration.'
                  : share.requiresApproval
                    ? 'In live mode, sharing waits for your approval (set in Configuration).'
                    : 'In live mode, the agent shares guides with the panel automatically.'}
              </p>
            </div>
          </>
        ) : (
          <EmptyStudio title="Generate an interview guide" body="Pick a shortlisted candidate. Every question links to a job requirement and to what the candidate’s evidence does or doesn’t show." />
        )}
      </div>
    </div>
  )
}
