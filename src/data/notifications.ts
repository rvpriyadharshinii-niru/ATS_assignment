export type NotificationCategory = 'candidates' | 'interviews' | 'hiring'

export interface StaticNotification {
  id: string
  category: NotificationCategory
  eyebrow: string
  title: string
  detail: string
  timestamp: number
  action?: { label: string; to: string }
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const now = Date.now()

/** Mirrors the same facts Home's "Needs your attention" and Copilot's "What needs my attention" show — one set of truths, several presentations. */
export const staticNotifications: StaticNotification[] = [
  {
    id: 'notif-nisha-feedback',
    category: 'interviews',
    eyebrow: 'Interview',
    title: "Nisha Verma's interview is waiting for your feedback",
    detail: '5 days waiting.',
    timestamp: now - 2 * HOUR,
    action: { label: 'Review', to: '/candidates/nisha-verma' },
  },
  {
    id: 'notif-spd-screening',
    category: 'candidates',
    eyebrow: 'AI screening',
    title: '12 new Senior Product Designer candidates completed screening',
    detail: '3 surfaced for review.',
    timestamp: now - 5 * HOUR,
    action: { label: 'Review 3', to: '/openings/senior-product-designer/candidates' },
  },
  {
    id: 'notif-pm-decision',
    category: 'candidates',
    eyebrow: 'Decision',
    title: 'Product Manager finalist is waiting for your decision',
    detail: 'Aarav Sethi has completed the current evaluation stage.',
    timestamp: now - DAY - 3 * HOUR,
    action: { label: 'Review finalist', to: '/candidates/aarav-sethi' },
  },
]
