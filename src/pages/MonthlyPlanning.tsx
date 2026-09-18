import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/widgets/Panel'
import { motion } from 'framer-motion'
import { CalendarRange, Download, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { optimizationService } from '@/services/optimizationService'
import { exportCsv } from '@/services/mockCommon'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/store/AppStore'

const START_OFFSET = 2
const DAYS = 28
const WINDOWS = [
  { from: 1, to: 3, label: 'Track machine', cls: 'bg-signal-green/15 text-signal-green ring-signal-green/60' },
  { from: 6, to: 8, label: 'Major bridges', cls: 'bg-accent/15 text-accent-bright ring-accent/60' },
  { from: 11, to: 13, label: 'OHE contact-wire', cls: 'bg-signal-violet/15 text-signal-violet ring-signal-violet/60' },
  { from: 16, to: 18, label: 'SMMS interlocking', cls: 'bg-warn/15 text-warn ring-warn/60' },
  { from: 21, to: 23, label: 'Ballast cycle', cls: 'bg-signal-green/15 text-signal-green ring-signal-green/60' },
  { from: 26, to: 28, label: 'Night blocking', cls: 'bg-signal-cyan/15 text-signal-cyan ring-signal-cyan/60' },
]

export default function MonthlyPlanning() {
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const { pushNotification } = useApp()

  const cells = useMemo(() => {
    const out: Array<{ day: number; label?: string; cls: string }> = []
    for (let d = 0; d < DAYS; d++) {
      const day = d + 1
      const w = WINDOWS.find((x) => day >= x.from && day <= x.to)
      out.push({ day, label: w?.label, cls: w ? w.cls : '' })
    }
    return out
  }, [])

  const generate = async () => {
    setGenerating(true)
    const recs = await optimizationService.monthlyRecommendations()
    setRecommendations(recs)
    setGenerating(false)
    toast.success('Monthly plan generated', 'Strategic windows assigned for September.')
    pushNotification({ type: 'SUCCESS', category: 'PLANNING', title: 'Monthly plan generated', body: 'Strategic windows for SEP-2026 ready for review.' })
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Strategic Planning"
        title="Monthly Strategic Planner"
        description="Broad strategic windows, major works and timetable constraints across September 2026."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCsv('monthly-plan-sep.csv', ['Day', 'Window'], cells.map((c) => [String(c.day), c.label ?? '-']))}><Download className="size-3.5" />Export</Button>
            <Button size="sm" onClick={generate} className="gap-1.5"><Sparkles className="size-3.5" />{generating ? 'GENERATING...' : 'GENERATE MONTHLY PLAN'}</Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink"><CalendarRange className="size-4 text-accent-bright" />SEPTEMBER 2026</h3>
            <span className="text-[10px] text-ink-faint">Weeks 38-42 · FY 2026-27</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
              <div key={d} className="pb-1 text-center text-[9px] font-semibold uppercase tracking-wider text-ink-faint">{d}</div>
            ))}
            {Array.from({ length: START_OFFSET }).map((_, i) => <div key={`p${i}`} />)}
            {cells.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.008 }}
                className={`flex min-h-[64px] flex-col justify-between rounded-md border border-line/60 bg-panel-edge/40 p-1.5 ring-1 ring-inset ${c.cls}`}>
                <span className="mono-num text-[11px] font-bold">{c.day}</span>
                {c.label && <span className="text-[8px] font-semibold leading-tight">{c.label}</span>}
              </motion.div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[9px] text-ink-faint">
            {[['bg-signal-green/60', 'Engineering'], ['bg-accent/60', 'Bridge works'], ['bg-signal-violet/60', 'OHE'], ['bg-warn/60', 'S&T renewals'], ['bg-signal-cyan/60', 'Night blocking']].map(([c, l]) => (
              <span key={l} className="inline-flex items-center gap-1"><span className={`size-2 rounded-sm ${c}`} /> {l}</span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-panel p-4">
            <p className="ctrl-title mb-3">AI Recommendations</p>
            {recommendations.length ? (
              <div className="space-y-2">
                {recommendations.map((r, i) => (
                  <div key={i} className="flex gap-2 rounded-md border border-accent/20 bg-accent/5 px-2.5 py-2 text-[10px] leading-relaxed text-ink-dim">
                    <Sparkles className="mt-0.5 size-3 shrink-0 text-accent-bright" />{r}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-[10px] text-ink-faint">Generate the monthly plan to see AI strategic recommendations.</div>
            )}
          </div>
          <div className="rounded-lg border border-line bg-panel p-4">
            <p className="ctrl-title mb-3">Timetable constraints</p>
            <div className="space-y-1.5 text-[10px] text-ink-dim">
              <p>• 342 trains / day on NDLS-BPL — keep night closures ≤ 03:00.</p>
              <p>• VIP specials 29 Sep &amp; 2 Oct — day blocks suspended.</p>
              <p>• Monsoon-end inspection — 60% of windows pre-empted.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
