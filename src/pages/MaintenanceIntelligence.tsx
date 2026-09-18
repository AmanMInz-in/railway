import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/widgets/Panel'
import { Filter, Search } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/widgets/DataTable'
import { CriticalityGauge } from '@/components/widgets/CriticalityGauge'
import { StatusBadge } from '@/components/widgets/StatusBadge'
import { maintenanceService } from '@/services/maintenanceService'
import { severityColor, taskStatusLabel } from '@/lib/meta'
import type { DepartmentId, MaintenanceTask, Severity } from '@/types'
import { fmtDate } from '@/lib/format'

const PRIO_TONE = { CRITICAL: 'border-danger/40 bg-danger/10 text-danger', HIGH: 'border-warn/40 bg-warn/10 text-warn', MEDIUM: 'border-accent/40 bg-accent/10 text-accent-bright', LOW: 'border-line bg-panel-edge text-ink-faint' } as Record<string, string>

export default function MaintenanceIntelligence() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [dept, setDept] = useState<DepartmentId>('TMS')
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [query, setQuery] = useState('')
  const [prioFilter, setPrioFilter] = useState<Severity | 'ALL'>('ALL')
  const [focusedId, setFocusedId] = useState<string | null>(params.get('task'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    const load = async () => {
      const list = await maintenanceService.getTasks({ dept, query: query || undefined })
      if (!active) return
      setTasks(prioFilter === 'ALL' ? list : list.filter((t) => t.priority === prioFilter))
      setLoading(false)
      const fromParam = params.get('task')
      if (fromParam) setFocusedId(fromParam)
    }
    load()
    return () => { active = false }
  }, [dept, query, prioFilter, params])

  const baseColumns: Column<MaintenanceTask>[] = [
    { key: 'code', header: 'TASK', width: '76px', render: (t) => <span className="mono-num font-bold text-ink">{t.code}</span> },
    { key: 'section', header: 'SECTION', render: (t) => <span className="mono-num text-ink-dim">{t.section}</span> },
    { key: 'km', header: 'KM', render: (t) => <span className="mono-num text-ink-faint">{t.km.toFixed(1)}</span> },
    { key: 'description', header: 'DEFECT', className: 'min-w-[190px]', render: (t) => <span className="truncate text-ink-dim" title={t.description}>{t.description}</span> },
    { key: 'dueDate', header: 'DUE', render: (t) => <span className={`mono-num ${t.dueDate < '2026-09-14' ? 'text-danger' : 'text-ink-faint'}`}>{fmtDate(t.dueDate)}</span> },
  ]

  const deptCols: Record<DepartmentId, Column<MaintenanceTask>> = {
    TMS: {
      key: 'tgi', header: 'TGI / RAIL', render: (t) => (
        <span className="text-ink-dim">TGI {Math.round((t.criticality.score / 100) * 44 + 28)}{t.flags.find((f) => f.includes('RAIL')) ? ' · RAIL-FLAG' : ''}</span>
      ),
    },
    SMMS: {
      key: 'relay', header: 'RELAY / POINT', render: (t) => (
        <span className="text-ink-dim">{41 + Math.round(t.criticality.score * 0.5)}k cycles · {t.criticality.safetyImpact === 'CRITICAL' ? 'weak' : 'ok'}</span>
      ),
    },
    TDMS: {
      key: 'ohe', header: 'OHE / SUB', render: (t) => (
        <span className="text-ink-dim">{t.flags.find((f) => f.includes('STAGGER')) ?? 'wear-ok'} · {t.assetType === 'SUBSTATION' ? 'TSS' : 'OHE'}</span>
      ),
    },
  }

  const focused = tasks.find((t) => t.id === focusedId)

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Maintenance Intelligence"
        title="Maintenance Intelligence"
        description="Work orders fused from TMS, SMMS and TDMS with the AI criticality index computed per task."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 w-48 pl-7" placeholder="Search tasks…" />
            </div>
            <Select value={prioFilter} onValueChange={(v) => setPrioFilter(v as Severity | 'ALL')}>
              <SelectTrigger className="h-8 w-[130px]"><Filter className="size-3" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All priorities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
<div className="grid gap-4 lg:grid-cols-[1fr_390px]">
        <Tabs value={dept} onValueChange={(v) => setDept(v as DepartmentId)}>
          <TabsList>
            <TabsTrigger value="TMS">TMS — TRACK</TabsTrigger>
            <TabsTrigger value="SMMS">SMMS — SIGNAL &amp; TELECOM</TabsTrigger>
            <TabsTrigger value="TDMS">TDMS — TRACTION / OHE</TabsTrigger>
          </TabsList>
          <TabsContent value="TMS">
            <TablePane key={dept} columns={[...baseColumns, deptCols.TMS, prioCol, critCol]} rows={tasks} loading={loading} onRow={(t) => setFocusedId(t.id)} />
          </TabsContent>
          <TabsContent value="SMMS">
            <TablePane key={dept} columns={[...baseColumns, deptCols.SMMS, prioCol, critCol]} rows={tasks} loading={loading} onRow={(t) => setFocusedId(t.id)} />
          </TabsContent>
          <TabsContent value="TDMS">
            <TablePane key={dept} columns={[...baseColumns, deptCols.TDMS, prioCol, critCol]} rows={tasks} loading={loading} onRow={(t) => setFocusedId(t.id)} />
          </TabsContent>
        </Tabs>

        <div className="lg:sticky lg:top-0 space-y-4">
          {focused ? (
            <div className="rounded-lg border border-line bg-panel p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-bold text-ink">{focused.code} · {focused.assetType}</p>
                <StatusBadge value={focused.priority} kind="severity" className={PRIO_TONE[focused.priority]} />
              </div>
              <p className="mt-1 text-[10px] text-ink-faint">{focused.section} · KM {focused.km.toFixed(1)} · {focused.status}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-dim">{focused.description}</p>
              <div className="mt-4 flex flex-col items-center">
                <CriticalityGauge score={focused.criticality.score} label="CRITICALITY INDEX" sub={focused.criticality.recommendation} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <MiniStat v={`${focused.criticality.failureProbability}%`} l="Failure prob" />
                <MiniStat v={focused.criticality.operationalImpact} l="Op impact" />
                <MiniStat v={focused.criticality.safetyImpact} l="Safety" />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-md border border-line bg-panel-edge/40 px-3 py-2">
                <span className="text-[10px] text-ink-faint">Overdue score</span>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-panel-raised">
                  <div className="h-full" style={{ width: `${focused.criticality.overdueScore}%`, background: focused.criticality.overdueScore > 60 ? '#f0506e' : '#f2b53d' }} />
                </div>
                <span className="mono-num text-[11px] font-bold text-ink">{focused.criticality.overdueScore}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {focused.flags.map((f) => <span key={f} className="chip">{f}</span>)}
              </div>
              <button onClick={() => navigate('/block-planning')} className="mt-4 h-9 w-full rounded-md bg-accent text-xs font-semibold text-white transition-colors hover:bg-accent-deep">
                SCHEDULE IN BLOCK PLANNER
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-panel p-10 text-center text-xs text-ink-faint">Select a task to open the criticality engine.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function TablePane({ columns, rows, loading, onRow }: { columns: Column<MaintenanceTask>[]; rows: MaintenanceTask[]; loading: boolean; onRow: (t: MaintenanceTask) => void }) {
  return <DataTable columns={columns} rows={rows} loading={loading} onRowClick={onRow} empty="No tasks match the filters." />
}

const prioCol: Column<MaintenanceTask> = { key: 'priority', header: 'PRIORITY', render: (t) => <StatusBadge value={t.priority} kind="severity" className={PRIO_TONE[t.priority]} /> }
const critCol: Column<MaintenanceTask> = { key: 'score', header: 'CRIT', render: (t) => <span className="mono-num text-[12px] font-bold" style={{ color: severityColor(t.priority) }}>{t.criticality.score}</span> }

function MiniStat({ v, l }: { v: string; l: string }) {
  return <div className="rounded-md border border-line bg-panel-edge/40 p-2"><p className={`text-[13px] font-bold ${v === 'CRITICAL' ? 'text-danger' : v === 'HIGH' ? 'text-warn' : 'text-ink'}`}>{v}</p><p className="text-[8px] uppercase tracking-wider text-ink-faint">{l}</p></div>
}