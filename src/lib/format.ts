/** Formatting helpers shared across the app. */

export function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

/** minutes from midnight -> "HH:MM" (24h) */
export function fmtMin(min: number) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
}

/** "HH:MM – HH:MM" */
export function fmtMinRange(a: number, b: number) {
  return `${fmtMin(a)} – ${fmtMin(b)}`
}

/** minutes -> "2h 15m" */
export function fmtDuration(min: number) {
  const h = Math.floor(Math.abs(min) / 60)
  const m = Math.round(Math.abs(min) % 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export function fmtKms(km: number) {
  return `KM ${km.toFixed(1)}`
}

/** ISO date -> "14 Sep 2026" */
export function fmtDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtDateTime(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function fmtClock(now: Date) {
  return now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function fmtNum(n: number) {
  return n.toLocaleString('en-IN')
}

export function signedPct(n: number) {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}%`
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function daysUntil(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}