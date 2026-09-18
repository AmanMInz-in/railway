import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, CircleDot } from 'lucide-react'
import { PageHeader, Panel } from '@/components/widgets/Panel'
import { StatusBadge } from '@/components/widgets/StatusBadge'
import { RailwayMap, type MapSelection } from '@/components/network/RailwayMap'
import { RouteDetail } from '@/components/network/RouteDetail'
import { trainService } from '@/services/trainService'
import { maintenanceService } from '@/services/maintenanceService'
import { blockService } from '@/services/blockService'
import { stationByCode } from '@/data/network'
import type { MaintenanceBlock, MaintenanceTask, Train } from '@/types'
import { fmtMin, fmtDateTime } from '@/lib/format'
import { severityColor } from '@/lib/meta'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function LiveNetwork() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [trains, setTrains] = useState<Train[]>([])
  const [blocks, setBlocks] = useState<MaintenanceBlock[]>([])
  const [critical, setCritical] = useState<MaintenanceTask[]>([])
  const [sel, setSel] = useState<MapSelection | null>(null)
  const [dialog, setDialog] = useState<{ kind: 'station' | 'train' | 'asset' | 'block'; id: string } | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const [t, b, c] = await Promise.all([trainService.getTrains(), blockService.getBlocks(), maintenanceService.getCriticalTasks(10)])
      if (!active) return
      setTrains(t); setBlocks(b); setCritical(c)
    }
    load()
    const unsub = trainService.subscribeTrains((live) => active && setTrains(live))
    return () => { active = false; unsub() }
  }, [])

  useEffect(() => {
    const st = params.get('station')
    const tr = params.get('train')
    if (st) setDialog({ kind: 'station', id: st })
    else if (tr) setDialog({ kind: 'train', id: tr })
  }, [params])

  const onSelect = (s: MapSelection) => {
    setSel(s)
    setDialog({ kind: s.kind, id: s.id })
  }

  const station = dialog?.kind === 'station' ? stationByCode.get(dialog.id) : null
  const train = dialog?.kind === 'train' ? trains.find((t) => t.number === dialog.id) : null
  const block = dialog?.kind === 'block' ? blocks.find((b) => b.id === dialog.id || b.code === dialog.id) : null
  const task = dialog?.kind === 'asset' ? critical.find((c) => c.assetCode === dialog.id) : null

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Live Control Room"
        title="Live Railway Network"
        description="Schematic control-room view — trains move in real time, blocks highlight active maintenance."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value="LIVE FEED" kind="plain" pulse className="border-signal-green/40 bg-signal-green/10 text-signal-green" />
            <StatusBadge value={`${trains.length} TRAINS`} kind="plain" className="border-signal-cyan/40 bg-signal-cyan/10 text-signal-cyan" />
            <StatusBadge value={`${trains.filter((t) => t.delayMinutes > 15).length} DELAYED`} kind="plain" className="border-warn/40 bg-warn/10 text-warn" />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel title="Schematic Network" subtitle="Drag to pan · wheel to zoom · click any element">
          <RailwayMap trains={trains} blocks={blocks} criticalTasks={critical} selected={sel} onSelect={onSelect} showLabels />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-4 py-2.5 text-[10px] text-ink-faint">
            {[['#29C5E0', 'Passenger'], ['#8fa3bf', 'Goods'], ['#f2b53d', 'High priority'], ['#f0506e', 'Critical']].map(([c, l]) => (
              <span key={l} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: c }} /> {l}</span>
            ))}
            <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded-sm bg-signal-green/40 ring-1 ring-signal-green" /> TRACK block</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded-sm bg-warn/40 ring-1 ring-warn" /> S&amp;T block</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded-sm bg-signal-violet/40 ring-1 ring-signal-violet" /> TRD block</span>
            <span className="inline-flex items-center gap-1 text-danger"><span className="size-2 animate-pulse rounded-full bg-danger" /> Defect</span>
            <span className="ml-auto hidden text-[9px] md:block">{fmtDateTime(new Date().toISOString())} IST</span>
          </div>
        </Panel>

        <Panel title="Live Train Movements" subtitle="COA feed · priority order">
<div className="space-y-1.5">
            {trains.slice().sort((a, b) => ((b.critical ? 1 : 0) - (a.critical ? 1 : 0)) || b.delayMinutes - a.delayMinutes).map((t) => (
              <button key={t.id} onClick={() => setDialog({ kind: 'train', id: t.number })}
                className="group flex w-full items-center gap-2.5 rounded-md border border-line/60 bg-panel-edge/40 px-2.5 py-2 text-left transition-colors hover:border-accent/40 hover:bg-panel-hover">
                <CircleDot className={`size-4 shrink-0 ${t.critical ? 'text-danger animate-pulse' : t.delayMinutes > 0 ? 'text-warn' : 'text-signal-green'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="mono-num text-[12px] font-bold text-ink">{t.number}</span>
                    <span className="rounded bg-panel-raised px-1 py-px text-[8px] font-semibold uppercase text-ink-faint">{t.type}</span>
                    {t.critical && <span className="text-[8px] font-bold uppercase text-danger">Critical</span>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-ink-dim">
                    <span>{t.origin}</span><ArrowRight className="size-2.5 text-ink-faint" /><span>{t.dest}</span>
                    <span className={`ml-auto mono-num ${t.delayMinutes > 0 ? 'text-warn' : 'text-signal-green'}`}>{t.delayMinutes > 0 ? `+${t.delayMinutes} min` : 'ON TIME'}</span>
                  </div>
                </div>
                <StatusBadge value={t.priority} kind="priority" className={t.priority === 'HIGH' ? 'border-warn/40 bg-warn/10 text-warn' : ''} />
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Station Directory" subtitle="Click a station to open details">
        <div className="flex flex-wrap gap-1.5">
          {[...stationByCode.values()].map((s) => (
            <button key={s.code} onClick={() => setDialog({ kind: 'station', id: s.code })}
              className="rounded border border-line bg-panel-edge px-2 py-1 font-mono text-[11px] font-semibold text-ink-dim transition-colors hover:border-accent/40 hover:text-ink">
              {s.code}
            </button>
          ))}
        </div>
      </Panel>
<Dialog open={!!dialog} onOpenChange={(v) => { if (!v) { setDialog(null); setSel(null) } }}>
        <DialogContent className="max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {station && <><span className="mono-num text-accent-bright">{station.code}</span> {station.name}</>}
              {train && <><span className="mono-num text-accent-bright">{train.number}</span> {train.name}</>}
              {block && <><span className="mono-num text-accent-bright">{block.code}</span> {block.departmentLabel} block</>}
              {task && <><span className="mono-num text-accent-bright">{task.assetCode}</span> {task.assetType}</>}
            </DialogTitle>
            <DialogDescription>
              {station && `${station.type} · ${station.platform} platforms · KM ${station.km.toFixed(1)}`}
              {train && `${train.type} · ${train.origin} → ${train.dest}`}
              {block && `${block.section} · ${fmtMin(block.startMin)}–${fmtMin(block.endMin)}`}
              {task && `${task.section} · KM ${task.km.toFixed(1)}`}
            </DialogDescription>
          </DialogHeader>

          {station && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Cell l="Platforms" v={String(station.platform)} tone="plain" />
                <Cell l="Corridor KM" v={station.km.toFixed(1)} tone="plain" />
                <Cell l="Type" v={station.type} tone={station.type === 'MAJOR' ? 'ok' : 'plain'} />
              </div>
              <div className="rounded-md border border-line bg-panel-edge/40 p-3">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-ink-faint">Trains routed via {station.code}</p>
                <div className="max-h-36 space-y-1 overflow-y-auto">
                  {trains.filter((t) => t.route.includes(station.code)).slice(0, 6).map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded border border-line/50 bg-panel-edge/30 px-2 py-1.5 text-[10px]">
                      <span className="mono-num font-bold text-ink">{t.number}</span>
                      <span className="truncate text-ink-faint">{t.origin}→{t.dest}</span>
                      <span className={`mono-num ${t.delayMinutes > 0 ? 'text-warn' : 'text-signal-green'}`}>{t.delayMinutes > 0 ? `+${t.delayMinutes}` : '0'}</span>
                    </div>
                  ))}
                  {!trains.some((t) => t.route.includes(station.code)) && <p className="text-[10px] text-ink-faint">No live trains currently routed through this station.</p>}
                </div>
              </div>
              <p className="flex items-start gap-2 rounded-md border border-line bg-panel-edge/40 px-3 py-2 text-[10px] text-ink-faint">
                <span className="mt-0.5 size-1.5 shrink-0 animate-pulse rounded-full bg-signal-green" />
                Yard state: signals green · points free · no stoppage advised for {station.code}.
              </p>
            </div>
          )}

          {train && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <Cell l="Delay" v={train.delayMinutes > 0 ? `+${train.delayMinutes}` : '0'} tone={train.delayMinutes > 0 ? 'warn' : 'ok'} />
                <Cell l="Speed" v={`${train.speedKmph}`} tone="plain" />
                <Cell l="Dep" v={fmtMin(train.departTime)} tone="plain" />
                <Cell l="Arr" v={fmtMin(train.arrivalTime)} tone="plain" />
              </div>
              <RouteDetail train={train} />
              <p className="rounded-md border border-line bg-panel-edge/40 px-3 py-2 text-[10px] text-ink-faint">
                Status: <b className="text-ink">{train.status}</b>. {train.delayMinutes > 30 ? 'Running behind — RDSO attributes delay to congestion ahead.' : 'Currently on schedule profile.'}
              </p>
            </div>
          )}

          {block && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Cell l="Start" v={fmtMin(block.startMin)} tone="plain" />
                <Cell l="End" v={fmtMin(block.endMin)} tone="plain" />
                <Cell l="Duration" v={`${block.durationMin}m`} tone="plain" />
              </div>
              <div className="space-y-1 text-[10px]">
                {[['KM span', `${block.fromKm.toFixed(1)} – ${block.toKm.toFixed(1)}`], ['Status', block.status], ['Source', block.source], ['Tasks', `${block.taskCount} linked`]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3"><span className="text-ink-faint">{k}</span><span className="font-medium text-ink-dim">{v}</span></div>
                ))}
              </div>
              <button onClick={() => navigate(`/block-planning?block=${block.id}`)} className="h-9 w-full rounded-md bg-accent text-xs font-semibold text-white transition-colors hover:bg-accent-deep">
                OPEN IN BLOCK PLANNER
              </button>
            </div>
          )}

          {task && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 rounded-md border border-line bg-panel-edge/40 p-3">
                <span className="mono-num text-3xl font-bold" style={{ color: severityColor(task.priority) }}>{task.criticality.score}</span>
                <div className="text-[10px] text-ink-dim">
                  <p>Criticality Index · failure probability {task.criticality.failureProbability}%</p>
                  <p className="text-ink-faint">{task.criticality.recommendation}</p>
                </div>
              </div>
              <button onClick={() => navigate(`/maintenance-intelligence?task=${task.id}`)} className="h-9 w-full rounded-md bg-accent text-xs font-semibold text-white transition-colors hover:bg-accent-deep">
                OPEN IN MAINTENANCE INTELLIGENCE
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Cell({ l, v, tone }: { l: string; v: string; tone: 'plain' | 'warn' | 'ok' }) {
  return <div className="rounded-md border border-line bg-panel-edge/40 p-2"><p className="text-[8px] uppercase tracking-wider text-ink-faint">{l}</p><p className={`mono-num text-[13px] font-bold ${tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-signal-green' : 'text-ink'}`}>{v}</p></div>
}