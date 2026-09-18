import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-4.5 w-8 shrink-0 cursor-pointer items-center rounded-full border border-line bg-panel-raised transition-colors data-[state=checked]:border-signal-green/60 data-[state=checked]:bg-signal-green/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40',
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb className="pointer-events-none block size-3.5 rounded-full bg-ink-faint shadow-lg transition-transform data-[state=checked]:translate-x-3.5 data-[state=checked]:bg-signal-green data-[state=unchecked]:translate-x-0.5" />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }