import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/widgets/Panel'
import { MasterControlGraph, type GraphSelection, type GraphTooltip } from '@/components/graph/MasterControlGraph'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { trainService } from '@/services/trainService'
import { blockService } from '@/services/blockService'
import type { MaintenanceBlock, Train } from '@/types'
import { fmtMin } from '@/lib/format'

export default function MasterControlGraphPage() {
  const navigate = useNavigate()
  const [trains, setTrains] = useState<Train[]>([])
  const [blocks, setBlocks] = useState<MaintenanceBlock[]>([])
  const [deptF, setDeptF] = useState<'ALL' | 'TMS' | 'SMMS' | 'TDMS'>('ALL')
  const [trainF, setTrainF] = useState<'ALL' | 'PASSENGER' | 'GOODS'>('ALL')
  const [sel, setSel] = useState<GraphSelection | null>(null)
  const [tooltip, setTooltip] = useState<GraphTooltip | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const [t, b] = await Promise.all([trainService.getTrains(), blockService.getBlocks()])
      if (!active) return
      setTrains(t); setBlocks(b)
    }
    load()
    const unsub = trainService.subscribeTrains((live) => active && setTrains(live))
    return () => { active = false; unsub() }
  }, [])

  const visibleBlocks = deptF === 'ALL' ? blocks : blocks.filter((b) => b.department === deptF)
  const visibleTrains = trainF === 'ALL' ? trains : trains.filter((t) => t.category === trainF)

  const onSelect = (s: GraphSelection) => {
    setSel(s)
    if (s.kind === 'block') {
      const b = blocks.find((x) => x.id === s.id)
      if (b) navigate(`/block-planning?block=${b.id}`)
    } else if (s.kind === 'train') {
      navigate(`/live-network?train=${s.id}`)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Control-Office Chart"
        title="Master Control Graph"
        description="Time (X) vs stations (Y) — train paths as diagonals, maintenance blocks as horizontal bands. Click anything to open detail, pan with the hand tool."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={deptF} onValueChange={(v) => setDeptF(v as typeof deptF)}>
              <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                <SelectItem value="TMS">Track</SelectItem>
                <SelectItem value="SMMS">S&amp;T</SelectItem>
                <SelectItem value="TDMS">Traction / OHE</SelectItem>
              </SelectContent>
            </Select>
            <Select value={trainF} onValueChange={(v) => setTrainF(v as typeof trainF)}>
              <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Trains</SelectItem>
                <SelectItem value="PASSENGER">Passenger</SelectItem>
                <SelectItem value="GOODS">Goods</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setSel(null)}>Clear selection</Button>
          </div>
        }
      />

      <div className="relative">
        <MasterControlGraph
          trains={visibleTrains}
          blocks={visibleBlocks}
          onSelect={onSelect}
          onHover={setTooltip}
          selectedId={sel?.id ?? null}
        />
        {tooltip && (
          <div
            className="pointer-events-none absolute z-20 min-w-[200px] rounded-md border border-line bg-panel-raised p-2.5 shadow-panel"
            style={{ left: tooltip.x, top: tooltip.y }}
            role="tooltip"
          >
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-bright">{tooltip.title}</p>
            <div className="space-y-0.5">
              {tooltip.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 text-[10px]">
                  <span className="text-ink-faint">{k}</span>
                  <span className="font-mono font-medium text-ink-dim">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-line bg-panel px-4 py-2.5 text-[10px] text-ink-faint">
        <span className="font-semibold uppercase tracking-wider text-ink-dim">Legend</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-6 bg-signal-cyan" /> Passenger</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-6 bg-[#8fa3bf]" /> Goods</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-6 bg-warn" /> High priority</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-6 bg-danger" /> Critical</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm bg-signal-green/30 ring-1 ring-signal-green" /> Track block</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm bg-warn/30 ring-1 ring-warn" /> S&amp;T block</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm bg-signal-violet/30 ring-1 ring-signal-violet" /> TRD block</span>
        <span className="ml-auto hidden text-[9px] uppercase tracking-wider text-ink-muted lg:block">All times IST · Y-axis schematic (not to scale)</span>
      </div>
    </div>
  )
}