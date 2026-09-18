import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent-bright disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-white shadow-[0_0_16px_-6px_rgba(59,130,246,0.6)] hover:bg-accent-deep',
        signal: 'bg-signal-green/15 text-signal-green border border-signal-green/40 hover:bg-signal-green/25',
        outline: 'border border-line bg-panel-edge text-ink hover:bg-panel-hover',
        secondary: 'bg-panel-raised text-ink hover:bg-panel-hover border border-line',
        ghost: 'hover:bg-panel-hover text-ink-dim hover:text-ink',
        destructive: 'bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25',
        link: 'text-accent-bright underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 px-3.5',
        sm: 'h-7 px-2.5 text-[11px]',
        lg: 'h-10 px-5 text-sm',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }