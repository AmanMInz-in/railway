/* Shared helpers for deterministic mock datasets across services. */

import type { Severity, TaskStatus } from '@/types'
import { seededRandom } from '@/lib/utils'

export { seededRandom }

export interface LinkInfo {
  section: string
  kmMin: number
  kmMax: number
  stations: [string, string]
}

export const LINK_INFO: LinkInfo[] = [
  { section: 'NDLS-DWN', kmMin: 0, kmMax: 6, stations: ['NDLS', 'DWN'] },
  { section: 'DWN-MTJ', kmMin: 6, kmMax: 94, stations: ['DWN', 'MTJ'] },
  { section: 'MTJ-AGRA', kmMin: 94, kmMax: 195, stations: ['MTJ', 'AGRA'] },
  { section: 'AGRA-GWL', kmMin: 195, kmMax: 308, stations: ['AGRA', 'GWL'] },
  { section: 'GWL-JHS', kmMin: 308, kmMax: 400, stations: ['GWL', 'JHS'] },
  { section: 'JHS-BPL', kmMin: 400, kmMax: 701, stations: ['JHS', 'BPL'] },
  { section: 'BPL-NGP', kmMin: 701, kmMax: 831, stations: ['BPL', 'NGP'] },
  { section: 'NGP-BSL', kmMin: 831, kmMax: 1418, stations: ['NGP', 'BSL'] },
  { section: 'BSL-UMN', kmMin: 1418, kmMax: 2013, stations: ['BSL', 'UMN'] },
  { section: 'DWN-JP', kmMin: 6, kmMax: 335, stations: ['DWN', 'JP'] },
  { section: 'MTJ-CNB', kmMin: 94, kmMax: 440, stations: ['MTJ', 'CNB'] },
  { section: 'CNB-PRY', kmMin: 440, kmMax: 634, stations: ['CNB', 'PRY'] },
  { section: 'NDLS-HNU', kmMin: 0, kmMax: 3, stations: ['NDLS', 'HNU'] },
  { section: 'HNU-BHL', kmMin: 3, kmMax: 268, stations: ['HNU', 'BHL'] },
]

export const sectionKm = (section: string): [number, number] => {
  const l = LINK_INFO.find((x) => x.section === section)
  return l ? [l.kmMin, l.kmMax] : [0, 100]
}

export const pickSection = (rnd: () => number) => {
  const idx = Math.floor(rnd() * LINK_INFO.length)
  return LINK_INFO[idx].section
}

const WEIGHTED_SEVERITY: Severity[] = [
  'LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'CRITICAL',
]

export const randomSeverity = (rnd: () => number): Severity =>
  WEIGHTED_SEVERITY[Math.floor(rnd() * WEIGHTED_SEVERITY.length)]

export const findDaysAgo = (iso: string, daysAgo: number) =>
  new Date(new Date(`${iso}T00:00:00`).getTime() - Math.abs(daysAgo) * 86400000)
    .toISOString()
    .slice(0, 10)

export type StatusWithPriority = {
  status: TaskStatus
  priorityFactor: number // multiplier pushing due dates earlier for critical tasks
}

export function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}