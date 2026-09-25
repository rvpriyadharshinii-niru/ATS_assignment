import { PageHeader } from '../components/layout/PageHeader'

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Account and profile information." />
      <div className="p-8">
        <div className="max-w-md rounded-xl border border-border bg-card p-6">
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
      </div>
    </div>
  )
}
