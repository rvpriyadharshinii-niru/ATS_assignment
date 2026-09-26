import { Bell, Calendar, SlidersHorizontal, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { IconBadge, type IconBadgeColor } from '../components/ui/IconBadge'
import { getCandidate } from '../data/candidates'
import { staticNotifications, type NotificationCategory } from '../data/notifications'
import { cn } from '../lib/cn'
import { useAppStore } from '../store/useAppStore'

type FilterKey = 'all' | 'unread' | NotificationCategory

interface FeedItem {
  id: string
  category: NotificationCategory
  eyebrow: string
  title: string
  detail?: string
  timestamp: number
  action?: { label: string; to: string }
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'candidates', label: 'Candidates' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'hiring', label: 'Hiring' },
]

const CATEGORY_ICON: Record<NotificationCategory, typeof Bell> = {
  candidates: Users,
  interviews: Calendar,
  hiring: SlidersHorizontal,
}

const CATEGORY_COLOR: Record<NotificationCategory, IconBadgeColor> = {
  candidates: 'info',
  interviews: 'warning',
  hiring: 'brand',
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function groupLabel(timestamp: number): string {
  const today = startOfDay(Date.now())
  const day = startOfDay(timestamp)
  if (day === today) return 'Today'
  if (day === today - 24 * 60 * 60 * 1000) return 'Yesterday'
  return 'Earlier'
}

function formatTime(timestamp: number): string {
  const minutesAgo = Math.round((Date.now() - timestamp) / 60000)
  if (minutesAgo < 60) return minutesAgo <= 0 ? 'Just now' : `${minutesAgo} min ago`
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function NotificationsPage() {
  const activityLog = useAppStore((state) => state.activityLog)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  const feed: FeedItem[] = useMemo(() => {
    const fromStatic: FeedItem[] = staticNotifications.map((item) => ({
      id: item.id,
      category: item.category,
      eyebrow: item.eyebrow,
      title: item.title,
      detail: item.detail,
      timestamp: item.timestamp,
      action: item.action,
    }))
    const fromActivity: FeedItem[] = activityLog.map((event) => {
      const candidate = getCandidate(event.candidateId)
      return {
        id: event.id,
        category: 'candidates',
        eyebrow: 'Pipeline',
        title: `${candidate?.name ?? 'A candidate'} — ${event.message}`,
        timestamp: event.timestamp,
        action: candidate ? { label: 'View', to: `/candidates/${candidate.id}` } : undefined,
      }
    })
    return [...fromStatic, ...fromActivity].sort((a, b) => b.timestamp - a.timestamp)
  }, [activityLog])

  const filtered = feed.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !readIds.has(item.id)
    return item.category === filter
  })

  const groups: { label: string; items: FeedItem[] }[] = []
  for (const item of filtered) {
    const label = groupLabel(item.timestamp)
    const existing = groups.find((group) => group.label === label)
    if (existing) existing.items.push(item)
    else groups.push({ label, items: [item] })
  }

  const unreadCount = feed.filter((item) => !readIds.has(item.id)).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up.'}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => setReadIds(new Set(feed.map((item) => item.id)))}
              className="text-sm font-medium text-primary hover:text-palette-brand-600"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          {FILTERS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setFilter(entry.key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filter === entry.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-xs">
            <Bell className="mx-auto h-6 w-6 text-palette-neutral-300" aria-hidden="true" />
            <p className="mt-2 text-sm text-muted-foreground">Nothing here.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">{group.label}</p>
              <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
                {group.items.map((item) => {
                  const isRead = readIds.has(item.id)
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                        !isRead && 'bg-palette-brand-100/20',
                      )}
                      onClick={() => setReadIds((current) => new Set(current).add(item.id))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') setReadIds((current) => new Set(current).add(item.id))
                      }}
                    >
                      <IconBadge icon={CATEGORY_ICON[item.category]} color={CATEGORY_COLOR[item.category]} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-muted-foreground">{item.eyebrow}</p>
                          {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />}
                        </div>
                        <p className="mt-0.5 text-sm font-semibold text-palette-neutral-900">{item.title}</p>
                        {item.detail && <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>}
                        <div className="mt-1.5 flex items-center gap-3">
                          <p className="text-xs text-palette-neutral-500">{formatTime(item.timestamp)}</p>
                          {item.action && (
                            <Link
                              to={item.action.to}
                              className="text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:underline"
                            >
                              {item.action.label}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

