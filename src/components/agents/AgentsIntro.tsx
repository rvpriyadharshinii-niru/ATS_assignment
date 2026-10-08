import { ArrowRight, Bot, ChevronDown, ChevronUp, MousePointerClick, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { IconBadge } from '../ui/IconBadge'
import { SimulatedTag } from './agentUi'

const STEPS = [
  {
    icon: MousePointerClick,
    title: 'Traditional ATS',
    body: 'You find, review and act on every candidate yourself, screen by screen.',
    tag: 'Manual workflows',
    current: false,
  },
  {
    icon: Sparkles,
    title: 'AI Copilot',
    body: 'Responds when you ask: investigates, explains and proposes. You confirm each action.',
    tag: 'In HireFlow today',
    current: false,
    link: { to: '/copilot', label: 'Open Copilot' },
  },
  {
    icon: Bot,
    title: 'Supervised AI Agents',
    body: 'Work proactively on parts of the workflow, within the scope, data and approvals you set.',
    tag: 'This exploration',
    current: true,
  },
]

export function AgentsIntro() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-xs" aria-labelledby="agents-intro-title">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-palette-plum-600">Post-assignment exploration</p>
          <h2 id="agents-intro-title" className="mt-1 text-base font-semibold text-palette-neutral-900">
            Exploring the next step: From Copilot to AI Agents
          </h2>
          {!collapsed && (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-foreground/90">
              &ldquo;After completing the original HireFlow assignment, I started thinking about how specialised AI Agents could take the experience further — moving from
              helping hiring managers investigate and act, to proactively supporting candidate review, assessments and interview workflows, while keeping people in control of
              hiring decisions.&rdquo;
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-expanded={!collapsed}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-palette-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? 'Show' : 'Hide'}
          {collapsed ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      </div>

      {!collapsed && (
        <>
          <ol className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch" aria-label="Product progression">
            {STEPS.map((step, index) => (
              <li key={step.title} className="contents">
                <div
                  className={cn(
                    'flex flex-col rounded-lg border p-3.5',
                    step.current ? 'border-palette-brand-300 bg-palette-brand-100/50' : 'border-border bg-palette-neutral-100',
                  )}
                  aria-current={step.current ? 'step' : undefined}
                >
                  <div className="flex items-center gap-2">
                    <IconBadge icon={step.icon} color={step.current ? 'brand' : 'neutral'} size="sm" />
                    <p className="text-sm font-semibold text-palette-neutral-900">{step.title}</p>
                  </div>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        step.current ? 'bg-palette-brand-150 text-palette-brand-700' : 'bg-palette-neutral-200 text-palette-neutral-600',
                      )}
                    >
                      {step.tag}
                    </span>
                    {step.link && (
                      <Link to={step.link.to} className="text-xs font-medium text-primary hover:text-palette-brand-600">
                        {step.link.label}
                      </Link>
                    )}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <span className="hidden items-center justify-center text-palette-neutral-400 md:flex" aria-hidden="true">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <SimulatedTag />
            Agent runs here are deterministic simulations over HireFlow&rsquo;s sample data — no live AI model is called. Anything you approve changes the same candidate and
            pipeline records as the rest of HireFlow.
          </p>
        </>
      )}
    </section>
  )
}
