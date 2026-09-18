import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/widgets/Panel'
import { motion } from 'framer-motion'
import { CheckCheck, Radio } from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const VAR: Record<string, 'danger' | 'warning' | 'default' | 'success'> = {
  CRITICAL: 'danger', WARNING: 'warning', INFO: 'default', SUCCESS: 'success',
}

export default function Notifications() {
  const { notifications, markAllRead, markRead } = useApp()
  const [filter, setFilter] = useState('ALL')
  const navigate = useNavigate()
  const counts = {
    ALL: notifications.length,
    CRITICAL: notifications.filter((n) => n.type === 'CRITICAL').length,
    WARNING: notifications.filter((n) => n.type === 'WARNING').length,
    INFO: notifications.filter((n) => n.type === 'INFO').length,
    SUCCESS: notifications.filter((n) => n.type === 'SUCCESS').length,
  }
  const list = filter === 'ALL' ? notifications : notifications.filter((n) => n.type === filter)

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Notification Center"
        title="Notifications"
        description="Events from the maintenance intelligence, optimizer and operations feeds."
        actions={<Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="size-3.5" />Mark all read</Button>}
      />

      <div className="flex overflow-hidden rounded-md border border-line">
        {Object.entries(counts).map(([f, n]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('flex-1 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors',
              filter === f ? 'bg-accent/20 text-accent-bright' : 'bg-panel-edge text-ink-faint hover:text-ink')}>
            {f} <span className="mono-num opacity-70">({n})</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={cn('flex items-start gap-3 rounded-lg border bg-panel px-3.5 py-3',
              n.read ? 'border-line' : 'border-accent/30 bg-accent/[0.04]')}>
            <span className={cn('mt-2 size-2 shrink-0 rounded-full', n.read ? 'bg-ink-muted' : 'bg-accent-bright animate-pulse')} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Badge variant={VAR[n.type]} className="px-1.5">{n.type}</Badge>
                <span className="text-[9px] text-ink-faint">{n.category} · {fmtDateTime(n.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-ink">{n.title}</p>
              <p className="text-[10px] leading-relaxed text-ink-faint">{n.body}</p>
            </div>
            <button onClick={() => markRead(n.id)} className={`shrink-0 rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${n.read ? 'border-line text-ink-faint' : 'border-accent/40 text-accent-bright'}`}>
              {n.read ? 'READ' : 'READ'}
            </button>
            {n.link && (
              <button onClick={() => navigate(n.link!)} className="shrink-0 rounded border border-line bg-panel-edge px-2 py-1 text-[9px] text-ink-dim hover:text-ink">
                OPEN <Radio className="size-2.5 inline" />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}