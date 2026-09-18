import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/widgets/Panel'
import { motion } from 'framer-motion'
import { AlertTriangle, Check, EyeOff, RotateCcw, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { blockService } from '@/services/blockService'
import { conflictTypeLabel, severityColor } from '@/lib/meta'
import { StatusBadge } from '@/components/widgets/StatusBadge'
import { toast } from '@/components/ui/toast'
import type { BlockConflict } from '@/types'
import { fmtMin, fmtMinRange } from '@/lib/format'

const TYPE_ICON = {
  TRAIN_VS_MAINTENANCE: 'TRAIN vs MAINT',
  MAINTENANCE_VS_MAINTENANCE: 'MAINT vs MAINT',
  RESOURCE: 'RESOURCE',
  TIME_WINDOW: 'TIME WINDOW',
  SAFETY_HEADWAY: 'SAFETY HEADWAY',
  CAPACITY: 'CAPACITY',
}

export default function ConflictCenter() {
  const [conflicts, setConflicts] = useState<BlockConflict[]>([])
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')

  useEffect(() => {
    let active = true
    blockService.getConflicts().then((c) => active && setConflicts(c))
    return () => { active = false }
  }, [])

  const act = async (id: string, action: 'accept' | 'ignore' | 'acknowledge') => {
    await blockService.resolveConflict(id, action)
    setConflicts((prev) => prev.map((c) => (c.id === id ? { ...c, status: action === 'accept' ? 'RESOLVED' : action === 'ignore' ? 'IGNORED' : 'ACKNOWLEDGED' } : c)))
    toast[action === 'accept' ? 'success' : 'info'](action === 'accept' ? 'AI solution applied' : 'Conflict updated', `CF ${id} marked ${action}.`)
  }

  const list = useMemo(() => (filter === 'ALL' ? conflicts : conflicts.filter((c) => c.severity === filter)), [conflicts, filter])
  const open = conflicts.filter((c) => c.status === 'OPEN').length

  const resetAll = async () => {
    await import('@/services/blockService')
    blockService.resetPlan()
    setConflicts(await blockService.getConflicts())
    toast.info('Conflicts refreshed', 'Engine re-ran the conflict pass.')
  }

  return (
    <div className="mx-auto w-full max-w-[1300px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Conflict Center"
        title="Block Conflict Center"
        description="Every conflict between maintenance blocks, trains and resources — with AI-suggested resolutions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-line">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${filter === f ? 'bg-accent/20 text-accent-bright' : 'bg-panel-edge text-ink-faint hover:text-ink'}`}>
                  {f === 'ALL' ? `All (${open})` : f}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={resetAll}><RotateCcw className="size-3.5" />Re-run</Button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`relative overflow-hidden rounded-lg border bg-panel p-4 ${c.status === 'RESOLVED' ? 'border-signal-green/30 opacity-60' : c.status === 'IGNORED' ? 'border-line opacity-50' : c.severity === 'CRITICAL' ? 'border-danger/50 shadow-glowRed' : c.severity === 'HIGH' ? 'border-warn/40' : 'border-line'}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="chip">{c.type in conflictTypeLabel ? conflictTypeLabel[c.type] : c.type}</span>
                <StatusBadge value={c.severity} kind="severity" pulse={c.status === 'OPEN' && c.severity === 'CRITICAL'} />
              </div>
              <span className="mono-num text-[10px] text-ink-faint">{c.blockCode}</span>
            </div>
            <p className="text-xs leading-relaxed text-ink">{c.description}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] text-ink-faint">
              <div>Section <b className="mono-num text-ink-dim">{c.section}</b></div>
              <div>Time <b className="mono-num text-ink-dim">{fmtMinRange(c.startMin, c.endMin)}</b></div>
              {c.affectedTrain && <div className="col-span-2">Affected train <b className="mono-num text-ink">{c.affectedTrain}</b></div>}
              <div className="col-span-2">Depts <b className="text-ink-dim">{c.departments.join(' + ')}</b></div>
            </div>
            <div className="mt-2.5 rounded-md border border-accent/20 bg-accent/5 px-2.5 py-2">
              <p className="mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-accent-bright"><Wrench className="size-3" />AI Recommendation · conf {c.aiConfidence}%</p>
              <p className="text-[10px] leading-snug text-ink-dim">{c.recommendation}</p>
            </div>
            <div className="mt-3 flex gap-1.5">
              <Button variant="signal" size="sm" className="flex-1" disabled={c.status !== 'OPEN'} onClick={() => act(c.id, 'accept')}><Check className="size-3" />ACCEPT AI SOLUTION</Button>
              <Button variant="outline" size="sm" onClick={() => act(c.id, 'acknowledge')}><AlertTriangle className="size-3" />MANUAL RESCHEDULE</Button>
              <Button variant="ghost" size="icon" aria-label="Ignore" onClick={() => act(c.id, 'ignore')}><EyeOff className="size-3.5" /></Button>
            </div>
          </motion.div>
        ))}
        {!list.length && <div className="col-span-full rounded-lg border border-signal-green/30 bg-signal-green/5 p-10 text-center text-xs text-signal-green">No conflicts match this filter. Corridor is clear.</div>}
      </div>
    </div>
  )
}
