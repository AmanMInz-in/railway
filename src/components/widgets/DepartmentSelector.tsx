import type { DepartmentId } from '@/types'
import { deptColor, deptLabel } from '@/lib/meta'
import { cn } from '@/lib/utils'

const ALL: DepartmentId[] = ['TMS', 'SMMS', 'TDMS']

export function DepartmentSelector({
  value,
  onChange,
  multi,
  className,
}: {
  value: DepartmentId | DepartmentId[] | null
  onChange: (next: DepartmentId | DepartmentId[] | null) => void
  multi?: boolean
  className?: string
}) {
  const isActive = (d: DepartmentId) =>
    multi ? (value as DepartmentId[] | null)?.includes(d) ?? false : value === d
  const toggle = (d: DepartmentId) => {
    if (!multi) {
      onChange(value === d ? null : d)
      return
    }
    const cur = (value as DepartmentId[] | null) ?? []
    onChange(cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d])
  }
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-md border border-line bg-panel-edge p-0.5', className)} role="group" aria-label="Department filter">
      {ALL.map((d) => (
        <button
          key={d}
          onClick={() => toggle(d)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors',
            isActive(d)
              ? 'text-ink'
              : 'text-ink-faint hover:text-ink-dim hover:bg-panel-hover',
          )}
          style={isActive(d) ? { background: `${deptColor[d]}1f`, boxShadow: `inset 0 0 0 1px ${deptColor[d]}55` } : undefined}
          aria-pressed={isActive(d)}
        >
          <span className="size-1.5 rounded-full" style={{ background: deptColor[d] }} />
          {deptLabel[d]}
        </button>
      ))}
    </div>
  )
}