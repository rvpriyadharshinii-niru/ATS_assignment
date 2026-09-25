import * as Dialog from '@radix-ui/react-dialog'
import { CheckCircle2, FileText, Upload, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getCandidate } from '../../data/candidates'
import { useAppStore } from '../../store/useAppStore'
import type { OpeningId } from '../../types/domain'

type Step = 'upload' | 'map' | 'review'

type AtsField = 'name' | 'email' | 'phone' | 'currentTitle' | 'currentCompany' | 'location'

const ATS_FIELDS: { key: AtsField; label: string; required?: boolean }[] = [
  { key: 'name', label: 'Full name', required: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'currentTitle', label: 'Current title' },
  { key: 'currentCompany', label: 'Current company' },
  { key: 'location', label: 'Location' },
]

const GUESS_PATTERNS: Record<AtsField, RegExp> = {
  name: /name/i,
  email: /e-?mail/i,
  phone: /phone|mobile/i,
  currentTitle: /title|role/i,
  currentCompany: /company|employer/i,
  location: /location|city/i,
}

/** Minimal client-side CSV split — good enough for a plain comma-separated demo file, no quoting edge cases. */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((cell) => cell.trim())
  const rows = lines.slice(1).map((line) => line.split(',').map((cell) => cell.trim()))
  return { headers, rows }
}

export function ImportCsvDialog({ open, onOpenChange, openingId, openingTitle }: { open: boolean; onOpenChange: (open: boolean) => void; openingId: OpeningId; openingTitle: string }) {
  const addCandidate = useAppStore((state) => state.addCandidate)
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Partial<Record<AtsField, string>>>({})
  const [importedCount, setImportedCount] = useState<number | null>(null)

  function resetAll() {
    setStep('upload')
    setFileName(null)
    setHeaders([])
    setRows([])
    setMapping({})
    setImportedCount(null)
  }

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const { headers: parsedHeaders, rows: parsedRows } = parseCsv(String(reader.result ?? ''))
      setFileName(file.name)
      setHeaders(parsedHeaders)
      setRows(parsedRows)
      const guessed: Partial<Record<AtsField, string>> = {}
      for (const field of ATS_FIELDS) {
        const match = parsedHeaders.find((header) => GUESS_PATTERNS[field.key].test(header))
        if (match) guessed[field.key] = match
      }
      setMapping(guessed)
      setStep('map')
    }
    reader.readAsText(file)
  }

  const mappedRows = useMemo(() => {
    const nameIndex = mapping.name ? headers.indexOf(mapping.name) : -1
    const emailIndex = mapping.email ? headers.indexOf(mapping.email) : -1
    const titleIndex = mapping.currentTitle ? headers.indexOf(mapping.currentTitle) : -1
    const companyIndex = mapping.currentCompany ? headers.indexOf(mapping.currentCompany) : -1
    const locationIndex = mapping.location ? headers.indexOf(mapping.location) : -1
    const phoneIndex = mapping.phone ? headers.indexOf(mapping.phone) : -1

    return rows.map((row) => ({
      name: nameIndex >= 0 ? row[nameIndex]?.trim() : undefined,
      email: emailIndex >= 0 ? row[emailIndex]?.trim() : undefined,
      currentTitle: titleIndex >= 0 ? row[titleIndex]?.trim() : undefined,
      currentCompany: companyIndex >= 0 ? row[companyIndex]?.trim() : undefined,
      location: locationIndex >= 0 ? row[locationIndex]?.trim() : undefined,
      phone: phoneIndex >= 0 ? row[phoneIndex]?.trim() : undefined,
    }))
  }, [rows, headers, mapping])

  const validRows = mappedRows.filter((row) => !!row.name)
  const missingEmail = validRows.filter((row) => !row.email)
  const duplicates = validRows.filter((row) => row.name && getCandidate(row.name.toLowerCase().replace(/\s+/g, '-')))
  const importable = validRows.filter((row) => !duplicates.includes(row))

  function handleImport() {
    for (const row of importable) {
      if (!row.name) continue
      addCandidate({
        name: row.name,
        openingId,
        email: row.email || undefined,
        phone: row.phone || undefined,
        currentTitle: row.currentTitle || undefined,
        currentCompany: row.currentCompany || undefined,
        location: row.location || undefined,
        source: 'CSV Import',
      })
    }
    setImportedCount(importable.length)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetAll()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-palette-neutral-900/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-2.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="text-base font-semibold text-palette-neutral-900">Import candidates</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="rounded-md p-1.5 text-palette-neutral-400 hover:bg-muted hover:text-palette-neutral-600">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Import a CSV of candidates into {openingTitle}.</p>

          {importedCount !== null ? (
            <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-palette-success-600" aria-hidden="true" />
              <p className="text-sm font-semibold text-palette-neutral-900">{importedCount} candidates imported</p>
              <p className="text-sm text-muted-foreground">They now appear in {openingTitle}&rsquo;s Candidates table, source &ldquo;CSV Import&rdquo;.</p>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Done
              </button>
            </div>
          ) : step === 'upload' ? (
            <div className="mt-4">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-palette-brand-300 hover:bg-accent">
                <Upload className="h-6 w-6 text-palette-neutral-400" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">Drag a CSV here, or click to choose a file</span>
                <span className="text-xs text-muted-foreground">Columns like Name, Email, Title, Company, Location are auto-detected</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
              </label>
            </div>
          ) : step === 'map' ? (
            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-sm text-foreground">
                <FileText className="h-4 w-4 text-palette-neutral-400" aria-hidden="true" />
                {fileName} · {rows.length} rows
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Map each CSV column to an ATS field.</p>
              <div className="mt-3 space-y-2.5">
                {ATS_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center justify-between gap-3">
                    <label className="text-sm text-foreground">
                      {field.label}
                      {field.required && <span className="text-destructive"> *</span>}
                    </label>
                    <select
                      value={mapping[field.key] ?? ''}
                      onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value || undefined }))}
                      className="w-48 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
                    >
                      <option value="">— none —</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setStep('upload')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                  Back
                </button>
                <button
                  type="button"
                  disabled={!mapping.name}
                  onClick={() => setStep('review')}
                  className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-400">Validation</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-palette-success-150 p-3">
                  <p className="text-lg font-semibold text-palette-success-700">{importable.length}</p>
                  <p className="text-xs text-palette-success-700">Ready to import</p>
                </div>
                <div className="rounded-lg bg-palette-warning-150 p-3">
                  <p className="text-lg font-semibold text-palette-warning-700">{missingEmail.length}</p>
                  <p className="text-xs text-palette-warning-700">Missing email</p>
                </div>
                <div className="rounded-lg bg-palette-neutral-150 p-3">
                  <p className="text-lg font-semibold text-palette-neutral-600">{duplicates.length}</p>
                  <p className="text-xs text-palette-neutral-600">Duplicates skipped</p>
                </div>
              </div>
              {rows.length > validRows.length && (
                <p className="mt-2 text-xs text-muted-foreground">{rows.length - validRows.length} row(s) had no name and will be skipped.</p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setStep('map')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                  Back
                </button>
                <button
                  type="button"
                  disabled={importable.length === 0}
                  onClick={handleImport}
                  className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Import {importable.length} candidates
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
