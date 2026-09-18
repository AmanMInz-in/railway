import { useRef, useState } from 'react'
import type { MaintenanceBlock, Train } from '@/types'
import { MAIN_STATIONS_IN_ORDER } from '@/data/network'
import { segMinPublic } from '@/services/trainService'
import { deptColor } from '@/lib/meta'
import { fmtMin } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ZoomIn, ZoomOut, Hand, MousePointer2, Locate } from 'lucide-react'

const W = 1080
const H = 620
const LEFT_LABEL_W = 96

export interface GraphSelection {
  kind: 'train' | 'block'
  id: string
}

export interface GraphTooltip {
  title: string
  rows: Array<[string, string]>
  x: number
  y: number
}

interface MasterControlGraphProps {
  trains: Train[]
  blocks: MaintenanceBlock[]
  onSelect: (sel: GraphSelection) => void
  onHover?: (info: GraphTooltip | null) => void
  selectedId?: string | null
}

const stationIndexOf = new Map(MAIN_STATIONS_IN_ORDER.map((s, i) => [s.code, i]))

function stationIndex(code: string): number {
  return stationIndexOf.get(code) ?? 2
}

function sectionIndices(section: string): [number, number] {
  const [a, b] = section.split('-')
  const ia = stationIndex(a)
  const ib = stationIndex(b)
  return [Math.min(ia, ib), Math.max(ia, ib)]
}

function trainPolyline(t: Train): Array<[number, number]> {
  let acc = t.departTime
  const pts: Array<[number, number]> = [[stationIndex(t.origin), acc]]
  for (let i = 0; i < t.route.length - 1; i++) {
    acc += segMinPublic(t.route[i], t.route[i + 1])
    pts.push([stationIndex(t.route[i + 1]), acc])
  }
  return pts
}

function trainColor(t: Train): string {
  if (t.critical) return '#f0506e'
  if (t.priority === 'HIGH') return '#f2b53d'
  if (t.category === 'GOODS') return '#8fa3bf'
  if (t.category === 'MAIL_EXPRESS') return '#5aa2f5'
  return '#29C5E0'
}
export function MasterControlGraph({
  trains,
  blocks,
  onSelect,
  onHover,
  selectedId,
}: MasterControlGraphProps) {
  const [range, setRange] = useState<[number, number]>([0, 1440])
  const [mode, setMode] = useState<'pan' | 'select'>('select')
  const dragRef = useRef<{ x: number; startRange: [number, number] } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const x = (min: number) => {
    const span = range[1] - range[0]
    return LEFT_LABEL_W + ((min - range[0]) / span) * (W - LEFT_LABEL_W)
  }
  const y = (stationIdx: number) => 42 + (stationIdx / (MAIN_STATIONS_IN_ORDER.length - 1)) * (H - 70)
  const plotX = x

  const zoomBy = (factor: number) => {
    const newSpan = Math.min(1440, Math.max(120, (range[1] - range[0]) * factor))
    const center = (range[0] + range[1]) / 2
    let t0 = center - newSpan / 2
    if (t0 < 0) t0 = 0
    const t1 = Math.min(1440, t0 + newSpan)
    setRange([t0, t1])
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (mode !== 'pan') return
    dragRef.current = { x: e.clientX, startRange: [range[0], range[1]] }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const span = d.startRange[1] - d.startRange[0]
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const dxMin = ((d.x - e.clientX) / rect.width) * span
    setRange([
      Math.max(0, Math.min(1440 - span, d.startRange[0] + dxMin)),
      Math.min(1440, d.startRange[1] + dxMin),
    ])
  }
  const onPointerUp = () => (dragRef.current = null)

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-panel-soft">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={cn('block h-auto w-full', mode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="img"
        aria-label="Master control graph — trains and maintenance blocks over time"
      >
        <defs>
          <pattern id="mgGrid" width="60" height="620" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="620" stroke="rgba(74,96,138,0.08)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="#080d18" />
        <rect x={LEFT_LABEL_W} y={0} width={W - LEFT_LABEL_W} height={H} fill="url(#mgGrid)" />
{/* station rows + y labels */}
        {MAIN_STATIONS_IN_ORDER.map((s, i) => {
          const yy = y(i)
          return (
            <g key={s.code}>
              <line x1={LEFT_LABEL_W} y1={yy} x2={W} y2={yy} stroke="#121f38" strokeWidth={1} />
              <text x={LEFT_LABEL_W - 12} y={yy + 3.5} textAnchor="end" fontSize={10} fontFamily="JetBrains Mono, monospace"
                fill={s.type === 'MAJOR' ? '#a9bad4' : '#5f7394'} fontWeight={s.type === 'MAJOR' ? 600 : 400}>
                {s.code}
              </text>
              {i % 5 === 0 && (
                <text x={LEFT_LABEL_W + 4} y={yy - 4} fontSize={7} fill="#33435f" fontFamily="JetBrains Mono, monospace">
                  {(s.km / 1000).toFixed(0)}K
                </text>
              )}
            </g>
          )
        })}

        {/* time ticks */}
        {(() => {
          const ticks: Array<[number, boolean]> = []
          for (let t = 0; t <= 1440; t += 60) ticks.push([t, t % 240 === 0])
          return ticks.map(([t, strong]) => {
            const tx = plotX(t)
            if (tx < LEFT_LABEL_W - 6 || tx > W + 6) return null
            return (
              <g key={t}>
                <line x1={tx} y1={34} x2={tx} y2={H} stroke={strong ? 'rgba(74,96,138,0.18)' : 'rgba(74,96,138,0.08)'} strokeWidth="1" />
                <text x={tx} y={26} textAnchor="middle" fontSize={9} fill="#6c7e9e" fontFamily="JetBrains Mono, monospace">
                  {fmtMin(t)}
                </text>
              </g>
            )
          })
        })()}

        {/* maintenance blocks — horizontal bars */}
        {blocks.map((b) => {
          const [ia, ib] = sectionIndices(b.section)
          const by0 = y(ia) + 5
          const by1 = y(ib) - 5
          const bx0 = plotX(b.startMin)
          const bx1 = plotX(b.endMin)
          if (bx1 < LEFT_LABEL_W || bx0 > W) return null
          const col = deptColor[b.department]
          const isSel = selectedId === b.id
          return (
            <g key={b.id} className="cursor-pointer"
              onClick={() => onSelect({ kind: 'block', id: b.id })}
              onMouseEnter={() => onHover?.({
                title: `${b.code} · ${b.departmentLabel} BLOCK`,
                rows: [
                  ['Section', b.section],
                  ['Time', `${fmtMin(b.startMin)} – ${fmtMin(b.endMin)}`],
                  ['Duration', `${b.durationMin} min`],
                  ['Tasks', String(b.taskCount)],
                  ['Status', b.status],
                  ['Source', b.source],
                ],
                x: Math.max(0, (bx0 + bx1) / 2 - 60),
                y: Math.max(8, by0 - 94),
              })}
              onMouseLeave={() => onHover?.(null)}
            >
              <rect x={bx0} y={by0} width={Math.max(3, bx1 - bx0)} height={Math.max(4, by1 - by0)}
                fill={col} opacity={isSel ? 0.55 : 0.2} stroke={col} strokeWidth={isSel ? 2 : 1.2} rx={2}
                style={{ filter: `drop-shadow(0 0 5px ${col}55)` }} />
              <rect x={bx0} y={by0} width={Math.max(3, bx1 - bx0)} height={Math.max(4, by1 - by0)}
                fill="none" stroke={col} strokeDasharray="4 3" opacity={0.5} rx={2} />
              {(bx1 - bx0) > 56 && (
                <text x={(bx0 + bx1) / 2} y={(by0 + by1) / 2 + 3} textAnchor="middle" fontSize={7.5} fill="#dbe7f7" fontFamily="JetBrains Mono, monospace">
                  {b.code}
                </text>
              )}
            </g>
          )
        })}
{/* trains — diagonal paths */}
        {trains.map((t) => {
          const pts = trainPolyline(t)
          const path = pts.map(([si, tm], i) => `${i === 0 ? 'M' : 'L'}${plotX(tm).toFixed(1)},${y(si).toFixed(1)}`).join(' ')
          const isSel = selectedId === t.number
          const col = trainColor(t)
          return (
            <path
              key={t.id}
              d={path}
              fill="none" stroke={col} strokeWidth={isSel ? 3.2 : 2} strokeLinecap="round" opacity={isSel ? 1 : 0.85}
              strokeDasharray={t.category === 'GOODS' ? '6 4' : undefined}
              style={{ filter: isSel ? `drop-shadow(0 0 6px ${col})` : undefined }}
              className="cursor-pointer"
              onClick={() => onSelect({ kind: 'train', id: t.number })}
              onMouseEnter={() => onHover?.({
                title: `${t.number} · ${t.name}`,
                rows: [
                  ['Type', `${t.type} · ${t.category}`],
                  ['Route', `${t.origin} → ${t.dest}`],
                  ['Dep / Arr', `${fmtMin(t.departTime)} / ${fmtMin(t.arrivalTime)}`],
                  ['Delay', t.delayMinutes > 0 ? `+${t.delayMinutes} min` : 'On time'],
                  ['Priority', t.priority],
                ],
                x: Math.max(0, plotX((t.departTime + t.arrivalTime) / 2) - 60),
                y: Math.max(8, y(stationIndex(t.origin)) + (y(stationIndex(t.dest)) - y(stationIndex(t.origin))) / 2 - 84),
              })}
              onMouseLeave={() => onHover?.(null)}
            />
          )
        })}

        {/* now line */}
        <line x1={plotX(645)} y1={34} x2={plotX(645)} y2={H} stroke="#f0506e" strokeWidth={1.4} strokeDasharray="6 4" opacity={0.7} />
        <text x={plotX(645) + 4} y={22} fontSize={9} fill="#f0506e" fontFamily="JetBrains Mono, monospace">NOW</text>
      </svg>

      {/* toolbar */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md border border-line bg-panel/90 p-1 backdrop-blur">
        <button onClick={() => setMode('select')}
          className={cn('flex size-7 items-center justify-center rounded', mode === 'select' ? 'bg-accent/20 text-accent-bright' : 'text-ink-faint hover:text-ink')}
          aria-label="Select mode" title="Select">
          <MousePointer2 className="size-3.5" />
        </button>
        <button onClick={() => setMode('pan')}
          className={cn('flex size-7 items-center justify-center rounded', mode === 'pan' ? 'bg-accent/20 text-accent-bright' : 'text-ink-faint hover:text-ink')}
          aria-label="Pan mode" title="Pan (drag to scroll time)">
          <Hand className="size-3.5" />
        </button>
        <span className="mx-0.5 h-4 w-px bg-line" />
        <button onClick={() => zoomBy(1.4)} className="flex size-7 items-center justify-center rounded text-ink-faint hover:bg-panel-hover hover:text-ink" aria-label="Zoom in time"><ZoomIn className="size-3.5" /></button>
        <button onClick={() => zoomBy(0.72)} className="flex size-7 items-center justify-center rounded text-ink-faint hover:bg-panel-hover hover:text-ink" aria-label="Zoom out time"><ZoomOut className="size-3.5" /></button>
        <button onClick={() => setRange([0, 1440])} className="flex size-7 items-center justify-center rounded text-ink-faint hover:text-ink" aria-label="Reset to full day" title="Reset"><Locate className="size-3.5" /></button>
      </div>

      <div className="absolute bottom-2 left-3 z-10 rounded border border-line bg-panel/80 px-2 py-1 font-mono text-[9px] text-ink-faint backdrop-blur">
        {fmtMin(range[0])} – {fmtMin(range[1])} IST
      </div>
    </div>
  )
}