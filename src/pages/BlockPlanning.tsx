import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, CalendarPlus, Download, Layers, RefreshCw, RotateCcw, Search } from 'lucide-react'
import { PageHeader, Panel } from '@/components/widgets/Panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/widgets/StatusBadge'
import { DateSelector } from '@/components/widgets/DateSelector'
import { DepartmentSelector } from '@/components/widgets/DepartmentSelector'
import { MaintenanceTimeline } from '@/components/planning/MaintenanceTimeline'
import { maintenanceService } from '@/services/maintenanceService'
import { trainService } from '@/services/trainService'
import { blockService, DEPT_COLOR } from '@/services/blockService'
import { exportCsv } from '@/services/mockCommon'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/store/AppStore'
import type { BlockConflict, DepartmentId, MaintenanceBlock, MaintenanceTask, PlanGenerationOptions, Severity, Train } from '@/types'
import { fmtMin, fmtDuration, fmtDate } from '@/lib/format'
import { severityColor } from '@/lib/meta'

export default function BlockPlanning() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { division, zone, pushNotification } = useApp()
  const [date, setDate] = useState('2026-09-14')
  const [corridor, setCorridor] = useState('NDLS-UMD')
  const [horizon, setHorizon] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY')
  const [mode, setMode] = useState<'MINIMIZE_DISRUPTION' | 'MAXIMIZE_UTILIZATION' | 'BALANCED'>('MINIMIZE_DISRUPTION')
  const [blocks, setBlocks] = useState<MaintenanceBlock[]>([])
  const [trains, setTrains] = useState<Train[]>([])
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [conflicts, setConflicts] = useState<BlockConflict[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(params.get('block'))
  const [generating, setGenerating] = useState(false)
  const [taskQuery, setTaskQuery] = useState('')
  const [taskDept, setTaskDept] = useState<DepartmentId | 'ALL'>('ALL')
  const [taskPrio, setTaskPrio] = useState<Severity | 'ALL'>('ALL')

  useEffect(() => {
    let active = true
    const load = async () => {
      const [b, t, c] = await Promise.all([blockService.getBlocks(date), trainService.getTrains(), blockService.getConflicts()])
      if (!active) return
      setBlocks(b); setTrains(t); setConflicts(c)
      const fromParam = params.get('block')
      if (fromParam) setSelectedId(fromParam)
    }
    load()
    return () => { active = false }
  }, [date, params])

  const conflictMap = useMemo(() => {
    const m = new Map<string, number>()
    conflicts.forEach((c) => m.set(c.blockId, (m.get(c.blockId) ?? 0) + 1))
    return m
  }, [conflicts])

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => (taskDept === 'ALL' || t.department === taskDept) && (taskPrio === 'ALL' || t.priority === taskPrio) && (!taskQuery || (t.id + t.code + t.section + t.description).toLowerCase().includes(taskQuery.toLowerCase()))),
    [tasks, taskDept, taskPrio, taskQuery],
  )

  const generate = async () => {
    setGenerating(true)
    const opts: PlanGenerationOptions = { date, division, corridor, horizon, mode, departments: ['TMS', 'SMMS', 'TDMS'] }
    const { plan, conflicts: cf } = await blockService.generatePlan(opts)
    setBlocks(plan)
    setConflicts(cf)
    setGenerating(false)
    toast.success('AI plan generated', `${plan.length} blocks · ${cf.length} conflicts flagged for review.`)
    pushNotification({ type: 'SUCCESS', category: 'PLANNING', title: 'AI plan generated', body: `${plan.length} blocks ready in the tactical timeline.` })
  }

  const onMove = async (id: string, start: number, end: number) => {
    await blockService.moveBlock(id, start, end)
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, startMin: start, endMin: end, durationMin: end - start } : b)))
  }

  const selected = blocks.find((b) => b.id === selectedId)

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Core Workflow"
        title="AI Automatic Block Planner"
        description="Generate, re-optimize, drag and approve the tactical maintenance schedule."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { blockService.resetPlan(); setSelectedId(null); locationReload() }}><RotateCcw className="size-3.5" />RESET</Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv('block-plan.csv', ['Code', 'Dept', 'Section', 'Start', 'End', 'Duration'], blocks.map((b) => [b.code, b.departmentLabel, b.section, fmtMin(b.startMin), fmtMin(b.endMin), String(b.durationMin)]))}><Download className="size-3.5" />EXPORT</Button>
            <Button variant="signal" size="sm" onClick={generate} disabled={generating} className="gap-1.5"><Bot className="size-3.5" />{generating ? 'GENERATING…' : 'GENERATE PLAN'}</Button>
            <Button size="sm" onClick={generate} disabled={generating} className="gap-1.5"><RefreshCw className="size-3.5" />RE-OPTIMIZE</Button>
          </div>
        }
      />
<div className="grid gap-4 xl:grid-cols-[300px_1fr_330px]">
        {/* LEFT — controls + tasks */}
        <div className="space-y-4">
          <Panel title="Plan Controls" subtitle={`${zone} / ${division}`}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><p className="text-[9px] uppercase tracking-wider text-ink-faint">Date</p><DateSelector value={date} onChange={setDate} compact /></div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-wider text-ink-faint">Corridor</p>
                  <Select value={corridor} onValueChange={setCorridor}>
                    <SelectTrigger className="h-8 font-mono text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NDLS-UMD">NDLS–UMN</SelectItem>
                      <SelectItem value="NDLS-CNB">NDLS–CNB</SelectItem>
                      <SelectItem value="DWN-AII">DWN–AII</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-wider text-ink-faint">Planning horizon</p>
                <div className="grid grid-cols-3 gap-1">
                  {(['DAY', 'WEEK', 'MONTH'] as const).map((h) => (
                    <button key={h} onClick={() => setHorizon(h)}
                      className={`rounded border py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${horizon === h ? 'border-accent/50 bg-accent/15 text-accent-bright' : 'border-line bg-panel-edge text-ink-faint hover:text-ink'}`}>{h}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-wider text-ink-faint">Optimization mode</p>
                <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                  <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINIMIZE_DISRUPTION">Minimize disruption</SelectItem>
                    <SelectItem value="MAXIMIZE_UTILIZATION">Maximize utilization</SelectItem>
                    <SelectItem value="BALANCED">Balanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border border-line bg-panel-edge/40 px-2.5 py-2">
                <span className="text-[10px] text-ink-faint">Blocks in plan</span>
                <span className="mono-num text-[13px] font-bold text-ink">{blocks.length}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Maintenance Tasks" subtitle={`${filteredTasks.length} matching`}>
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
                <Input value={taskQuery} onChange={(e) => setTaskQuery(e.target.value)} className="h-8 pl-7" placeholder="Search tasks…" />
              </div>
              <div className="flex items-center gap-1.5">
                <DepartmentSelector multi value={null} onChange={() => {}} />
                <Select value={taskPrio} onValueChange={(v) => setTaskPrio(v as Severity | 'ALL')}>
                  <SelectTrigger className="h-7 w-[90px] text-[9px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-[380px] space-y-1 overflow-y-auto pr-1">
                {filteredTasks.slice(0, 30).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-md border border-line/50 bg-panel-edge/30 px-2 py-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: DEPT_COLOR[t.department] }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold text-ink">{t.code} · {t.assetType}</p>
                      <p className="truncate text-[9px] text-ink-faint">{t.section} · {fmtDuration(t.durationMinutes)} · due {fmtDate(t.dueDate)}</p>
                    </div>
                    <span className="mono-num text-[11px] font-bold" style={{ color: severityColor(t.priority) }}>{t.criticality.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* CENTER — interactive timeline */}
        <Panel title="Interactive Timeline" subtitle="Drag blocks to move · resize handles · conflicts flagged"
          icon={<CalendarPlus className="size-4" />}
          actions={<StatusBadge value={`${conflicts.filter((c) => c.status === 'OPEN').length} conflicts`} kind="plain" className={conflicts.some((c) => c.status === 'OPEN' && c.severity === 'CRITICAL') ? 'border-danger/40 bg-danger/10 text-danger' : 'border-warn/40 bg-warn/10 text-warn'} />}>
          <MaintenanceTimeline
            blocks={blocks}
            trains={trains}
            conflicts={conflictMap}
            onMoveBlock={onMove}
            onSelectBlock={setSelectedId}
            selectedBlockId={selectedId}
          />
        </Panel>
{/* RIGHT — block details */}
        <div className="space-y-4">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="rounded-lg border border-line bg-panel p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-bold" style={{ color: DEPT_COLOR[selected.department] }}>{selected.code}</p>
                <StatusBadge value={selected.status} kind="plain" className="uppercase" />
              </div>
              <p className="mt-1 text-[10px] text-ink-faint">{selected.departmentLabel} · {selected.section}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <MiniCell l="Start" v={fmtMin(selected.startMin)} />
                <MiniCell l="End" v={fmtMin(selected.endMin)} />
                <MiniCell l="Duration" v={fmtDuration(selected.durationMin)} />
              </div>
              <div className="mt-2.5 space-y-1 text-[10px]">
                {[['KM span', `${selected.fromKm.toFixed(1)} – ${selected.toKm.toFixed(1)}`], ['Tasks', `${selected.taskCount} linked`], ['Delay impact', `${selected.trainDelayImpactMin} min`], ['Utilization', `${selected.utilizationPct}%`], ['Source', `${selected.source}${selected.source === 'AI' ? ' · optimizer' : ''}`]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3"><span className="text-ink-faint">{k}</span><span className="font-medium text-ink-dim">{v}</span></div>
                ))}
              </div>
              <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-panel-raised">
                <div className="h-full" style={{ width: `${selected.utilizationPct}%`, background: DEPT_COLOR[selected.department], boxShadow: `0 0 8px ${DEPT_COLOR[selected.department]}` }} />
              </div>
              <p className="mt-2.5 rounded-md border border-line bg-panel-edge/40 px-2.5 py-2 text-[10px] leading-relaxed text-ink-faint">{selected.notes || 'Block generated by the AI planner; verify against live train feed before approval.'}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => { toast.success('Block approved', `${selected.code} flagged APPROVED for dispatch.`); pushNotification({ type: 'SUCCESS', category: 'PLANNING', title: 'Block approved', body: `${selected.code} approved by ${zone}/${division} control.` }) }}>APPROVE</Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/conflicts')}>CONFLICTS</Button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-lg border border-line bg-panel p-8 text-center">
              <Layers className="mx-auto size-8 text-ink-faint" />
              <p className="mt-3 text-[11px] text-ink-faint">Select a block in the timeline to inspect, drag or approve it.</p>
            </div>
          )}

          <Panel title="Available Windows" subtitle="Computed from live train gaps">
            <WindowList />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function locationReload() {
  window.location.reload()
}

function MiniCell({ l, v }: { l: string; v: string }) {
  return <div className="rounded-md border border-line bg-panel-edge/40 p-2"><p className="text-[8px] uppercase tracking-wider text-ink-faint">{l}</p><p className="mono-num text-[12px] font-bold text-ink">{v}</p></div>
}

function WindowList() {
  const [windows, setWindows] = useState<Array<{ id: string; section: string; startMin: number; endMin: number; durationMin: number; trainDensity: string }>>([])
  useEffect(() => {
    let active = true
    blockService.getAvailableWindows().then((w) => active && setWindows(w.slice(0, 8)))
    return () => { active = false }
  }, [])
  return (
    <div className="space-y-1.5">
      {windows.map((w) => (
        <div key={w.id} className="flex items-center gap-2 rounded-md border border-line/50 bg-panel-edge/30 px-2 py-1.5">
          <span className={`size-1.5 shrink-0 rounded-full ${w.trainDensity === 'LOW' ? 'bg-signal-green' : w.trainDensity === 'MEDIUM' ? 'bg-warn' : 'bg-danger'}`} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[9px] font-semibold text-ink">{w.section}</p>
            <p className="mono-num text-[9px] text-ink-faint">{fmtMin(w.startMin)}–{fmtMin(w.endMin)} · {w.durationMin}m</p>
          </div>
          <StatusBadge value={w.trainDensity} kind="plain" className="text-[8px]" />
        </div>
      ))}
    </div>
  )
}