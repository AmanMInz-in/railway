import { useMemo, useState } from 'react'
import type { MaintenanceBlock, Train } from '@/types'
import { BlockSegment } from './BlockSegment'
import { deptColor } from '@/lib/meta'
import { fmtMin, fmtDuration } from '@/lib/format'

const ROW_LABEL_W = 76
const HOUR_PX = 42
const LANE_H = 40

export function MaintenanceTimeline({
  blocks,
  trains,
  conflicts,
  onMoveBlock,
  onSelectBlock,
  selectedBlockId,
}: {
  blocks: MaintenanceBlock[]
  trains: Train[]
  conflicts: Map<string, number>
  onMoveBlock: (id: string, startMin: number, endMin: number) => void
  onSelectBlock: (id: string) => void
  selectedBlockId: string | null
}) {
  const pxPerMin = HOUR_PX / 60
  const dayWidth = 24 * HOUR_PX
  const nowMin = 645

  const rows = [
    { key: 'TMS' as const, label: 'TRACK', color: deptColor.TMS },
    { key: 'SMMS' as const, label: 'S&T', color: deptColor.SMMS },
    { key: 'TDMS' as const, label: 'TRACTION', color: deptColor.TDMS },
  ]

  const byDept = useMemo(() => {
    const m = new Map<string, MaintenanceBlock[]>()
    for (const b of blocks) {
      ;(m.get(b.department) ?? m.set(b.department, []).get(b.department)!).push(b)
    }
    return m
  }, [blocks])

  const hourTicks = Array.from({ length: 25 }, (_, i) => i * 60)

  return (
    <div className="relative overflow-auto" style={{ maxHeight: '72vh' }}>
      <div className="relative" style={{ width: ROW_LABEL_W + dayWidth, minWidth: '100%' }}>
        {/* ruler */}
        <div className="sticky left-0 top-0 z-30 flex h-10 border-b border-line bg-panel">
          <div className="sticky left-0 z-20 flex w-[76px] shrink-0 items-end border-r border-line bg-panel px-2 pb-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-faint">Time</span>
          </div>
          <div className="relative h-full" style={{ width: dayWidth }}>
            {hourTicks.map((h) => (
              <div key={h} className="absolute inset-y-0 border-l border-line/70" style={{ left: (h / 60) * HOUR_PX }}>
                <span className="mono-num absolute -bottom-0.5 -translate-x-1/2 text-[9px] text-ink-faint">{fmtMin(h)}</span>
              </div>
            ))}
            <div className="absolute inset-y-0 z-10 w-px bg-danger/80" style={{ left: nowMin * pxPerMin }}>
              <span className="absolute left-1 top-1 rounded bg-danger px-1 font-mono text-[8px] font-bold text-white">NOW</span>
            </div>
          </div>
        </div>
{/* department lanes */}
        {rows.map((row) => {
          const deptBlocks = byDept.get(row.key) ?? []
          return (
            <div key={row.key} className="flex border-b border-line/50" style={{ height: LANE_H }}>
              <div className="sticky left-0 z-20 flex w-[76px] shrink-0 items-center gap-2 border-r border-line bg-panel-soft px-2" style={{ background: 'none' }}>
                <span className="size-2 rounded-sm" style={{ background: row.color }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: row.color }}>{row.label}</span>
              </div>
              <div className="relative bg-[#0a1120]" style={{ width: dayWidth }}>
                {hourTicks.map((h) => <div key={h} className="absolute inset-y-0 border-l border-white/[0.04]" style={{ left: (h / 60) * HOUR_PX }} />)}
                {deptBlocks.map((b) => (
                  <BlockSegment
                    key={b.id}
                    block={b}
                    left={b.startMin * pxPerMin}
                    widthPx={Math.max(18, b.durationMin * pxPerMin)}
                    top={4}
                    laneHeight={LANE_H}
                    minWidthPx={22}
                    onMove={onMoveBlock}
                    onSelect={onSelectBlock}
                    selected={selectedBlockId === b.id}
                    conflicts={conflicts.get(b.id) ?? 0}
                    pxPerMin={pxPerMin}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* trains lane */}
        <div className="flex border-b border-line/50" style={{ height: 64 }}>
          <div className="sticky left-0 z-20 flex w-[76px] shrink-0 items-center border-r border-line bg-panel-soft px-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-signal-cyan">Trains</span>
          </div>
          <div className="relative bg-[#0a1120]" style={{ width: dayWidth }}>
            {trains.slice(0, 20).map((t) => {
              const x0 = t.departTime * pxPerMin
              const x1 = t.arrivalTime * pxPerMin
              const col = t.critical ? '#f0506e' : t.priority === 'HIGH' ? '#f2b53d' : t.category === 'GOODS' ? '#71839f' : '#29C5E0'
              return (
                <div key={t.id} className="absolute h-[20px] rounded-sm opacity-80"
                  style={{ left: x0, width: Math.max(4, x1 - x0), top: '3px', background: `${col}30`, borderLeft: `2px solid ${col}` }}
                  title={`${t.number} ${t.name} · ${fmtMin(t.departTime)}–${fmtMin(t.arrivalTime)}`}>
                  {(x1 - x0) > 40 && <span className="truncate pl-1 font-mono text-[8px] leading-[20px] text-ink-faint">{t.number}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* legend */}
        <div className="flex flex-wrap items-center gap-3 px-3 py-2">
          <span className="text-[9px] uppercase tracking-wider text-ink-muted">Legend</span>
          {rows.map((r) => <span key={r.key} className="inline-flex items-center gap-1.5 text-[9px] text-ink-faint"><span className="h-2 w-4 rounded-sm" style={{ background: r.color }} />{r.label}</span>)}
          <span className="inline-flex items-center gap-1.5 text-[9px] text-ink-faint"><span className="h-2 w-4 rounded-sm border-l-2 border-signal-cyan bg-signal-cyan/20" />Train path</span>
          <span className="ml-auto hidden text-[9px] text-ink-muted sm:block">Drag to move · edge handles to resize · click for detail</span>
        </div>
      </div>
    </div>
  )
}