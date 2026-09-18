import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Tone } from '@/lib/meta'
import { severityTone, blockStatusTone } from '@/lib/meta'
import type { BlockStatus, Severity, TrainPriority } from '@/types'

const toneVariant: Record<Tone, 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'violet' | 'cyan' | 'outline'> = {
  default: 'outline',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  violet: 'violet',
  cyan: 'cyan',
}

export function StatusBadge({
  value,
  kind = 'severity',
  pulse,
  className,
}: {
  value: Severity | TrainPriority | BlockStatus | string
  kind?: 'severity' | 'priority' | 'status' | 'plain'
  pulse?: boolean
  className?: string
}) {
  const tone: Tone =
    kind === 'status' ? (blockStatusTone(value as BlockStatus)) : severityTone(value)
  return (
    <Badge variant={toneVariant[tone]} className={cn(className)}>
      {pulse && <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
        <span className="relative inline-flex size-1.5 rounded-full bg-current" />
      </span>}
      {value}
    </Badge>
  )
}

export function Dot({ tone, pulse }: { tone: Tone; pulse?: boolean }) {
  const color = {
    default: 'bg-ink-faint',
    accent: 'bg-accent',
    success: 'bg-signal-green',
    warning: 'bg-warn',
    danger: 'bg-danger',
    violet: 'bg-signal-violet',
    cyan: 'bg-signal-cyan',
  }[tone]
  return (
    <span className={cn('relative inline-flex size-2 rounded-full', color)}>
      {pulse && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-50', color)} />}
    </span>
  )
}