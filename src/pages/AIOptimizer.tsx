import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/widgets/Panel'
import { motion } from 'framer-motion'
import { CheckCircle2, Cpu, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { StatusBadge } from '@/components/widgets/StatusBadge'
import { Button } from '@/components/ui/button'
import { optimizationService, OPT_STEPS } from '@/services/optimizationService'
import type { OptimizationResult } from '@/types'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/store/AppStore'

export default function AIOptimizer() {
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [running, setRunning] = useState(false)
  const navigate = useNavigate()
  const { pushNotification } = useApp()

  const run = async () => {
    setRunning(true)
    setResult({
      status: 'ANALYZING', progress: 0, stepText: OPT_STEPS[0].label,
      analyzed: { ...optimizationService.getTargets() },
      metrics: { blockUtilizationDelta: 0, trainDelayDelta: 0, completionDelta: 0, conflictDelta: 0, criticalTasksDelta: 0, blockHoursSaved: 0, shadowBlocksUsed: 0 },
      planCode: 'OPT-PENDING',
    })
    const res = await optimizationService.startOptimization(setResult)
    setResult(res)
    setRunning(false)
    toast.success('Optimal plan found', `${res.planCode} — predicted metrics applied.`)
    pushNotification({ type: 'SUCCESS', category: 'AI ENGINE', title: 'Optimal plan found', body: `${res.planCode} ready for review in Schedule Comparison.`, link: '/schedule-comparison' })
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Decision Engine"
        title="AI Optimization Engine"
        description="Predictive maintenance windows × MILP optimisation over the full train universe. Run the engine and review the optimal block schedule."
        actions={<StatusBadge value={running ? 'ENGINE RUNNING' : result?.status ?? 'IDLE'} kind="plain" pulse={running}
          className={running ? 'border-warn/40 bg-warn/10 text-warn' : 'border-signal-cyan/40 bg-signal-cyan/10 text-signal-cyan'} />}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-line bg-panel p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex size-10 items-center justify-center rounded-full border border-signal-cyan/40 bg-signal-cyan/10 text-signal-cyan">
                {running ? <Loader2 className="size-5 animate-spin" /> : <Cpu className="size-5" />}
                {running && <span className="absolute inset-0 animate-ping rounded-full border border-signal-cyan/40" />}
              </span>
              <div>
                <p className="text-sm font-bold text-ink">OPTIMIZATION ENGINE</p>
                <p className="font-mono text-[10px] text-ink-faint">OR-Tools MILP + ML risk fusion · v4.2</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={running} onClick={() => setResult(null)}><RotateCcw className="size-3.5" />Reset</Button>
              <Button onClick={run} disabled={running} className="gap-2">
                <Sparkles className="size-4" /> {running ? 'OPTIMIZING…' : 'RUN OPTIMIZATION'}
              </Button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ['1,284', 'maintenance tasks'],
              ['342', 'train movements'],
              ['87', 'available windows'],
              ['36', 'operational constraints'],
              ['12', 'shadow block groups'],
            ].map(([n, l]) => (
              <div key={l} className="rounded-md border border-line bg-panel-edge/50 px-3 py-2 text-center">
                <p className="mono-num text-lg font-bold text-ink">{n}</p>
                <p className="text-[9px] uppercase tracking-wider text-ink-faint">{l}</p>
              </div>
            ))}
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] font-bold tracking-wide text-accent-bright">
                {result ? result.stepText : 'STATUS: STANDBY'}
              </p>
              <span className="mono-num text-[11px] text-ink-dim">{result?.progress ?? 0}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-panel-raised">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-signal-cyan"
                animate={{ width: `${result?.progress ?? 0}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ boxShadow: '0 0 12px rgba(59,130,246,0.6)' }} />
            </div>
          </div>
<div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
            {OPT_STEPS.map((s, idx) => {
              const done = (result?.progress ?? 0) / 100 >= (idx + 1) / OPT_STEPS.length
              const activeStep = result?.stepText === s.label
              return (
                <div key={s.key} className={`flex gap-2 rounded-md border px-2.5 py-2 ${activeStep ? 'border-accent/50 bg-accent/10' : done ? 'border-signal-green/30 bg-signal-green/5' : 'border-line bg-panel-edge/30'}`}>
                  <span className={done ? 'text-signal-green' : activeStep ? 'animate-pulse text-accent-bright' : 'text-ink-muted'}>
                    {done ? <CheckCircle2 className="size-3.5" /> : <Cpu className="size-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold ${done ? 'text-signal-green' : activeStep ? 'text-accent-bright' : 'text-ink-faint'}`}>{s.label}</p>
                    <p className="truncate text-[9px] text-ink-faint">{s.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-panel p-5">
            <p className="ctrl-title mb-4">Predicted improvement</p>
            {result?.status === 'COMPLETED' ? (
              <div className="space-y-3">
                <ResultRow label="Block Utilization" value="+23%" tone="green" />
                <ResultRow label="Train Delay" value="−18%" tone="green" />
                <ResultRow label="Maintenance Completion" value="+31%" tone="green" />
                <ResultRow label="Conflicts" value="−42%" tone="green" />
                <ResultRow label="Block Hours Saved" value="127 hrs" tone="cyan" />
                <ResultRow label="Shadow Blocks Used" value="11" tone="cyan" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <Sparkles className="size-8 text-ink-faint" />
                <p className="text-[11px] text-ink-faint">Run the engine to generate the optimal plan and view predicted metrics.</p>
              </div>
            )}
          </div>

          {result?.status === 'COMPLETED' && (
            <Button className="h-10 w-full gap-2" onClick={() => navigate('/schedule-comparison')}>
              COMPARE WITH CURRENT PLAN <CheckCircle2 className="size-4" />
            </Button>
          )}
          <div className="rounded-md border border-line bg-panel-edge/40 px-3 py-2 text-[10px] leading-relaxed text-ink-faint">
            The MILP objective minimises weighted train delay and maximises block utilisation, subject to crew-hours, machine availability and safety headway constraints.
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultRow({ label, value, tone }: { label: string; value: string; tone: 'green' | 'cyan' }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-line bg-panel-edge/50 px-3 py-2">
      <span className="text-[10px] text-ink-dim">{label}</span>
      <span className={`mono-num text-[13px] font-bold ${tone === 'green' ? 'text-signal-green' : 'text-signal-cyan'}`}>{value}</span>
    </div>
  )
}