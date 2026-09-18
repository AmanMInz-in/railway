import { Inbox } from 'lucide-react'
import * as React from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-md border border-line bg-panel-edge text-ink-faint">
        <Inbox className="size-5" />
      </div>
      <p className="text-xs font-semibold text-ink-dim">{title}</p>
      {description && <p className="max-w-xs text-[11px] leading-relaxed text-ink-faint">{description}</p>}
      {action}
    </div>
  )
}