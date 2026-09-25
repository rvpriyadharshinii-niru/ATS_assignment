import { PageHeader } from '../components/layout/PageHeader'
import { homeInsights } from '../data/insights'

export function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" description="Hiring updates across your openings." />
      <div className="p-8">
        <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {homeInsights.map((insight) => (
            <div key={insight.id} className="px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">{insight.openingTitle}</p>
              <p className="mt-0.5 text-sm font-semibold text-palette-neutral-900">{insight.headline}</p>
              <p className="mt-1 text-sm text-foreground">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
