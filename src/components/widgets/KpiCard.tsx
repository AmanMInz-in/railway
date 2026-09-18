import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'
import { Dot } from './StatusBadge'
import type { Tone } from '@/lib/meta'

export interface KpiCardProps {
  label: string
  value: React.ReactNode
  trend?: number
  trendLabel?: string
  status?: string
  statusTone?: Tone
  spark?: number[]
  accent?: string
  icon?: React.ReactNode
  index?: number
  meta?: React.ReactNode
}

export function Sparkline({ data, color = '#3b82f6', width = 96, height = 26 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - 3 - ((v - min) / range) * (height - 6)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const area = `0,${height} ${pts} ${width},${height}`
  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden>
      <polygon points={area} fill={color} opacity={0.08} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function KpiCard({
  label,
  value,
  trend,
  trendLabel,
  status,
  statusTone = 'default',
  spark,
  accent = '#3b82f6',
  icon,
  index = 0,
  meta,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="ctrl-panel relative overflow-hidden p-4"
      style={{ borderColor: `color-mix(in srgb, ${accent} 22%, #1c2a44)` }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="ctrl-title">{label}</p>
          <p className="mono-num mt-1.5 text-[26px] font-semibold leading-none text-ink">{value}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {icon}
          {trend !== undefined && (
            <span
              className={cn(
                'mono-num inline-flex items-center gap-0.5 text-[11px] font-medium',
                trend >= 0 ? 'text-signal-green' : 'text-danger',
              )}
            >
              {trend >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-3 -mb-1">
          <Sparkline data={spark} color={accent} />
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line/60 pt-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] text-ink-faint">
          {statusTone && <Dot tone={statusTone} pulse />}
          {status ?? '—'}
        </span>
        {meta}
      </div>
    </motion.div>
  )
}