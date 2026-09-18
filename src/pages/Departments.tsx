import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/widgets/Panel'
import { motion } from 'framer-motion'
import { Boxes, ShieldCheck, UsersRound } from 'lucide-react'
import { StatusBadge } from '@/components/widgets/StatusBadge'
import { deptColor } from '@/lib/meta'
import { reportsService } from '@/services/reportsService'

export default function Departments() {
  const [perf, setPerf] = useState<Array<{ dept: string; completed: number; target: number; crew: number; utilization: number; trend: number }>>([])

  useEffect(() => {
    reportsService.getDepartmentPerformance().then(setPerf)
  }, [])

  const details: Record<string, { chief: string; teams: number; machines: string; focus: string }> = {
    TRACK: { chief: 'Sr. DEN (W) · S. Verma', teams: 14, machines: 'TM-26 · DTS-8 · PCM-3', focus: 'Tamping, deep screening, renewal' },
    'S&T': { chief: 'Sr. DSTE · P. Nair', teams: 9, machines: 'Relay van · I/O tester', focus: 'Interlocking, point machines, cables' },
    TRACTION: { chief: 'ADEE (Tr.) · M. Shaikh', teams: 7, machines: 'OHE car · HT crane', focus: 'Contact wire, substations, insulator' },
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 p-4 lg:p-5">
      <PageHeader eyebrow="Organisation" title="Department Management" description="Maintenance departments, crews, machines and performance vs targets." />

      <div className="grid gap-4 md:grid-cols-3">
        {perf.map((p, i) => {
          const color = deptColor[p.dept === 'TRACK' ? 'TMS' : p.dept === 'S&T' ? 'SMMS' : 'TDMS']
          const d = details[p.dept]
          return (
            <motion.div key={p.dept} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-lg border border-line bg-panel p-5" style={{ borderColor: `color-mix(in srgb, ${color} 30%, #1c2a44)` }}>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md" style={{ background: `${color}1a`, color }}><ShieldCheck className="size-4" /></span>
                <div>
                  <p className="text-sm font-bold text-ink">{p.dept}</p>
                  <p className="text-[10px] text-ink-faint">{d.chief}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-md border border-line bg-panel-edge/40 p-2.5">
                <div className="text-center"><p className="mono-num text-[15px] font-bold" style={{ color: p.completed >= p.target ? 'var(--color-signal-green)' : color }}>{p.completed}</p><p className="text-[8px] uppercase tracking-wider text-ink-faint">Completed</p></div>
                <div className="text-center"><p className="mono-num text-[15px] font-bold text-ink">{p.target}</p><p className="text-[8px] uppercase tracking-wider text-ink-faint">Target</p></div>
                <div className="text-center"><p className="mono-num text-[15px] font-bold text-ink">{p.crew}</p><p className="text-[8px] uppercase tracking-wider text-ink-faint">Crew</p></div>
                <div className="text-center"><p className="mono-num text-[15px] font-bold text-info">{p.utilization}%</p><p className="text-[8px] uppercase tracking-wider text-ink-faint">Utilisation</p></div>
              </div>
              <div className="mt-3 space-y-1.5 text-[10px]">
                <CapRow k="Teams" v={String(d.teams)} />
                <CapRow k="Machines" v={d.machines} />
                <CapRow k="Focus" v={d.focus} />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-md border border-line bg-panel-edge/40 px-3 py-2">
                <span className="text-[10px] text-ink-faint">Completion vs target</span>
                <StatusBadge value={p.completed >= p.target ? 'ON TARGET' : 'BEHIND'} kind="status" className={p.completed >= p.target ? 'border-signal-green/40 bg-signal-green/10 text-signal-green' : 'border-warn/40 bg-warn/10 text-warn'} />
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] text-ink-dim"><UsersRound className="size-4 text-ink-faint" />Crew availability across departments</div>
        <div className="flex w-1/2 gap-6">
          {perf.map((p, i) => (
            <div key={p.dept} className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-panel-raised">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (p.crew / 140) * 100)}%`, background: [deptColor.TMS, deptColor.SMMS, deptColor.TDMS][i] }} />
              </div>
              <p className="mt-1 text-center text-[8px] text-ink-faint">{p.dept}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-[10px] leading-relaxed text-ink-faint">
        <Boxes className="mt-0.5 size-3.5 shrink-0 text-accent-bright" />
        <span>Next integration: crew rosters &amp; DMAA machine logs from TERES — API stubs are in <b>services/maintenanceService.ts</b>.</span>
      </div>
    </div>
  )
}

function CapRow({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between text-ink-faint"><span>{k}</span><span className="font-medium text-ink-dim">{v}</span></div>
}