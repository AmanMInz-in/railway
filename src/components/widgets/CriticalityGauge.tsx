import { cn } from '@/lib/utils'

function tone(score: number) {
  if (score >= 80) return { stroke: '#f0506e', glow: 'rgba(240,80,110,0.5)', text: 'text-danger' }
  if (score >= 60) return { stroke: '#f2b53d', glow: 'rgba(242,181,61,0.5)', text: 'text-warn' }
  if (score >= 40) return { stroke: '#60a5fa', glow: 'rgba(96,165,250,0.5)', text: 'text-accent-bright' }
  return { stroke: '#2AC76F', glow: 'rgba(42,199,111,0.5)', text: 'text-signal-green' }
}

/**
 * 180° semicircular gauge used across criticality surfaces.
 */
export function CriticalityGauge({
  score,
  size = 150,
  label = 'CRITICALITY',
  sub,
}: {
  score: number
  size?: number
  label?: string
  sub?: string
}) {
  const s = size
  const cx = s / 2
  const cy = s / 2
  const r = s / 2 - 12
  const t = tone(score)
  const v = Math.max(0, Math.min(100, score))

  const arcPath = (from: number, to: number, radius: number) => {
    const a0 = Math.PI + (from / 100) * Math.PI
    const a1 = Math.PI + (to / 100) * Math.PI
    const x0 = cx + radius * Math.cos(a0)
    const y0 = cy + radius * Math.sin(a0)
    const x1 = cx + radius * Math.cos(a1)
    const y1 = cy + radius * Math.sin(a1)
    return `M ${x0} ${y0} A ${radius} ${radius} 0 0 1 ${x1} ${y1}`
  }

  const ticks = [0, 40, 60, 80, 100]
  const needleAngle = Math.PI + (v / 100) * Math.PI
  const nx = cx + (r - 14) * Math.cos(needleAngle)
  const ny = cy + (r - 14) * Math.sin(needleAngle)

  return (
    <div className="inline-flex flex-col items-center" style={{ width: s }}>
      <svg width={s} height={s * 0.58} viewBox={`0 0 ${s} ${s * 0.58}`} role="img" aria-label={`${label}: ${v} / 100`}>
        <path d={arcPath(0, 100, r)} fill="none" stroke="#1c2a44" strokeWidth={9} strokeLinecap="round" />
        {/* severity bands */}
        <path d={arcPath(0, 100, r)} fill="none" stroke="url(#gaugeTrack)" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        <defs>
          <linearGradient id="gaugeTrack" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2AC76F" />
            <stop offset="40%" stopColor="#60a5fa" />
            <stop offset="62%" stopColor="#f2b53d" />
            <stop offset="82%" stopColor="#f0506e" />
          </linearGradient>
        </defs>
        <path d={arcPath(0, v, r)} fill="none" stroke={t.stroke} strokeWidth={9} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${t.glow})`, transition: 'all .4s' }} />
        {ticks.map((tk) => {
          const a = Math.PI + (tk / 100) * Math.PI
          const x0 = cx + (r - 5) * Math.cos(a)
          const y0 = cy + (r - 5) * Math.sin(a)
          const x1 = cx + (r + 3) * Math.cos(a)
          const y1 = cy + (r + 3) * Math.sin(a)
          return <line key={tk} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#3a5278" strokeWidth={1.5} />
        })}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#e6edf9" strokeWidth={2} strokeLinecap="round" style={{ transition: 'all .4s' }} />
        <circle cx={cx} cy={cy} r={5} fill="#0c1424" stroke="#3a5278" strokeWidth={1.5} />
        <text x={cx} y={s * 0.5 - 2} textAnchor="middle" className={cn('mono-num font-semibold', t.text)} fontSize={s * 0.13} fill="currentColor">
          {v}
        </text>
        <text x={cx} y={s * 0.5 + 12} textAnchor="middle" fontSize={7} fill="#6c7e9e" letterSpacing={1.5}>
          / 100
        </text>
      </svg>
      <p className="ctrl-title mt-1 text-center">{label}
        {sub && <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-ink-faint">{sub}</span>}
      </p>
    </div>
  )
}