import type { ComponentType } from 'react'
import { cn } from '../../lib/cn'

/** The small, deliberate accent-color set the whole product draws from — never an arbitrary hex. */
export type IconBadgeColor = 'brand' | 'plum' | 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const COLOR_CLASSES: Record<IconBadgeColor, string> = {
  brand: 'bg-palette-brand-100 text-palette-brand-600',
  plum: 'bg-palette-plum-100 text-palette-plum-600',
  info: 'bg-palette-info-150 text-palette-info-600',
  success: 'bg-palette-success-150 text-palette-success-700',
  warning: 'bg-palette-warning-150 text-palette-warning-700',
  danger: 'bg-palette-danger-150 text-palette-danger-600',
  neutral: 'bg-palette-neutral-200 text-palette-neutral-700',
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-7 w-7 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
}

const ICON_SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-[18px] w-[18px]',
  lg: 'h-5 w-5',
}

/** A tinted, rounded icon container — the recurring "card header" accent used across every page. */
export function IconBadge({
  icon: Icon,
  color = 'brand',
  size = 'md',
  className,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  color?: IconBadgeColor
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center', SIZE_CLASSES[size], COLOR_CLASSES[color], className)}>
      <Icon className={ICON_SIZE_CLASSES[size]} aria-hidden />
    </span>
  )
}

const PILL_CLASSES: Record<IconBadgeColor, string> = {
  brand: 'bg-palette-brand-100 text-palette-brand-700',
  plum: 'bg-palette-plum-100 text-palette-plum-700',
  info: 'bg-palette-info-150 text-palette-info-700',
  success: 'bg-palette-success-150 text-palette-success-700',
  warning: 'bg-palette-warning-150 text-palette-warning-700',
  danger: 'bg-palette-danger-150 text-palette-danger-700',
  neutral: 'bg-palette-neutral-150 text-palette-neutral-600',
}

/** A small rounded trend/status pill — the colorful secondary-metric badge pattern. */
export function TrendPill({
  label,
  color = 'success',
  icon: Icon,
  className,
}: {
  label: string
  color?: IconBadgeColor
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  className?: string
}) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold', PILL_CLASSES[color], className)}>
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {label}
    </span>
  )
}
