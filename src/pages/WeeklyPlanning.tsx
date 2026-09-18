import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/widgets/Panel'
import { motion } from 'framer-motion'
import { Check, Download, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { maintenanceService } from '@/services/maintenanceService'
import { exportCsv } from '@/services/mockCommon'
import { toast } from '@/components/ui/toast'
import type { MaintenanceTask } from '@/types'

const DAYS = [
  { short: 'MON', date: '14', density: 62, demand: 34, windows: 3, blocks: 7, best: '23:30-03:30' },
  { short: 'TUE', date: '15', density: 71, demand: 29, windows: 2, blocks: 5, best: '00:00-03:00' },
  { short: 'WED', date: '16', density: 68, demand: 30, windows: 3, blocks: 6, best: '23:30-03:30' },
  { short: 'THU', date: '17', density: 79, demand: 42, windows: 1, blocks: 4, best: '00:00-02:30' },
  { short: 'FRI', date: '18', density: 83, demand: 44, windows: 2, blocks: 5, best: '23:30-03:30' },
  { short: 'SAT', date: '19', density: 58, demand: 21, windows: 4, blocks: 9, best: '00:00-04:30' },
  { short: 'SUN', date: '20', density: 51, demand: 18, windows: 4, blocks: 8, best: '00:00-05:00' },
]

export default function WeeklyPlanning() {
  const [emergent, setEmergent] = useState<MaintenanceTask[]>([])
  const [approved, setApproved] = useState<string[]>([])
  const [freed, setFreed] = useState(false)

  useEffect(() => {
    let active = true
    maintenanceService.getTasks({ status: 'EMERGENCY' }).then((t) => active && setEmergent(t.slice(0, 4)))
    return () => { active = false }
  }, [])

  const toggle = (s: string) => setApproved((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s]))

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Tactical Planning"
        title="Weekly Tactical Planner"
        description="Monday to Sunday: review demand, approve blocks and heal emergency defects."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCsv('weekly-plan.csv', ['Day', 'Density', 'Demand', 'Windows'], DAYS.map((d) => [d.short, String(d.density), String(d.demand), String(d.windows)]))}><Download className="size-3.5" />Export</Button>
            <Button size="sm" onClick={() => { toast.success('Week rebalanced', 'AI moved 3 blocks to low-density nights.'); setFreed(true) }} className="gap-1.5"><Sparkles className="size-3.5" />REBALANCE WEEK</Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {DAYS.map((d, i) => (
            <motion.div key={d.short} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-line bg-panel p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold text-ink">{d.short} {d.date}</p>
                <span className={`rounded px-1 py-px text-[8px] font-bold ${d.density > 75 ? 'bg-danger/15 text-danger' : d.density > 65 ? 'bg-warn/15 text-warn' : 'bg-signal-green/15 text-signal-green'}`}>{d.density}%</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                {[['Train density', d.density], ['Maintenance demand', d.demand], ['Windows', d.windows], ['Blocks', d.blocks]].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between text-ink-faint"><span>{k}</span><span className="mono-num font-bold text-ink">{v}</span></div>
                ))}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-raised">
                <div className="h-full rounded-full bg-gradient-to-r from-signal-green to-signal-cyan" style={{ width: `${d.density}%` }} />
              </div>
              <div className="mt-2.5 rounded border border-line bg-panel-edge/50 px-2 py-1.5">
                <p className="text-[8px] uppercase tracking-wider text-ink-faint">Best window</p>
                <p className="mono-num text-[10px] font-bold text-signal-green">{d.best}</p>
              </div>
              <button onClick={() => toggle(d.short)}
                className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${approved.includes(d.short) ? 'border-signal-green/40 bg-signal-green/10 text-signal-green' : 'border-line bg-panel-edge text-ink-faint hover:text-ink'}`}>
                <Check className="size-3" />{approved.includes(d.short) ? 'Approved' : 'Approve'}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-panel p-4">
            <p className="ctrl-title mb-3">Emergency defects this week</p>
            <div className="space-y-2">
              {emergent.map((t) => (
                <div key={t.id} className="flex items-start gap-2 rounded-md border border-danger/25 bg-danger/5 px-2.5 py-2">
                  <span className="mt-1 size-1.5 shrink-0 animate-pulse rounded-full bg-danger" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-ink">{t.description}</p>
                    <p className="text-[9px] text-ink-faint">{t.section} KM {t.km.toFixed(1)} · crit {t.criticality.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4">
            <p className="ctrl-title mb-3">AI Recommendations</p>
            <ul className="space-y-2 text-[10px] leading-relaxed text-ink-dim">
              <li className="rounded-md border border-accent/20 bg-accent/5 px-2.5 py-2">• Move Friday track tasks into Sat 00:00-04:30 — saves 2 crew-hours.</li>
              <li className="rounded-md border border-accent/20 bg-accent/5 px-2.5 py-2">• Wednesday density 79% — shift BLK-07 to Sunday night.</li>
              <li className="rounded-md border border-accent/20 bg-accent/5 px-2.5 py-2">• Ride 4 SMMS renewals as shadow on engineering blocks.</li>
            </ul>
            {freed && (
              <div className="mt-3 rounded-md border border-signal-green/30 bg-signal-green/5 px-2.5 py-2 text-[10px] text-signal-green">
                Rebalanced — 3 blocks moved to low-density nights. +18% utilisation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
