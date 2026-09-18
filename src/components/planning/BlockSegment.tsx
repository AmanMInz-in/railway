import { useRef, useState } from 'react'
import type { MaintenanceBlock } from '@/types'
import { deptColor } from '@/lib/meta'
import { fmtMin, fmtDuration } from '@/lib/format'
import { cn } from '@/lib/utils'

interface BlockSegmentProps {
  block: MaintenanceBlock
  left: number // px
  widthPx: number
  top: number
  laneHeight: number
  minWidthPx: number
  onMove: (id: string, startMin: number, endMin: number) => void
  onSelect: (id: string) => void
  selected: boolean
  conflicts: number
  pxPerMin: number
}

/**
 * Draggable / resizable block segment for the planner timeline.
 * All math is in "minutes" space; conversion to px happens in the parent.
 */
export function BlockSegment({
  block,
  left,
  widthPx,
  top,
  laneHeight,
  minWidthPx,
  onMove,
  onSelect,
  selected,
  conflicts,
  pxPerMin,
}: BlockSegmentProps) {
  const [live, setLive] = useState<{ l: number; r: number } | null>(null)
  const gesture = useRef<{
    mode: 'move' | 'resize-l' | 'resize-r'
    startClientX: number
    startLeft: number
    startRight: number
    dx: number
  } | null>(null)
  const col = deptColor[block.department]

  const toMin = (px: number) => px / pxPerMin

  const onPointerDown = (e: React.PointerEvent, mode: 'move' | 'resize-l' | 'resize-r') => {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    gesture.current = { mode, startClientX: e.clientX, startLeft: toMin(left), startRight: toMin(left + widthPx), dx: 0 }
    onSelect(block.id)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g) return
    g.dx = toMin(e.clientX - g.startClientX)
    const { mode, startLeft, startRight, dx } = g
    const l = mode === 'resize-l' ? startLeft + dx : mode === 'move' ? startLeft + dx : startLeft
    const r = mode === 'resize-r' ? startRight + dx : mode === 'move' ? startRight + dx : startRight
    if (r - l < 0) return
    setLive({ l, r })
  }

  const onPointerUp = () => {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    const { mode, startLeft, startRight, dx } = g
    const l = mode === 'resize-l' ? startLeft + dx : startLeft + (mode === 'move' ? dx : 0)
    const r = mode === 'resize-r' ? startRight + dx : startRight + (mode === 'move' ? dx : 0)
    setLive(null)
    const start = Math.max(0, Math.min(1439 - 30, l))
    const end = Math.max(start + 30, Math.min(1440, r))
    onMove(block.id, Math.round(start / 15) * 15, Math.round(end / 15) * 15)
  }

  const shownL = live ? live.l * pxPerMin : left
  const w = Math.max(minWidthPx, (live ? live.r * pxPerMin : left + widthPx) - shownL)

  return (
    <div
      className={cn(
        'group absolute z-10 cursor-grab touch-none select-none rounded-[3px] active:cursor-grabbing',
        selected && 'z-20',
        conflicts > 0 && 'outline outline-1 outline-danger/60',
      )}
      style={{
        left: isFinite(shownL) ? shownL : left,
        top,
        width: w,
        height: laneHeight - 8,
        background: `linear-gradient(180deg, ${col}2e, ${col}12)`,
        border: `1px solid ${conflicts > 0 ? '#f0506e' : col}`,
        boxShadow: selected
          ? `0 0 0 1px ${col}66, 0 0 18px -4px ${col}99`
          : `inset 0 0 14px ${col}20`,
      }}
      onPointerDown={(e) => onPointerDown(e, 'move')}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={() => onSelect(block.id)}
      role="button"
      tabIndex={0}
      data-blockid={block.id}
      aria-label={`${block.code} block on ${block.section} ${fmtMin(block.startMin)} to ${fmtMin(block.endMin)}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(block.id)
      }}
    >
      {conflicts > 0 && (
        <span className="absolute -right-1.5 -top-1.5 z-10 flex size-4 items-center justify-center rounded-full bg-danger text-[8px] font-bold text-white ring-2 ring-canvas">
          {conflicts}
        </span>
      )}
      <div className="pointer-events-none absolute inset-y-1 left-1 w-1 rounded-sm" style={{ background: col }} />
      <div className="pointer-events-none flex h-full flex-col justify-center overflow-hidden pl-3 pr-1.5">
        <p className="truncate font-mono text-[9px] font-bold leading-tight text-[#e9f2ff]">{block.code}</p>
        <p className="truncate text-[8px] leading-tight text-ink-faint">
          {fmtMin(block.startMin)}–{fmtMin(block.endMin)} · {fmtDuration(block.durationMin)}
        </p>
      </div>
      <span
        onPointerDown={(e) => onPointerDown(e, 'resize-l')}
        className={cn('absolute left-0 top-0 h-full w-1.5 cursor-ew-resize bg-white/25 transition-opacity', widthPx < 44 ? 'block' : 'hidden group-hover:block', selected && 'block')}
        title="Resize start"
      />
      <span
        onPointerDown={(e) => onPointerDown(e, 'resize-r')}
        className={cn('absolute right-0 top-0 h-full w-1.5 cursor-ew-resize bg-white/25 transition-opacity', widthPx < 44 ? 'block' : 'hidden group-hover:block', selected && 'block')}
        title="Resize end"
      />
    </div>
  )
}