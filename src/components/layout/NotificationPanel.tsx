import { Bell, CheckCheck, Radio } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/store/AppStore'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const typeVariant: Record<string, 'danger' | 'warning' | 'default' | 'success'> = {
  CRITICAL: 'danger',
  WARNING: 'warning',
  INFO: 'default',
  SUCCESS: 'success',
}

export function NotificationPanel({ open, onOpenChange, count }: { open: boolean; onOpenChange: (v: boolean) => void; count: number }) {
  const { notifications, markAllRead, markRead } = useApp()
  const navigate = useNavigate()

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative flex size-8 items-center justify-center rounded-md border border-line bg-panel-edge text-ink-faint transition-colors hover:bg-panel-hover hover:text-ink"
          aria-label={`Notifications (${count} unread)`}
        >
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white ring-2 ring-canvas">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink">Notifications</p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-[10px]" onClick={markAllRead}>
              <CheckCheck className="size-3" /> Mark all read
            </Button>
          </div>
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {notifications.slice(0, 9).map((n) => (
            <button
              key={n.id}
              onClick={() => {
                markRead(n.id)
                if (n.link) navigate(n.link)
                onOpenChange(false)
              }}
              className={cn(
                'flex w-full items-start gap-2.5 border-b border-line/50 px-3 py-2.5 text-left transition-colors hover:bg-panel-edge',
                !n.read && 'bg-accent/[0.06]',
              )}
            >
              <span className={cn('mt-1 size-1.5 shrink-0 rounded-full', !n.read ? 'bg-accent-bright' : 'bg-ink-muted')} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <Badge variant={typeVariant[n.type]} className="px-1">{n.type}</Badge>
                  <span className="text-[9px] text-ink-faint">{n.category}</span>
                </span>
                <span className="mt-1 block text-[11px] font-semibold leading-snug text-ink">{n.title}</span>
                <span className="mt-0.5 block text-[10px] leading-snug text-ink-faint line-clamp-2">{n.body}</span>
                <span className="mt-1 block text-[9px] text-ink-muted">{fmtDateTime(n.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            navigate('/notifications')
            onOpenChange(false)
          }}
          className="flex w-full items-center justify-center gap-1.5 border-t border-line py-2 text-[11px] font-medium text-accent-bright hover:bg-panel-edge"
        >
          <Radio className="size-3" /> View Notification Center
        </button>
      </PopoverContent>
    </Popover>
  )
}