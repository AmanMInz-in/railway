import { Calendar, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DAY_NAMES, TODAY_ISO, iso } from '@/data/network'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fmtDate } from '@/lib/format'

export function DateSelector({
  value,
  onChange,
  compact,
}: {
  value: string
  onChange: (iso: string) => void
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => new Date(`${value}T00:00:00`))
  const today = new Date(TODAY_ISO + 'T00:00:00')

  const grid = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
    const start = new Date(first)
    start.setDate(start.getDate() - first.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [viewMonth])

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex h-8 items-center justify-between gap-2 rounded-md border border-line bg-panel-edge px-2.5 text-xs text-ink hover:bg-panel-hover">
          {compact ? <CalendarDays className="size-3.5 text-ink-faint" /> : <Calendar className="size-3.5 text-ink-faint" />}
          <span className="mono-num">{fmtDate(value)}</span>
          {!compact && <span className="text-[10px] text-ink-faint">▲ select</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex items-center justify-between px-1 pb-2">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="size-3.5" />
          </Button>
          <p className="text-xs font-semibold text-ink">
            {viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {DAY_NAMES.map((d) => (
            <span key={d} className="pb-1 text-center text-[9px] font-semibold uppercase text-ink-faint">{d}</span>
          ))}
          {grid.map((d) => {
            const dIso = iso(d)
            const inMonth = d.getMonth() === viewMonth.getMonth()
            const selected = dIso === value
            const isToday = dIso === TODAY_ISO
            return (
              <button
                key={dIso}
                onClick={() => {
                  onChange(dIso)
                  setOpen(false)
                }}
                className={cn(
                  'mono-num flex h-7 w-7 items-center justify-center rounded text-[11px] transition-colors',
                  !inMonth && 'text-ink-muted',
                  inMonth && !selected && 'text-ink-dim hover:bg-panel-hover hover:text-ink',
                  isToday && 'ring-1 ring-inset ring-accent/50',
                  selected && 'bg-accent font-semibold text-white shadow-glow',
                )}
                aria-label={dIso}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex gap-1.5 border-t border-line pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-6 flex-1 text-[10px]"
            onClick={() => { onChange(TODAY_ISO); setOpen(false) }}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 flex-1 text-[10px]"
            onClick={() => { onChange(iso(new Date(today.getTime() + 86400000))); setOpen(false) }}
          >
            Tomorrow
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}