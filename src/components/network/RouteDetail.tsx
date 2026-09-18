import type { Train } from '@/types'
import { MAIN_STATIONS_IN_ORDER } from '@/data/network'
import { segMinPublic } from '@/services/trainService'
import { fmtMin } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Compact vertical route profile for a train — station stops vs running time. */
export function RouteDetail({ train }: { train: Train }) {
  let acc = train.departTime
  const order = new Map(MAIN_STATIONS_IN_ORDER.map((s, i) => [s.code, i]))
  const idxs = train.route
    .map((code) => order.get(code))
    .filter((v): v is number => v !== undefined)
  if (idxs.length < 2) return <p className="text-[10px] text-ink-faint">No corridor profile available for this service.</p>
  const min = Math.min(...idxs)
  const max = Math.max(...idxs)
  const rowH = 26
  const totalH = (max - min + 1) * rowH

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ height: totalH + 18 }}>
        {/* time grid */}
        <div className="absolute inset-y-0 left-10 flex" style={{ width: 220 }}>
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="flex-1 border-l border-white/[0.04]" />
          ))}
        </div>
        {/* route line */}
        <svg className="absolute inset-0 h-full w-full" width="100%" height="100%" viewBox={`0 0 320 ${totalH + 18}`} preserveAspectRatio="none">
          {train.route.slice(0, -1).map((_, i) => {
            const aIdx = order.get(train.route[i])
            const bIdx = order.get(train.route[i + 1])
            if (aIdx === undefined || bIdx === undefined) return null
            const x0 = 46
            const x1 = 46 + (segMinPublic(train.route[i], train.route[i + 1]) / 130) * 200
            const y0 = (aIdx - min) * rowH + rowH / 2 + 4
            const y1 = (bIdx - min) * rowH + rowH / 2 + 4
            return (
              <line key={i} x1={x0} y1={y0} x2={x1} y2={y1}
                stroke={train.critical ? '#f0506e' : train.category === 'GOODS' ? '#8293ae' : '#29C5E0'}
                strokeWidth={2} strokeLinecap="round" opacity={0.9} />
            )
          })}
        </svg>
        {/* rows */}
        {train.route.map((code, i) => {
          const idx = order.get(code)
          if (idx === undefined) return null
          const isStart = i === 0 || code !== train.route[i - 1]
          const t = idx
          const rowTime = i === 0 ? train.departTime : ((acc += segMinPublic(train.route[i - 1], train.route[i])), acc)
          return (
            <div key={`${code}-${i}`} className="absolute flex items-center gap-2" style={{ top: (t - min) * rowH + 4, left: 0, right: 0, height: rowH }}>
              <span className={cn('w-9 text-right font-mono text-[10px] font-bold', isStart ? 'text-ink' : 'text-ink-faint')}>{code}</span>
              <span
                className={cn(
                  'relative top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border-2',
                  train.critical ? 'border-danger bg-danger/40' : 'border-signal-cyan bg-canvas',
                )}
              />
              <span className="ml-1 font-mono text-[9px] text-ink-faint">{fmtMin(rowTime)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}