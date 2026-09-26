import type { CrossRoleAttentionItem } from '../types/copilot'

/**
 * Cross-role "what needs my attention" facts, matching the same aggregate
 * figures already shown on Home (see data/insights.ts) so Copilot and the
 * dashboard never disagree. Static because these summarize the real-but-
 * aggregate 46/31/18 candidate pools this prototype doesn't model in full.
 */
export const crossRoleAttention: CrossRoleAttentionItem[] = [
  {
    openingId: 'senior-product-designer',
    openingTitle: 'Senior Product Designer',
    headline: '3 interviews waiting for feedback.',
    action: { label: 'Review interviews', query: 'Review interviews for Senior Product Designer' },
  },
  {
    openingId: 'product-manager',
    openingTitle: 'Product Manager',
    headline: '1 finalist waiting for a decision.',
    action: { label: 'Review finalist', query: 'Review finalist for Product Manager' },
  },
  {
    openingId: 'ux-researcher',
    openingTitle: 'UX Researcher',
    headline: 'Screening is still in progress. No action required right now.',
  },
]
