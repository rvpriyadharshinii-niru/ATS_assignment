import type { Candidate } from '../types/domain'
import { deriveCandidateEmail, deriveEducation, deriveExperience, deriveSkills } from './candidateStatus'

/**
 * A hand-rolled, minimal-but-valid PDF 1.4 file — no dependency added for a single download
 * button. Every string must stay within StandardEncoding (no font /Encoding is declared), so all
 * dynamic text is sanitized to plain ASCII before it's written into the content stream.
 */
function toAscii(value: string): string {
  return value
    .replace(/[–—]/g, '-')
    .replace(/·/g, '-')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^ -~]/g, '')
}

function escapePdfText(value: string): string {
  return toAscii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

interface PdfLine {
  text: string
  size: number
  gap: number
}

const PAGE_TOP = 760
const PAGE_LEFT = 56

function buildContentStream(lines: PdfLine[]): string {
  let y = PAGE_TOP
  const parts: string[] = ['BT']
  for (const line of lines) {
    parts.push(`/F1 ${line.size} Tf`)
    parts.push(`1 0 0 1 ${PAGE_LEFT} ${y} Tm`)
    parts.push(`(${escapePdfText(line.text)}) Tj`)
    y -= line.gap
  }
  parts.push('ET')
  return parts.join('\n')
}

export function generateResumePdf(candidate: Candidate): Blob {
  const email = deriveCandidateEmail(candidate)
  const skills = deriveSkills(candidate)
  const experience = deriveExperience(candidate)
  const education = deriveEducation(candidate)

  const lines: PdfLine[] = []
  lines.push({ text: candidate.name, size: 18, gap: 26 })
  const roleLine = [candidate.currentRole, candidate.currentCompany].filter(Boolean).join(' - ')
  if (roleLine) lines.push({ text: roleLine, size: 12, gap: 18 })
  const contactLine = [email, candidate.phone, candidate.location].filter(Boolean).join('  |  ')
  lines.push({ text: contactLine, size: 10, gap: 28 })

  lines.push({ text: 'EXPERIENCE', size: 11, gap: 18 })
  for (const entry of experience) {
    lines.push({ text: `${entry.company} - ${entry.role}`, size: 11, gap: 15 })
    lines.push({ text: `${entry.dateRange}  -  ${entry.duration}${entry.location ? `  -  ${entry.location}` : ''}`, size: 9, gap: 14 })
    for (const bullet of entry.bullets) {
      lines.push({ text: `- ${bullet}`, size: 10, gap: 14 })
    }
    lines.push({ text: ' ', size: 6, gap: 10 })
  }

  lines.push({ text: 'SKILLS', size: 11, gap: 18 })
  lines.push({ text: skills.join(', '), size: 10, gap: 28 })

  lines.push({ text: 'EDUCATION', size: 11, gap: 18 })
  lines.push({ text: education.degree, size: 10, gap: 14 })
  lines.push({ text: `${education.school}  -  ${education.dateRange}`, size: 10, gap: 14 })

  const content = buildContentStream(lines)

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

export function resumeFileName(candidate: Candidate): string {
  return `${candidate.name.trim().replace(/\s+/g, '_')}_Resume.pdf`
}

export function downloadResumePdf(candidate: Candidate): void {
  const blob = generateResumePdf(candidate)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = resumeFileName(candidate)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
