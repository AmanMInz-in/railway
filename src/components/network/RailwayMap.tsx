import { useEffect, useMemo, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import type { MaintenanceBlock, MaintenanceTask, Train } from '@/types'
import { deptColor, severityColor } from '@/lib/meta'
import { pointOnLink, ALL_LINKS, linkBetween } from '@/data/links'
import { STATIONS, stationByCode, MAIN_STATIONS_IN_ORDER } from '@/data/network'

export { STATIONS, ALL_LINKS, stationByCode, MAIN_STATIONS_IN_ORDER, linkBetween }

export interface MapSelection {
  kind: 'station' | 'train' | 'asset' | 'block'
  id: string
}

interface RailwayMapProps {
  trains: Train[]
  blocks: MaintenanceBlock[]
  criticalTasks: MaintenanceTask[]
  onSelect: (sel: MapSelection, x: number, y: number) => void
  selected?: MapSelection | null
  showLabels?: boolean
}

const VB_W = 1200
const VB_H = 720

function linkD(l: (typeof ALL_LINKS)[number]) {
  return l.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
}

function blockSpanOnLink(l: (typeof ALL_LINKS)[number], fromKm: number, toKm: number) {
  const a = stationByCode.get(l.from)
  const b = stationByCode.get(l.to)
  if (!a || !b) return null
  const kmFrom = Math.min(a.km, b.km)
  const kmTo = Math.max(a.km, b.km)
  const span = kmTo - kmFrom || 1
  const t1 = Math.min(1, Math.max(0, (fromKm - kmFrom) / span))
  const t2 = Math.min(1, Math.max(0, (toKm - kmFrom) / span))
  return { p1: pointOnLink(l, t1), p2: pointOnLink(l, t2), kmFrom, kmTo }
}
export function RailwayMap({
  trains,
  blocks,
  criticalTasks,
  onSelect,
  selected,
  showLabels = true,
}: RailwayMapProps) {
  const [tf, setTf] = useState<{ k: number; x: number; y: number }>({ k: 1, x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null)

  const blockLinks = useMemo(() => {
    const out: Array<{ block: MaintenanceBlock; segments: Array<{ name: string; p1: [number, number]; p2: [number, number] }> }> = []
    for (const block of blocks) {
      const link = ALL_LINKS.find((l) => block.section === l.name || block.section === `${l.to}-${l.from}`)
      if (!link) continue
      const span = blockSpanOnLink(link, block.fromKm, block.toKm)
      if (span) out.push({ block, segments: [{ name: link.name, p1: span.p1, p2: span.p2 }] })
    }
    return out
  }, [blocks])

  const zoom = (factor: number) => setTf((t) => ({ ...t, k: Math.min(3.4, Math.max(0.6, t.k * factor)) }))
  const reset = () => setTf({ k: 1, x: 0, y: 0 })

  const onWheel = (e: React.WheelEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * VB_W
    const my = ((e.clientY - rect.top) / rect.height) * VB_H
    const factor = e.deltaY < 0 ? 1.12 : 0.89
    setTf((t) => {
      const k = Math.min(3.4, Math.max(0.6, t.k * factor))
      const rx = mx - t.x
      const ry = my - t.y
      return { k, x: mx - (rx * k) / t.k, y: my - (ry * k) / t.k }
    })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-nodrag]')) return
    dragRef.current = { x: e.clientX, y: e.clientY, sx: tf.x, sy: tf.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const scale = (e.currentTarget as HTMLElement).getBoundingClientRect().width / VB_W
    setTf((t) => ({ ...t, x: d.sx + (e.clientX - d.x) / scale, y: d.sy + (e.clientY - d.y) / scale }))
  }
  const onPointerUp = () => (dragRef.current = null)

  const emit = (sel: MapSelection, e: React.MouseEvent<SVGGElement>) => {
    const svg = e.currentTarget.ownerSVGElement
    const rect = svg?.getBoundingClientRect()
    const x = rect ? ((e.clientX - rect.left) / rect.width) * VB_W : 0
    const y = rect ? ((e.clientY - rect.top) / rect.height) * VB_H : 0
    onSelect(sel, x, y)
  }
return (
    <div
      className="relative w-full select-none overflow-hidden rounded-lg border border-line bg-[#080d18]"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      aria-label="Schematic railway network map"
    >
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block h-auto w-full">
        <defs>
          <pattern id="mapGrid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" stroke="rgba(74,96,138,0.10)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={VB_W} height={VB_H} fill="#080d18" />
        <rect width={VB_W} height={VB_H} fill="url(#mapGrid)" />
        <text x={24} y={VB_H - 18} fontSize={11} fill="#46597d" letterSpacing={3} fontFamily="JetBrains Mono, monospace">
          NR / DELHI DIVISION — MAIN LINE SCHEMATIC · NDLS ⇄ UMN
        </text>
        <text x={24} y={20} fontSize={9} fill="#33435f" letterSpacing={2}>LIVE CONTROL VIEW · BLOCKS &amp; TRAINS</text>

        <g transform={`translate(${tf.x} ${tf.y}) scale(${tf.k})`}>
          {ALL_LINKS.map((l) => {
            const seg = blockLinks.find((b) => b.segments.some((s) => s.name === l.name))
            const hoverBlock = seg?.block
            const col = hoverBlock ? deptColor[hoverBlock.department] : '#314763'
            return (
              <g key={l.id}>
                <path d={linkD(l)} fill="none" stroke="#18263c" strokeWidth={9} strokeLinecap="round" />
                <path
                  d={linkD(l)}
                  fill="none"
                  stroke={hoverBlock ? col : '#2b3f5c'}
                  strokeWidth={hoverBlock ? 6 : 3.5}
                  strokeLinecap="round"
                  strokeDasharray={hoverBlock ? '10 5' : 'none'}
                  className={hoverBlock ? 'animate-dash-move' : undefined}
                  style={hoverBlock ? { filter: `drop-shadow(0 0 8px ${col}66)` } : undefined}
                />
                {l.electrified && (
                  <path d={linkD(l)} fill="none" stroke="#9B7BFF" strokeWidth={1.1} strokeDasharray="2 16" opacity={0.35} strokeLinecap="round" />
                )}
              </g>
            )
          })}

          {blockLinks.map(({ block, segments }) =>
            segments.map((s) => (
              <g
                key={`${block.id}-${s.name}`}
                data-nodrag
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); emit({ kind: 'block', id: block.id }, e) }}
              >
                <circle cx={s.p1[0]} cy={s.p1[1]} r={5} fill="#0a1120" stroke={deptColor[block.department]} strokeWidth={2.2} />
                <circle cx={s.p2[0]} cy={s.p2[1]} r={5} fill="#0a1120" stroke={deptColor[block.department]} strokeWidth={2.2} />
              </g>
            )),
          )}

          {criticalTasks.slice(0, 8).map((task) => {
            const link = ALL_LINKS.find((l) => l.name === task.section || `${l.to}-${l.from}` === task.section)
            if (!link) return null
            const a = stationByCode.get(link.from)!
            const b = stationByCode.get(link.to)!
            const kmLen = Math.abs(b.km - a.km) || 1
            const t0 = Math.min(1, Math.max(0, (task.km - Math.min(a.km, b.km)) / kmLen))
            const [hx, hy] = pointOnLink(link, t0)
            const col = severityColor(task.priority)
            return (
              <g
                key={task.id}
                data-nodrag
                transform={`translate(${hx} ${hy})`}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); emit({ kind: 'asset', id: task.assetCode }, e) }}
              >
                <circle r={9} fill={col} opacity={0.14} className="animate-pulse" />
                <polygon points="0,-7 6,5 -6,5" fill={col} opacity={0.95} stroke="#0a1120" strokeWidth={1} transform="translate(0 -2)" />
                <title>{`${task.assetCode} · Crit ${task.criticality.score} · ${task.description}`}</title>
              </g>
            )
          })}
{trains.map((t) => {
            const a = t.route[t.sectionIdx]
            const b = t.route[t.sectionIdx + 1]
            const link = a && b ? linkBetween(a, b) : undefined
            if (!link) return null
            const pt = pointOnLink(link, t.progress)
            return (
              <g
                key={t.id}
                data-nodrag
                transform={`translate(${pt[0]} ${pt[1]})`}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); emit({ kind: 'train', id: t.number }, e) }}
              >
                <circle r={10} fill={t.critical ? '#f0506e' : t.priority === 'HIGH' ? '#f2b53d' : '#29C5E0'} opacity={0.2} className="animate-pulse" />
                <rect
                  x={-7} y={-4.5} width={14} height={9} rx={1.6}
                  fill={t.critical ? '#f0506e' : t.priority === 'HIGH' ? '#f2b53d' : t.critical === false && t.category === 'GOODS' ? '#7c8ba8' : '#29C5E0'}
                  stroke="#060a12" strokeWidth={1.4}
                  style={{ transform: t.category === 'GOODS' ? 'skewX(-14deg)' : undefined }}
                />
                <title>{`${t.number} · ${t.name} · ${t.origin}→${t.dest} · ${t.delayMinutes > 0 ? `+${t.delayMinutes} min` : 'on-time'}`}</title>
              </g>
            )
          })}

          {STATIONS.map((st) => {
            const isSelected = selected?.kind === 'station' && selected.id === st.code
            const major = st.type !== 'MINOR'
            return (
              <g
                key={st.code}
                data-nodrag
                transform={`translate(${st.x} ${st.y})`}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); emit({ kind: 'station', id: st.code }, e) }}
              >
                <circle
                  r={major ? 15 : 9}
                  fill={isSelected ? '#1c3a66' : '#0d1730'}
                  stroke={st.type === 'JUNCTION' ? '#3B82F6' : isSelected ? '#60a5fa' : '#2b4a74'}
                  strokeWidth={isSelected ? 2.4 : 1.6}
                />
                <rect
                  x={-3.6} y={-3.6} width={7.2} height={7.2} rx={0.8}
                  fill={isSelected ? '#60a5fa' : st.type === 'JUNCTION' ? '#5a8cce' : '#314763'}
                />
                {st.type === 'MAJOR' && <path d="M0 -9 L3 -19 L-3 -19 Z" fill="#29C5E0" opacity={0.9} />}
                {st.type === 'MINOR' && <circle r={1.6} fill="#7689a8" />}
                {isSelected && <circle r={major ? 20 : 13} fill="none" stroke="#60a5fa" strokeWidth={1} strokeDasharray="3 3" />}
                {showLabels && (
                  <text
                    x={major ? 21 : 14}
                    y={3}
                    fontSize={major ? 11 : 8}
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight={major ? 700 : 500}
                    fill={isSelected ? '#bfd9ff' : major ? '#cfdbee' : '#7d91b0'}
                    style={{ pointerEvents: 'none' }}
                  >
                    {st.code}
                    {st.type !== 'MINOR' && (
                      <tspan x={major ? 21 : 14} y={major ? 15 : 12} fontSize={7} fill="#46597d" fontWeight={400}>
                        {(st.km / 1000).toFixed(0)}K
                      </tspan>
                    )}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 rounded-md border border-line bg-panel/90 p-1 backdrop-blur" role="group" aria-label="Map zoom">
        <button onClick={() => zoom(1.25)} className="flex size-7 items-center justify-center rounded text-ink-faint hover:bg-panel-hover hover:text-ink" aria-label="Zoom in"><ZoomIn className="size-4" /></button>
        <button onClick={() => zoom(0.8)} className="flex size-7 items-center justify-center rounded text-ink-faint hover:bg-panel-hover hover:text-ink" aria-label="Zoom out"><ZoomOut className="size-4" /></button>
        <button onClick={reset} className="flex size-7 items-center justify-center rounded text-ink-faint hover:bg-panel-hover hover:text-ink" aria-label="Reset view"><Maximize2 className="size-4" /></button>
      </div>

      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded border border-line bg-panel/80 px-2.5 py-1.5 text-[9px] backdrop-blur">
        <span className="mr-3 inline-flex items-center gap-1 text-ink-faint"><span className="size-1.5 rounded-full bg-signal-green" /> Live</span>
        <span className="mr-3 inline-flex items-center gap-1 text-ink-faint"><span className="size-1.5 rounded-full bg-warn" /> Trains {trains.length}</span>
        <span className="inline-flex items-center gap-1 text-ink-faint"><span className="size-1.5 rounded-full bg-danger" /> {criticalTasks.length} defects</span>
      </div>
    </div>
  )
}