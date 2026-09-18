import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/widgets/Panel'
import { motion } from 'framer-motion'
import { Layers, MapPin, PlusCircle, Clock3, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { blockService } from '@/services/blockService'
import { deptColor } from '@/lib/meta'
import { StatusBadge } from '@/components/widgets/StatusBadge'
import { toast } from '@/components/ui/toast'
import type { ShadowBlock, MaintenanceBlock } from '@/types'
import { fmtMinRange } from '@/lib/format'

const DEPT_FULL: Record<string, string> = { TMS: 'TRACK ENGINEERING', SMMS: 'SIGNAL & TELECOM', TDMS: 'TRACTION / OHE' }

export default function ShadowBlocks() {
  const [shadows, setShadows] = useState<ShadowBlock[]>([])
  const [primary, setPrimary] = useState<MaintenanceBlock[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      const [s, b] = await Promise.all([blockService.getShadowBlocks(), blockService.getBlocks()])
      if (!active) return
      setShadows(s)
      setPrimary(b.filter((x) => s.some((sh) => sh.primaryBlockId === x.id)))
    }
    load()
    return () => { active = false }
  }, [])

  const add = async (id: string) => {
    await blockService.addShadowBlock(id)
    setShadows((prev) => prev.map((val) => (val.id === id ? { ...val, status: 'ADDED' as const } : val)))
    toast.success('Added to block', 'Shadow work merged into the primary block window.')
  }

  const groupBy = shadows.reduce<Record<string, ShadowBlock[]>>((acc, s) => {
    ;(acc[s.primaryBlockId] ??= []).push(s)
    return acc
  }, {})

  return (
    <div className="mx-auto w-full max-w-[1300px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Shadow Block Engine"
        title="Shadow Block Opportunities"
        description="One department already holds a block — compatible nearby work from other departments can ride the same operational window."
      />
{Object.entries(groupBy).map(([primaryId, group], gi) => {
        const p = primary.find((x) => x.id === primaryId)
        if (!p) return null
        const saved = group.reduce((a, s) => a + s.savedTimeMin, 0)
        const util = group.reduce((a, s) => a + s.utilizationGainPct, 0)
        return (
          <motion.div key={primaryId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }}
            className="rounded-lg border border-line bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel-soft/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md" style={{ background: `${deptColor[p.department]}1a`, color: deptColor[p.department] }}><Layers className="size-4" /></span>
                <div>
                  <p className="text-sm font-bold text-ink">{DEPT_FULL[p.department]} BLOCK · {p.code}</p>
                  <p className="text-[10px] text-ink-faint">{p.section} · KM {p.fromKm.toFixed(1)}–{p.toKm.toFixed(1)} · {fmtMinRange(p.startMin, p.endMin)} · {p.durationMin} min</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="inline-flex items-center gap-1 text-signal-green"><Clock3 className="size-3" />{saved} min saved</span>
                <span className="inline-flex items-center gap-1 text-accent-bright"><TrendingUp className="size-3" />+{util}% util</span>
              </div>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-3">
              {group.map((s) => {
                const added = s.status === 'ADDED'
                return (
                  <div key={s.id} className={`rounded-md border p-3 ${added ? 'border-signal-green/40 bg-signal-green/5' : 'border-line bg-panel-edge/40'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <StatusBadge value={DEPT_FULL[s.department]} kind="plain" className="uppercase" />
                      {added && <StatusBadge value="ADDED" kind="plain" className="border-signal-green/40 bg-signal-green/10 text-signal-green" />}
                    </div>
                    <p className="text-[11px] font-semibold text-ink">
                      {s.department === 'SMMS' ? 'Signal maintenance' : s.department === 'TDMS' ? 'OHE inspection' : 'Track patrolling'} · {s.department}
                    </p>
                    <div className="mt-2 space-y-1 text-[10px] text-ink-faint">
                      <p className="flex items-center gap-1"><MapPin className="size-3" /> {s.distanceKm.toFixed(1)} KM from primary</p>
                      <p>{fmtMinRange(s.startMin, s.endMin)} · {s.durationMin} min available</p>
                      <p className="text-signal-green">Time saved: {s.savedTimeMin} min · +{s.utilizationGainPct}% util</p>
                    </div>
                    {!s.safetyCleared && <p className="mt-2 rounded border border-warn/30 bg-warn/5 px-2 py-1 text-[9px] text-warn">Safety clearance pending — crew briefing required.</p>}
                    <Button variant={added ? 'outline' : 'signal'} size="sm" className="mt-2.5 w-full" disabled={added} onClick={() => add(s.id)}>
                      <PlusCircle className="size-3" />{added ? 'ADDED TO BLOCK' : 'ADD TO BLOCK'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )
      })}
      {!Object.keys(groupBy).length && <div className="rounded-lg border border-line bg-panel p-10 text-center text-xs text-ink-faint">No shadow opportunities in the current plan. Run the optimizer to surface them.</div>}
    </div>
  )
}