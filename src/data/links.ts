import type { NetworkLink } from '@/types'
import { stationByCode } from './network'

/* ============================================================
 * Schematic links (sections) between stations.
 * points[] describe the 45°/90° control-room style geometry.
 * ============================================================ */

export const LINKS: NetworkLink[] = [
  {
    id: 'L1', name: 'NDLS-DWN', from: 'NDLS', to: 'DWN', kmFrom: 0, kmTo: 6,
    electrified: true, speedLimitKmph: 90, trackXing: 2,
    points: [[150, 108], [150, 250]],
  },
  {
    id: 'L2', name: 'DWN-MTJ', from: 'DWN', to: 'MTJ', kmFrom: 6, kmTo: 94,
    electrified: true, speedLimitKmph: 130, trackXing: 4,
    points: [[150, 250], [150, 356]],
  },
  {
    id: 'L3', name: 'MTJ-AGRA', from: 'MTJ', to: 'AGRA', kmFrom: 94, kmTo: 195,
    electrified: true, speedLimitKmph: 130, trackXing: 3,
    points: [[150, 356], [205, 402], [268, 470]],
  },
  {
    id: 'L4', name: 'AGRA-GWL', from: 'AGRA', to: 'GWL', kmFrom: 195, kmTo: 308,
    electrified: true, speedLimitKmph: 130, trackXing: 5,
    points: [[268, 470], [398, 556]],
  },
  {
    id: 'L5', name: 'GWL-JHS', from: 'GWL', to: 'JHS', kmFrom: 308, kmTo: 400,
    electrified: true, speedLimitKmph: 120, trackXing: 3,
    points: [[398, 556], [548, 556]],
  },
  {
    id: 'L6', name: 'JHS-BPL', from: 'JHS', to: 'BPL', kmFrom: 400, kmTo: 701,
    electrified: true, speedLimitKmph: 130, trackXing: 6,
    points: [[548, 556], [620, 632], [700, 632]],
  },
  {
    id: 'L7', name: 'BPL-NGP', from: 'BPL', to: 'NGP', kmFrom: 701, kmTo: 831,
    electrified: true, speedLimitKmph: 130, trackXing: 4,
    points: [[700, 632], [856, 700]],
  },
  {
    id: 'L8', name: 'NGP-BSL', from: 'NGP', to: 'BSL', kmFrom: 831, kmTo: 1418,
    electrified: true, speedLimitKmph: 110, trackXing: 7,
    points: [[856, 700], [1012, 700]],
  },
  {
    id: 'L9', name: 'BSL-UMN', from: 'BSL', to: 'UMN', kmFrom: 1418, kmTo: 2013,
    electrified: true, speedLimitKmph: 100, trackXing: 9,
    points: [[1012, 700], [1156, 640]],
  },
  {
    id: 'L10', name: 'DWN-JP', from: 'DWN', to: 'JP', kmFrom: 6, kmTo: 335,
    electrified: true, speedLimitKmph: 130, trackXing: 2,
    points: [[150, 250], [40, 356]],
  },
  {
    id: 'L11', name: 'JP-AII', from: 'JP', to: 'AII', kmFrom: 335, kmTo: 460,
    electrified: true, speedLimitKmph: 100, trackXing: 3,
    points: [[40, 356], [40, 470]],
  },
  {
    id: 'L12', name: 'MTJ-CNB', from: 'MTJ', to: 'CNB', kmFrom: 94, kmTo: 440,
    electrified: true, speedLimitKmph: 100, trackXing: 4,
    points: [[150, 356], [348, 356]],
  },
  {
    id: 'L13', name: 'CNB-PRY', from: 'CNB', to: 'PRY', kmFrom: 440, kmTo: 634,
    electrified: true, speedLimitKmph: 110, trackXing: 3,
    points: [[348, 356], [560, 356]],
  },
  {
    id: 'L14', name: 'NDLS-HNU', from: 'NDLS', to: 'HNU', kmFrom: 0, kmTo: 3,
    electrified: true, speedLimitKmph: 75, trackXing: 0,
    points: [[150, 108], [290, 42]],
  },
  {
    id: 'L15', name: 'HNU-BHL', from: 'HNU', to: 'BHL', kmFrom: 3, kmTo: 268,
    electrified: true, speedLimitKmph: 90, trackXing: 1,
    points: [[290, 42], [460, 42]],
  },
]

export const linkByCode = new Map(LINKS.map((l) => [l.name, l] as const))

export const ALL_LINKS = LINKS.filter((l) => l.speedLimitKmph > 0)

export const linkBetween = (a: string, b: string): NetworkLink | undefined =>
  LINKS.find((l) => (l.from === a && l.to === b) || (l.from === b && l.to === a))

export const sectionName = (a: string, b: string) => {
  const l = linkBetween(a, b)
  return l ? l.name : `${a}-${b}`
}

/** Linear interpolation along a polyline path at fraction t (0..1). */
export function pointOnLink(link: NetworkLink, t: number): [number, number] {
  const pts = link.points
  if (t <= 0) return [pts[0][0], pts[0][1]]
  if (t >= 1) return [pts[pts.length - 1][0], pts[pts.length - 1][1]]
  const lens: number[] = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0]
    const dy = pts[i + 1][1] - pts[i][1]
    const len = Math.hypot(dx, dy)
    lens.push(len)
    total += len
  }
  let dist = Math.min(total, Math.max(0, t * total))
  for (let i = 0; i < lens.length; i++) {
    if (dist <= lens[i]) {
      const f = lens[i] === 0 ? 0 : dist / lens[i]
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f,
      ]
    }
    dist -= lens[i]
  }
  return [pts[pts.length - 1][0], pts[pts.length - 1][1]]
}

/** Total schematic length (in data units) of a polyline link. */
export function linkSchematicLength(link: NetworkLink) {
  const pts = link.points
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
  }
  return total
}

export function destXy(link: NetworkLink): [number, number] {
  const s = stationByCode.get(link.to)
  return s ? [s.x, s.y] : [link.points[link.points.length - 1][0], link.points[link.points.length - 1][1]]
}