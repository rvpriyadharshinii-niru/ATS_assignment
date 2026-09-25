import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import type { CandidateSource, OpeningId } from '../../types/domain'

const SOURCE_OPTIONS: CandidateSource[] = ['LinkedIn', 'Career site', 'Referral', 'Agency', 'Manual']

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      {required && <span className="text-destructive"> *</span>}
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClass =
  'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40'

export function AddCandidateDialog({ open, onOpenChange, openingId, openingTitle }: { open: boolean; onOpenChange: (open: boolean) => void; openingId: OpeningId; openingTitle: string }) {
  const addCandidate = useAppStore((state) => state.addCandidate)
  const pushToast = useAppStore((state) => state.pushToast)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentCompany, setCurrentCompany] = useState('')
  const [location, setLocation] = useState('')
  const [source, setSource] = useState<CandidateSource>('Manual')
  const [notes, setNotes] = useState('')

  const canSubmit = name.trim().length > 0 && email.trim().length > 0

  function reset() {
    setName('')
    setEmail('')
    setPhone('')
    setCurrentTitle('')
    setCurrentCompany('')
    setLocation('')
    setSource('Manual')
    setNotes('')
  }

  function handleSubmit() {
    if (!canSubmit) return
    const candidate = addCandidate({
      name: name.trim(),
      openingId,
      email: email.trim(),
      phone: phone.trim() || undefined,
      currentTitle: currentTitle.trim() || undefined,
      currentCompany: currentCompany.trim() || undefined,
      location: location.trim() || undefined,
      source,
      notes: notes.trim() || undefined,
    })
    reset()
    onOpenChange(false)
    pushToast('Candidate added.')
    navigate(`/candidates/${candidate.id}`)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-palette-neutral-900/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-2.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="text-base font-semibold text-palette-neutral-900">Add candidate</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="rounded-md p-1.5 text-palette-neutral-400 hover:bg-muted hover:text-palette-neutral-600">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Adding to {openingTitle}.</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Full name" required>
                <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Jordan Lee" />
              </Field>
            </div>
            <Field label="Email" required>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="jordan@example.com" />
            </Field>
            <Field label="Phone">
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} placeholder="+1 555 000 0000" />
            </Field>
            <Field label="Current title">
              <input value={currentTitle} onChange={(event) => setCurrentTitle(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Current company">
              <input value={currentCompany} onChange={(event) => setCurrentCompany(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Location">
              <input value={location} onChange={(event) => setLocation(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Source">
              <select value={source} onChange={(event) => setSource(event.target.value as CandidateSource)} className={inputClass}>
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Resume">
                <input type="file" disabled className="w-full text-sm text-muted-foreground file:mr-2 file:rounded-md file:border file:border-border file:bg-muted file:px-2.5 file:py-1 file:text-xs disabled:cursor-not-allowed disabled:opacity-60" />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Notes">
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={inputClass} />
              </Field>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button type="button" className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add candidate
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
