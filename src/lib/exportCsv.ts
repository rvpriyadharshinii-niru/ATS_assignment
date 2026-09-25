import type { Candidate } from '../types/domain'

const COLUMNS: { header: string; get: (candidate: Candidate) => string }[] = [
  { header: 'Name', get: (c) => c.name },
  { header: 'Current title', get: (c) => c.currentRole ?? '' },
  { header: 'Current company', get: (c) => c.currentCompany ?? '' },
  { header: 'Experience (yrs)', get: (c) => (c.experienceYears !== undefined ? String(c.experienceYears) : '') },
  { header: 'Location', get: (c) => c.location ?? '' },
  { header: 'Recommendation', get: (c) => c.recommendation ?? '' },
  { header: 'Priorities supported', get: (c) => (c.prioritiesSupported !== undefined ? `${c.prioritiesSupported}/5` : '') },
  { header: 'AI screening score', get: (c) => (c.screeningScore !== undefined ? String(c.screeningScore) : '') },
  { header: 'Stage', get: (c) => c.stage },
  { header: 'Source', get: (c) => c.source ?? '' },
  { header: 'Last activity', get: (c) => c.updatedLabel ?? '' },
]

function escapeCsvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function candidatesToCsv(candidates: Candidate[]): string {
  const lines = [COLUMNS.map((column) => column.header).join(',')]
  for (const candidate of candidates) {
    lines.push(COLUMNS.map((column) => escapeCsvCell(column.get(candidate))).join(','))
  }
  return lines.join('\n')
}

/** Triggers a real browser download of the given text — no backend involved. */
export function downloadTextFile(filename: string, content: string, mimeType = 'text/csv'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
