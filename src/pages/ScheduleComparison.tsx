import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/widgets/Panel'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { optimizationService } from '@/services/optimizationService'
import { blockService } from '@/services/blockService'
import type { PlanComparisonMetric } from '@/types'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/store/AppStore'

export default function ScheduleComparison() {
  const [metrics, setMetrics] = useState<PlanComparisonMetric[]>([])
  const [applied, setApplied] = useState(false)
  const { pushNotification } = useApp()

  useEffect(() => {
    optimizationService.comparePlans().then(setMetrics)
  }, [])

  const apply = async () => {
    await blockService.applyPlan(await blockService.getBlocks(), [])
    setApplied(true)
    toast.success('AI plan applied', 'Optimized schedule is now the working tactical plan.')
    pushNotification({ type: 'SUCCESS', category: 'PLANNING', title: 'AI plan applied', body: 'Optimized blocks adopted as the working tactical schedule.' })
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Plan Review"
        title="Schedule Comparison"
        description="Side-by-side metrics for the current tactical plan vs the AI-optimized schedule."
        actions={<Button onClick={apply} disabled={applied} className="gap-2"><Check className="size-4" />{applied ? 'AI PLAN ACTIVE' : 'APPLY AI PLAN'}</Button>}
      />

      {metrics.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="rounded-lg border border-line bg-panel p-5">
            <Header title="CURRENT PLAN" sub="Manual + routine · baseline" tag="Baseline" tagClass="border-line bg-panel-edge text-ink-faint" />
            <div className="space-y-3">
              {metrics.map((m) => <BarRow key={m.label + 'c'} label={m.label} value={m.current} unit={m.unit} pct={metricPct(m, 'current')} tone="dim" />)}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rounded-lg border border-accent/40 bg-panel p-5 shadow-glow">
            <Header title="AI OPTIMIZED PLAN" sub="OPT-8K3A · MILP + shadow clustering" tag="Recommended" tagClass="border-signal-green/40 bg-signal-green/10 text-signal-green" />
            <div className="space-y-3">
              {metrics.map((m) => <BarRow key={m.label + 'o'} label={m.label} value={m.optimized} unit={m.unit} pct={metricPct(m, 'optimized')} tone="bright" />)}
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-5">
        <p className="ctrl-title">Decision summary</p>
        <p className="text-xs leading-relaxed text-ink-dim">
          The optimized plan commits <span className="font-semibold text-accent-bright">46 more block-hours</span> but completes <b>15 more critical tasks</b>, cuts conflicts by <b>24</b> and raises shadow-block utilisation by <b>25 pts</b> — net projected train-delay reduction of <b>43 minutes</b>.
        </p>
        <div className="flex items-center justify-between rounded-md border border-signal-green/30 bg-signal-green/5 px-3 py-2">
          <span className="text-[10px] text-ink-dim">Net operational impact</span>
          <button onClick={apply} disabled={applied} className="inline-flex items-center gap-1 text-[11px] font-bold text-signal-green hover:underline">
            {applied ? 'APPROVED' : 'APPLY OPTIMIZED'} <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Header({ title, sub, tag, tagClass }: { title: string; sub: string; tag: string; tagClass: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-ink-dim">{title}</p>
        <p className="text-[10px] text-ink-faint">{sub}</p>
      </div>
      <span className={`rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${tagClass}`}>{tag}</span>
    </div>
  )
}

function metricPct(m: PlanComparisonMetric, side: 'current' | 'optimized') {
  const v = side === 'current' ? m.current : m.optimized
  return Math.min(100, (v / Math.max(m.current, m.optimized)) * 100)
}

function BarRow({ label, value, unit, pct, tone }: { label: string; value: number; unit: string; pct: number; tone: 'dim' | 'bright' }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px]">
        <span className="text-ink-faint">{label}</span>
        <span className={`mono-num font-bold ${tone === 'bright' ? 'text-signal-cyan' : 'text-ink-dim'}`}>{value} {unit}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-raised">
        <div className={`h-full rounded-full ${tone === 'bright' ? 'bg-signal-cyan' : 'bg-line-bright'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}