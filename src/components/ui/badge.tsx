import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-line bg-panel-edge text-ink-dim',
        accent: 'border-accent/40 bg-accent/15 text-accent-bright',
        success: 'border-signal-green/40 bg-signal-green/10 text-signal-green',
        warning: 'border-warn/40 bg-warn/10 text-warn',
        danger: 'border-danger/40 bg-danger/10 text-danger',
        violet: 'border-signal-violet/40 bg-signal-violet/10 text-signal-violet',
        cyan: 'border-signal-cyan/40 bg-signal-cyan/10 text-signal-cyan',
        outline: 'border-line text-ink-dim',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }