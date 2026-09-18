import type { Train, TrainCategory, TrainPriority, TrainType } from '@/types'
import { stationByCode } from '@/data/network'
import { asyncDelay } from '@/lib/utils'
import { linkBetween } from '@/data/links'
import { pointOnLink } from '@/data/links'

/* ===========================================================
 * Live train feed (mock of IR COA / NTES). Trains move
 * along the schematic network; subscribers receive an
 * evicted copy every tick.
 * =========================================================== */

const SECTION_MIN: Record<string, number> = {
  'NDLS-DWN': 14,
  'DWN-MTJ': 58,
  'MTJ-AGRA': 55,
  'AGRA-GWL': 65,
  'GWL-JHS': 50,
  'JHS-BPL': 168,
  'BPL-NGP': 74,
  'NGP-BSL': 148,
  'BSL-UMN': 236,
  'DWN-JP': 95,
  'JP-AII': 74,
  'MTJ-CNB': 95,
  'CNB-PRY': 148,
  'NDLS-HNU': 12,
  'HNU-BHL': 275,
}

function segMin(a: string, b: string) {
  const inv = `${b}-${a}`
  return SECTION_MIN[`${a}-${b}`] ?? SECTION_MIN[inv] ?? 40
}

export function segMinPublic(a: string, b: string) {
  return segMin(a, b)
}

interface TrainSeed {
  number: string
  name: string
  type: TrainType
  category: TrainCategory
  origin: string
  dest: string
  route: string[]
  depart: string // HH:MM
  delay: number
  priority: TrainPriority
  sectionIdx: number
  progress: number
  speed: number
  critical?: boolean
}

const SEEDS: TrainSeed[] = [
  { number: '02060', name: 'VANDE BHARAT M.P.' , type: 'VANDE BHARAT', category: 'PASSENGER', origin: 'NDLS', dest: 'BPL', route: ['NDLS', 'DWN', 'MTJ', 'AGRA', 'GWL', 'JHS', 'BPL'], depart: '06:00', delay: 6, priority: 'HIGH', sectionIdx: 4, progress: 0.35, speed: 132, critical: true },
  { number: '12952', name: 'MUMBAI RAJDHANI', type: 'RAJDHANI', category: 'MAIL_EXPRESS', origin: 'NDLS', dest: 'UMN', route: ['NDLS', 'DWN', 'MTJ', 'AGRA', 'GWL', 'JHS', 'BPL', 'NGP', 'BSL', 'UMN'], depart: '16:10', delay: 2, priority: 'HIGH', sectionIdx: 1, progress: 0.22, speed: 95, critical: true },
  { number: '12002', name: 'BHOPAL SHATABDI', type: 'SHATABDI', category: 'PASSENGER', origin: 'NDLS', dest: 'BPL', route: ['NDLS', 'DWN', 'MTJ', 'AGRA', 'GWL', 'JHS', 'BPL'], depart: '06:00', delay: 0, priority: 'MEDIUM', sectionIdx: 3, progress: 0.4, speed: 122 },
  { number: '22221', name: 'MUMBAI RAJDHANI', type: 'RAJDHANI', category: 'MAIL_EXPRESS', origin: 'NDLS', dest: 'UMN', route: ['NDLS', 'DWN', 'MTJ', 'AGRA', 'GWL', 'JHS', 'BPL', 'NGP', 'BSL', 'UMN'], depart: '16:00', delay: 12, priority: 'HIGH', sectionIdx: 0, progress: 0.8, speed: 90, critical: true },
  { number: '12816', name: 'NANDA DEVI EXP', type: 'EXPRESS', category: 'PASSENGER', origin: 'NDLS', dest: 'BHL', route: ['NDLS', 'HNU', 'BHL'], depart: '14:00', delay: 18, priority: 'MEDIUM', sectionIdx: 1, progress: 0.55, speed: 78 },
  { number: '12248', name: 'SUNRISE EXPRESS', type: 'SUPERFAST', category: 'PASSENGER', origin: 'NDLS', dest: 'CNB', route: ['NDLS', 'DWN', 'MTJ', 'CNB'], depart: '05:05', delay: 45, priority: 'MEDIUM', sectionIdx: 2, progress: 0.7, speed: 70 },
  { number: '22646', name: 'KERALA EXPRESS', type: 'EXPRESS', category: 'MAIL_EXPRESS', origin: 'NDLS', dest: 'NGP', route: ['NDLS', 'DWN', 'MTJ', 'AGRA', 'GWL', 'JHS', 'BPL', 'NGP'], depart: '12:00', delay: 8, priority: 'MEDIUM', sectionIdx: 2, progress: 0.2, speed: 88 },
  { number: '03294', name: 'NDLS-CNB MEMU', type: 'MEMU', category: 'PASSENGER', origin: 'NDLS', dest: 'CNB', route: ['NDLS', 'DWN', 'MTJ', 'CNB'], depart: '08:30', delay: 0, priority: 'LOW', sectionIdx: 1, progress: 0.25, speed: 55 },
  { number: '12402', name: 'NDLS-JAIPUR SHTN', type: 'SHATABDI', category: 'PASSENGER', origin: 'NDLS', dest: 'AII', route: ['NDLS', 'DWN', 'JP', 'AII'], depart: '07:05', delay: 25, priority: 'MEDIUM', sectionIdx: 1, progress: 0.6, speed: 105 },
  { number: '03092', name: 'NDLS-AJMER MEMU', type: 'MEMU', category: 'PASSENGER', origin: 'NDLS', dest: 'AII', route: ['NDLS', 'DWN', 'JP', 'AII'], depart: '06:30', delay: 0, priority: 'LOW', sectionIdx: 0, progress: 0.55, speed: 50 },
  { number: '12615', name: 'GRAND TRUNK EXP', type: 'SUPERFAST', category: 'MAIL_EXPRESS', origin: 'NDLS', dest: 'PRY', route: ['NDLS', 'DWN', 'MTJ', 'CNB', 'PRY'], depart: '11:00', delay: 3, priority: 'MEDIUM', sectionIdx: 1, progress: 0.15, speed: 95 },
  { number: '63002', name: 'DJH COAL GOODS', type: 'GOODS', category: 'GOODS', origin: 'BSL', dest: 'NDLS', route: ['BSL', 'NGP', 'BPL', 'JHS', 'GWL', 'AGRA', 'MTJ', 'DWN', 'NDLS'], depart: '05:00', delay: 30, priority: 'MEDIUM', sectionIdx: 3, progress: 0.45, speed: 45 },
  { number: '63011', name: 'CONTAINER GOODS', type: 'GOODS', category: 'GOODS', origin: 'CNB', dest: 'UMN', route: ['CNB', 'MTJ', 'AGRA', 'GWL', 'JHS', 'BPL', 'NGP', 'BSL', 'UMN'], depart: '09:30', delay: 12, priority: 'MEDIUM', sectionIdx: 2, progress: 0.33, speed: 52 },
  { number: '63005', name: 'KR-BPL GOODS', type: 'GOODS', category: 'GOODS', origin: 'NDLS', dest: 'BPL', route: ['NDLS', 'DWN', 'MTJ', 'AGRA', 'GWL', 'JHS', 'BPL'], depart: '13:00', delay: 55, priority: 'MEDIUM', sectionIdx: 1, progress: 0.1, speed: 48 },
  { number: '19006', name: 'SAURASHTRA EXP', type: 'EXPRESS', category: 'MAIL_EXPRESS', origin: 'NDLS', dest: 'AII', route: ['NDLS', 'DWN', 'JP', 'AII'], depart: '18:00', delay: 0, priority: 'MEDIUM', sectionIdx: 0, progress: 0, speed: 92 },
  { number: '02026', name: 'NDLS-BHL SPL', type: 'SUPERFAST', category: 'PASSENGER', origin: 'NDLS', dest: 'BHL', route: ['NDLS', 'HNU', 'BHL'], depart: '16:30', delay: 0, priority: 'MEDIUM', sectionIdx: 0, progress: 0.12, speed: 100 },
]
function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function buildLive(): Train[] {
  return SEEDS.map((s, i) => {
    const depMin = toMin(s.depart)
    let arr = depMin
    for (let k = 0; k < s.route.length - 1; k++) arr += segMin(s.route[k], s.route[k + 1])
    const status: Train['status'] = s.delay > 20 ? 'DELAYED' : 'RUNNING'
    return {
      id: `TR-${i + 1}`,
      number: s.number,
      name: s.name,
      type: s.type,
      category: s.category,
      origin: s.origin,
      dest: s.dest,
      route: s.route,
      departTime: depMin,
      arrivalTime: arr,
      delayMinutes: s.delay,
      priority: s.priority,
      status,
      sectionIdx: s.sectionIdx,
      progress: s.progress,
      speedKmph: s.speed,
      critical: !!s.critical,
    }
  })
}

let live: Train[] = buildLive()
const listeners = new Set<(trains: Train[]) => void>()
let timer: ReturnType<typeof setInterval> | null = null

function startEngine() {
  if (timer || listeners.size === 0) return
  timer = setInterval(tickFlow, 2400)
}

function stopEngine() {
  if (timer && listeners.size === 0) {
    clearInterval(timer)
    timer = null
  }
}

function tickFlow() {
  live = live.map((t) => {
    if (t.status !== 'RUNNING' && t.status !== 'DELAYED') return t
    const a = t.route[t.sectionIdx]
    const b = t.route[t.sectionIdx + 1]
    if (!a || !b) return t
    const sa = stationByCode.get(a)
    const sb = stationByCode.get(b)
    if (!sa || !sb) return t
    const lenKm = Math.abs(sb.km - sa.km) || 1
    const dt = (t.speedKmph * (2.4 / 3600)) / lenKm
    let sIdx = t.sectionIdx
    let prog = t.progress + dt
    while (prog >= 1 && sIdx < t.route.length - 2) {
      sIdx++
      prog -= 1
    }
    if (sIdx >= t.route.length - 1) {
      // reached destination → respawn for continuous demo feed
      sIdx = 0
      prog = 0
    }
    return { ...t, sectionIdx: sIdx, progress: prog }
  })
  listeners.forEach((cb) => cb(live))
}

export const trainService = {
  async getTrains(): Promise<Train[]> {
    await asyncDelay(60)
    return live.map((t) => ({ ...t }))
  },
  async getTrainById(numberOrId: string): Promise<Train | undefined> {
    await asyncDelay(40)
    return live.find((t) => t.number === numberOrId || t.id === numberOrId)
  },
  async searchTrains(q: string): Promise<Train[]> {
    await asyncDelay(30)
    const s = q.toLowerCase()
    return live.filter(
      (t) =>
        t.number.toLowerCase().includes(s) ||
        t.name.toLowerCase().includes(s) ||
        `${t.origin}${t.dest}`.toLowerCase().includes(s) ||
        t.route.some((r) => r.toLowerCase() === s),
    )
  },
  async getLiveStats() {
    await asyncDelay(40)
    const delayed = live.filter((t) => t.delayMinutes > 15).length
    const highPriority = live.filter((t) => t.priority === 'HIGH').length
    const goods = live.filter((t) => t.category === 'GOODS').length
    const maxDelay = Math.max(...live.map((t) => t.delayMinutes))
    return { running: live.length, delayed, highPriority, goods, maxDelay }
  },
  setStatus(id: string, status: Train['status']) {
    live = live.map((t) => (t.id === id ? { ...t, status } : t))
    listeners.forEach((cb) => cb(live))
  },
  subscribeTrains(cb: (trains: Train[]) => void): () => void {
    listeners.add(cb)
    cb(live)
    startEngine()
    return () => {
      listeners.delete(cb)
      stopEngine()
    }
  },
}

export function trainPosition(t: Train): { x: number; y: number; linkName: string } {
  const a = t.route[t.sectionIdx]
  const b = t.route[t.sectionIdx + 1]
  if (!a || !b) return { x: 0, y: 0, linkName: '' }
  const link = linkBetween(a, b)
  const sa = stationByCode.get(a)
  const sb = stationByCode.get(b)
  if (!sa || !sb || !link) {
    const s = stationByCode.get(a ?? 'NDLS') ?? stationByCode.get('NDLS')!
    return { x: s.x, y: s.y, linkName: `${a ?? ''}-${b ?? ''}` }
  }
  const pt = pointOnLink(link, t.progress)
  return { x: pt[0], y: pt[1], linkName: link.name }
}