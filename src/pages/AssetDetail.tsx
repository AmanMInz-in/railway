import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { PageHeader, Panel } from '@/components/widgets/Panel'
import { Boxes, ChevronRight } from 'lucide-react'
import { maintenanceService } from '@/services/maintenanceService'
import { CriticalityGauge } from '@/components/widgets/CriticalityGauge'
import { StatusBadge } from '@/components/widgets/StatusBadge'
import type { DepartmentId, RailwayAsset } from '@/types'
import { fmtDate } from '@/lib/format'
import { deptColor } from '@/lib/meta'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const COND_TONE: Record<string, string> = {
  GOOD: 'border-signal-green/40 bg-signal-green/10 text-signal-green',
  WARNING: 'border-warn/40 bg-warn/10 text-warn',
  SERIOUS: 'border-warn/50 bg-warn/15 text-warn',
  CRITICAL: 'border-danger/40 bg-danger/10 text-danger',
}

export default function AssetDetail() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [assets, setAssets] = useState<RailwayAsset[]>([])
  const [dept, setDept] = useState<DepartmentId | 'ALL'>('ALL')
  const [activeId, setActiveId] = useState<string | null>(params.get('asset'))

  useEffect(() => {
    let active = true
    const load = async () => {
      const list = await maintenanceService.getAssets()
      if (!active) return
      setAssets(list)
      const fromParam = params.get('asset')
      if (fromParam) {
        const found = list.find((a) => a.code === fromParam)
        if (found) setActiveId(found.id)
      } else if (!activeId) {
        setActiveId(list[0]?.id)
      }
    }
    load()
    return () => { active = false }
  }, [paramTrigger()])

  const visible = dept === 'ALL' ? assets : assets.filter((a) => a.department === dept)
  const active = assets.find((a) => a.id === activeId)

  function paramTrigger() {
    return params.get('asset') ?? ''
  }

  return (
    <div className="mx-auto w-full max-w-[1300px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Asset Registry"
        title="Asset Details"
        description="Click any asset in the registry or the network map to open condition, history and AI risk."
        actions={
          <Select value={dept} onValueChange={(v) => setDept(v as DepartmentId | 'ALL')}>
            <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All departments</SelectItem>
              <SelectItem value="TMS">TMS — Track</SelectItem>
              <SelectItem value="SMMS">SMMS — Signal</SelectItem>
              <SelectItem value="TDMS">TDMS — Traction</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="space-y-1.5">
          <Panel title="Asset Registry" subtitle={`${visible.length} assets on division`} icon={<Boxes className="size-4" />}>
            <div className="max-h-[720px]">
              {visible.map((a, i) => (
                <button key={a.id} onClick={() => setActiveId(a.id)}
                  className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${activeId === a.id ? 'border-accent/50 bg-accent/10' : 'border-line/60 bg-panel-edge/30 hover:bg-panel-hover'}`}>
                  <span className="flex size-2 justify-center rounded-sm" style={{ background: deptColor[a.department] }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[11px] font-bold text-ink">{a.code}</span>
                    <span className="block truncate text-[9px] text-ink-faint">{a.section} · KM {a.km.toFixed(1)} · {a.type}</span>
                  </span>
                  <StatusBadge value={a.condition} kind="plain" className={COND_TONE[a.condition]} />
                  <span className="mono-num text-[12px] font-bold" style={{ color: a.predictedFailureRisk > 60 ? '#f0506e' : '#f2b53d' }}>{a.predictedFailureRisk}%</span>
                  <ChevronRight className="size-3.5 text-ink-faint" />
                </button>
              ))}
            </div>
          </Panel>
        </div>
<div className="lg:sticky lg:top-0 lg:self-start space-y-4">
          {active ? (
            <div className="rounded-lg border border-line bg-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold text-ink">{active.code}</p>
                  <p className="text-[10px] text-ink-faint">{active.type} · {active.department} · {active.section}</p>
                </div>
                <StatusBadge value={active.condition} kind="plain" className={COND_TONE[active.condition]} />
              </div>
              <div className="mt-4 flex justify-center">
                <CriticalityGauge score={active.criticality} label="CRITICALITY" sub="" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-ink-faint">
                <Detail k="KM" v={active.km.toFixed(1)} />
                <Detail k="Age" v={`${active.ageYears} yrs`} />
                <Detail k="Last maintenance" v={fmtDate(active.lastMaintenance)} />
                <Detail k="Next due" v={fmtDate(active.nextDue)} />
                <Detail k="Failure risk" v={`${active.predictedFailureRisk}%`} />
                <Detail k="TGI" v={active.tgi !== undefined ? String(active.tgi) : '—'} />
              </div>
              <div className="mt-3 rounded-md border border-accent/20 bg-accent/5 px-3 py-2.5">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-accent-bright">AI Recommendation</p>
                <p className="text-[11px] leading-relaxed text-ink-dim">
                  {active.predictedFailureRisk >= 60
                    ? 'Schedule maintenance within 7 days. Watch speed restriction on this asset section.'
                    : active.predictedFailureRisk >= 30
                      ? 'Plan work in the next compatible maintenance window.'
                      : 'Continue routine monitoring; asset within healthy envelope.'}
                </p>
              </div>
              <div className="mt-4">
                <p className="ctrl-title mb-2">Historical condition index</p>
                <svg viewBox="0 0 360 120" className="w-full">
                  {active.history.map((h, i) => {
                    const x = 12 + (i / (active.history.length - 1)) * 336
                    const y = 104 - (h.value / 100) * 84
                    return <circle key={h.date} cx={x} cy={y} r={3.4} fill={active.predictedFailureRisk > 60 ? '#f0506e' : '#60a5fa'} />
                  })}
                  <polyline fill="none" stroke={active.predictedFailureRisk > 60 ? '#f0506e' : '#60a5fa'} strokeWidth={1.8}
                    points={active.history.map((h, i) => `${12 + (i / (active.history.length - 1)) * 336},${104 - (h.value / 100) * 84}`).join(' ')} />
                  {active.history.map((h, i) => (
                    <text key={h.date} x={12 + (i / (active.history.length - 1)) * 336} y={118} textAnchor="middle" fontSize={7} fill="#6c7e9e">
                      {h.date.slice(5, 10)}
                    </text>
                  ))}
                </svg>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => navigate('/block-planning')} className="rounded-md border border-line bg-panel-edge px-3 py-2 text-[10px] font-semibold text-ink-dim transition-colors hover:text-ink">
                  OPEN IN PLANNER
                </button>
                <button onClick={() => navigate('/maintenance-intelligence')} className="rounded-md bg-accent px-3 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-accent-deep">
                  OPEN MAINTENANCE
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-panel p-10 text-center text-xs text-ink-faint">Select an asset to inspect.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({ k, v }: { k: string; v: string }) {
  return <div className="rounded-md border border-line bg-panel-edge/40 px-2.5 py-2"><p className="text-[8px] uppercase tracking-wider">{k}</p><p className="mono-num text-[12px] font-bold text-ink">{v}</p></div>
}