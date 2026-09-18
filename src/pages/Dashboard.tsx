import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Bot, Boxes, ChevronRight, Cpu, Layers, RailSymbol, Sparkles, Wrench, Zap } from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { KpiCard } from '@/components/widgets/KpiCard'
import { Panel } from '@/components/widgets/Panel'
import { StatusBadge } from '@/components/widgets/StatusBadge'
import { RailwayMap, type MapSelection } from '@/components/network/RailwayMap'
import { ThreeDNetwork } from '@/components/three/ThreeDNetwork'
import { maintenanceService } from '@/services/maintenanceService'
import { trainService } from '@/services/trainService'
import { blockService } from '@/services/blockService'
import { optimizationService } from '@/services/optimizationService'
import type { MaintenanceBlock, MaintenanceTask, Train } from '@/types'
import { deptColor, severityColor } from '@/lib/meta'

export default function Dashboard() {
  const { settings, setAssistantOpen } = useApp()
  const [trains, setTrains] = useState<Train[]>([])
  const [blocks, setBlocks] = useState<MaintenanceBlock[]>([])
  const [critical, setCritical] = useState<MaintenanceTask[]>([])
  const [stats, setStats] = useState<{ total: number; critical: number } | null>(null)
  const [counts, setCounts] = useState({ win: 0, shadow: 0, conflicts: 0 })
  const [sel, setSel] = useState<MapSelection | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const [t, b, c, s, w, sh, cf] = await Promise.all([
        trainService.getTrains(), blockService.getBlocks(), maintenanceService.getCriticalTasks(8),
        maintenanceService.getAssetStats(), blockService.getAvailableWindows(),
        blockService.getShadowBlocks(), blockService.getConflicts(),
      ])
      if (!active) return
      setTrains(t); setBlocks(b); setCritical(c)
      setStats({ total: s.total, critical: s.critical })
      setCounts({ win: w.length, shadow: sh.length, conflicts: cf.filter((x) => x.status === 'OPEN').length })
    }
    load()
    const unsub = trainService.subscribeTrains((live) => active && setTrains(live))
    return () => { active = false; unsub() }
  }, [])

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-4 p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-bright">Operations Overview</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-ink">Maintenance Block Command Center</h2>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value="SYSTEM OPERATIONAL" kind="plain" pulse className="border-signal-green/40 bg-signal-green/10 text-signal-green" />
          <button onClick={() => setAssistantOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-signal-cyan/40 bg-signal-cyan/10 px-2.5 py-1.5 text-[11px] font-semibold text-signal-cyan transition-colors hover:bg-signal-cyan/20">
            <Sparkles className="size-3.5" /> RailAI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Maintenance Tasks" value={stats?.total ?? '—'} trend={3.2} status="1,284 in scope" statusTone="accent" spark={[28, 31, 30, 35, 38, 41, 44, 47, 52, 57]} accent="#3b82f6" icon={<Wrench className="size-4 text-ink-faint" />} />
        <KpiCard label="Critical Defects" value={stats?.critical ?? '—'} trend={8.4} status="Above threshold" statusTone="danger" spark={[18, 20, 22, 19, 25, 27]} accent="#f0506e" icon={<AlertTriangle className="size-4 text-danger" />} />
        <KpiCard label="Today’s Available Blocks" value={counts.win || '—'} trend={-2.1} status="night + gaps" statusTone="success" spark={[12, 14, 12, 15, 13, 16]} accent="#2AC76F" icon={<Wrench className="size-4 text-signal-green" />} />
        <KpiCard label="AI Optimized Blocks" value={blocks.length || '—'} trend={9.7} status="OPT-8K3A active" statusTone="violet" spark={[4, 8, 7, 11, 12, 16]} accent="#9B7BFF" icon={<Bot className="size-4 text-signal-violet" />} />
        <KpiCard label="Train Conflicts" value={counts.conflicts || '—'} trend={-6.3} status={`${counts.conflicts} open`} statusTone="warning" spark={[9, 10, 8, 9, 6, 5]} accent="#f2b53d" icon={<AlertTriangle className="size-4 text-warn" />} />
        <KpiCard label="Potential Shadow Blocks" value={counts.shadow || '—'} trend={14.2} status="safe to combine" statusTone="cyan" spark={[3, 4, 6, 7, 9, 11]} accent="#29C5E0" icon={<Layers className="size-4 text-info" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Live Railway Network" subtitle="Interactive schematic — click stations, trains & defects"
          icon={<RailSymbol className="size-4" />}
          actions={<Link to="/live-network" className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-bright hover:underline">Open control room <ChevronRight className="size-3" /></Link>}>
          <RailwayMap trains={trains} blocks={blocks} criticalTasks={critical} selected={sel} onSelect={setSel} />
        </Panel>

        <div className="space-y-4">
          <Panel title="3D Network View" subtitle={settings.show3D ? 'WebGL · subtle auto-orbit' : '2D fallback for low-end devices'} icon={<Cpu className="size-4" />}>
            <ThreeDNetwork enabled={settings.show3D} trains={trains} />
          </Panel>
          <Panel title="AI Optimization Pulse" subtitle="Engine health · last run 39 min ago" icon={<Zap className="size-4" />}>
            <AIPulse />
          </Panel>
        </div>
      </div>
<div className="grid gap-4 md:grid-cols-3">
        <Panel title="Priority Shutdowns · Next 6 hrs" icon={<AlertTriangle className="size-4" />}>
          <div className="space-y-2">
            {critical.slice(0, 4).map((c) => (
              <Link key={c.id} to="/block-planning" className="flex items-center gap-2.5 rounded-md border border-line/60 bg-panel-edge/50 px-2.5 py-2 transition-colors hover:bg-panel-hover">
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: severityColor(c.priority) }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium text-ink">{c.id} · {c.assetType}</span>
                  <span className="block truncate text-[9px] text-ink-faint">{c.section} KM {c.km.toFixed(1)}</span>
                </span>
                <span className="mono-num text-[12px] font-bold" style={{ color: severityColor(c.priority) }}>{c.criticality.score}</span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Department Works · Today" icon={<Boxes className="size-4" />}>
          <div className="space-y-3">
            {(['TMS', 'SMMS', 'TDMS'] as const).map((d) => (
              <div key={d} className="flex items-center gap-3">
                <span className="w-14 text-[10px] font-bold tracking-wider" style={{ color: deptColor[d] }}>{d}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-raised">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, blocks.filter((b) => b.department === d).length * 22 + 8)}%`, background: deptColor[d], boxShadow: `0 0 8px ${deptColor[d]}66` }} />
                </div>
                <span className="mono-num text-[11px] text-ink-dim">{blocks.filter((b) => b.department === d).length} blocks</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Quick Functions" icon={<Zap className="size-4" />}>
          <div className="grid grid-cols-2 gap-2">
            <QuickLink to="/optimizer" icon={<Bot />} label="Generate AI Plan" accent="#9B7BFF" />
            <QuickLink to="/master-control-graph" icon={<Zap />} label="Master Graph" accent="#29C5E0" />
            <QuickLink to="/conflicts" icon={<AlertTriangle />} label="Conflict Center" accent="#f2b53d" />
            <QuickLink to="/shadow-blocks" icon={<Layers />} label="Shadow Blocks" accent="#2AC76F" />
            <QuickLink to="/weekly-planning" icon={<Boxes />} label="Weekly Plan" accent="#3b82f6" />
            <QuickLink to="/reports" icon={<BarGlyph />} label="Reports" accent="#8fa3bf" />
          </div>
        </Panel>
      </div>
    </div>
  )
}

function BarGlyph() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><rect x="2" y="9" width="3" height="5" fill="currentColor" /><rect x="6.5" y="5" width="3" height="9" fill="currentColor" opacity={0.75} /><rect x="11" y="2" width="3" height="12" fill="currentColor" opacity={0.55} /></svg>
}

function QuickLink({ to, icon, label, accent }: { to: string; icon: React.ReactNode; label: string; accent: string }) {
  return (
    <Link to={to} className="group flex flex-col gap-1.5 rounded-md border border-line/60 bg-panel-edge/40 px-3 py-2.5 transition-colors hover:bg-panel-hover"
      style={{ borderColor: `color-mix(in srgb, ${accent} 25%, #1c2a44)` }}>
      <span style={{ color: accent }} className="[&>svg]:size-4">{icon}</span>
      <span className="text-[10px] font-semibold leading-tight text-ink-dim group-hover:text-ink">{label}</span>
    </Link>
  )
}
function AIPulse() {
  const phases = [
    { label: 'MONITORING NETWORK', color: '#29C5E0', pct: 12 },
    { label: 'SCANNING NEW DEFECTS', color: '#f2b53d', pct: 61 },
    { label: 'OPTIMIZING NIGHT BLOCKS', color: '#9B7BFF', pct: 44 },
    { label: 'VALIDATING SHADOW CLUSTERS', color: '#2AC76F', pct: 23 },
  ]
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % phases.length), 2400)
    return () => clearInterval(t)
  }, [phases.length])
  const p = phases[i]
  const targets = optimizationService.getTargets()
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full" style={{ background: `${p.color}22`, color: p.color }}><Cpu className="size-4" /></span>
        <div className="flex-1">
          <p className="font-mono text-[11px] font-bold tracking-tight" style={{ color: p.color }}>{p.label}</p>
          <p className="text-[9px] text-ink-faint">RailAI engine · {targets.constraints} constraints loaded</p>
        </div>
        <span className="mono-num text-[11px] font-bold text-ink">{p.pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-raised">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.pct}%`, background: p.color, boxShadow: `0 0 10px ${p.color}88` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-line pt-2.5">
        <Stat n="1,284" l="Tasks" /><Stat n="342" l="Trains" /><Stat n="87" l="Windows" />
      </div>
      <div className="flex items-center justify-between rounded border border-line bg-panel-edge/50 px-2.5 py-1.5">
        <span className="text-[9px] text-ink-faint">Block hours saved today</span>
        <span className="mono-num text-[12px] font-bold text-signal-green">127h</span>
      </div>
    </div>
  )
}

function Stat({ n, l }: { n: string; l: string }) {
  return <div className="text-center"><p className="mono-num text-[13px] font-bold text-ink">{n}</p><p className="text-[8px] uppercase tracking-wider text-ink-faint">{l}</p></div>
}