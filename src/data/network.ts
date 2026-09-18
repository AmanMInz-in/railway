import type { Station } from '@/types'

/* ============================================================
 * Schematic IR network topology — NR / Delhi Division corridor
 * Coordinates form a control-room style 45°/90° diagram.
 * ============================================================ */

export const ZONES = [
  { code: 'NR', name: 'Northern Railway', headquarter: 'New Delhi' },
  { code: 'NCR', name: 'North Central Railway', headquarter: 'Prayagraj' },
  { code: 'WCR', name: 'West Central Railway', headquarter: 'Jabalpur' },
  { code: 'CR', name: 'Central Railway', headquarter: 'Mumbai CST' },
  { code: 'NWR', name: 'North Western Railway', headquarter: 'Jaipur' },
]

export const DIVISIONS = ['DELHI', 'AGRA', 'MATHURA', 'MUMBAI', 'JAIPUR', 'KANPUR']

export const CORRIDOR_CODE = 'NDLS-UMD'

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const TODAY_ISO = '2026-09-14'

export const STATIONS: Station[] = [
  { code: 'HNU', name: 'Hazrat Nizamuddin', km: 3, platform: 6, type: 'MAJOR', onMainCorridor: false, x: 290, y: 42 },
  { code: 'BHL', name: 'Bareilly Jn', km: 268, platform: 4, type: 'MAJOR', onMainCorridor: false, x: 460, y: 42 },
  { code: 'NDLS', name: 'New Delhi', km: 0, platform: 16, type: 'MAJOR', onMainCorridor: true, x: 150, y: 108 },
  { code: 'DWN', name: 'Delhi Cantt', km: 6, platform: 4, type: 'JUNCTION', onMainCorridor: true, x: 150, y: 250 },
  { code: 'MTJ', name: 'Mathura Jn', km: 94, platform: 10, type: 'JUNCTION', onMainCorridor: true, x: 150, y: 356 },
  { code: 'AGRA', name: 'Agra Cantt', km: 195, platform: 8, type: 'MAJOR', onMainCorridor: true, x: 268, y: 470 },
  { code: 'GWL', name: 'Gwalior Jn', km: 308, platform: 6, type: 'JUNCTION', onMainCorridor: true, x: 398, y: 556 },
  { code: 'JHS', name: 'Jhansi Jn', km: 400, platform: 10, type: 'JUNCTION', onMainCorridor: true, x: 548, y: 556 },
  { code: 'BPL', name: 'Bhopal Jn', km: 701, platform: 12, type: 'MAJOR', onMainCorridor: true, x: 700, y: 632 },
  { code: 'NGP', name: 'Nagpur Jn', km: 831, platform: 12, type: 'MAJOR', onMainCorridor: true, x: 856, y: 700 },
  { code: 'BSL', name: 'Bhusaval Jn', km: 1418, platform: 9, type: 'JUNCTION', onMainCorridor: true, x: 1012, y: 700 },
  { code: 'UMN', name: 'Mumbai CST', km: 2013, platform: 18, type: 'MAJOR', onMainCorridor: true, x: 1156, y: 640 },
  { code: 'JP', name: 'Jaipur Jn', km: 335, platform: 8, type: 'MAJOR', onMainCorridor: false, x: 40, y: 356 },
  { code: 'AII', name: 'Ajmer Jn', km: 460, platform: 6, type: 'MAJOR', onMainCorridor: false, x: 40, y: 470 },
  { code: 'CNB', name: 'Kanpur Central', km: 440, platform: 12, type: 'MAJOR', onMainCorridor: false, x: 348, y: 356 },
  { code: 'PRY', name: 'Prayagraj Jn', km: 634, platform: 10, type: 'MAJOR', onMainCorridor: false, x: 560, y: 356 },
  { code: 'KLH', name: 'Kotla Halt', km: 122, platform: 2, type: 'MINOR', onMainCorridor: true, x: 205, y: 402 },
  { code: 'SNP', name: 'Sumerpur Halt', km: 352, platform: 2, type: 'MINOR', onMainCorridor: false, x: 472, y: 402 },
  { code: 'JRO', name: 'Jharsa Cabin', km: 642, platform: 2, type: 'MINOR', onMainCorridor: false, x: 620, y: 632 },
]

export const stationByCode = new Map(STATIONS.map((s) => [s.code, s] as const))

export const MAIN_STATIONS_IN_ORDER = STATIONS
  .filter((s) => s.onMainCorridor)
  .sort((a, b) => a.km - b.km)

export const DAY_MS = 86400000

export function iso(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate()! + days)
  return iso(d)
}