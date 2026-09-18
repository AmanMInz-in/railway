import { asyncDelay, seededRandom } from '@/lib/utils'

/* ============================================================
 * Reports & analytics aggregates (mock of the PostgreSQL + ML
 * BI views). All series are deterministic.
 * ============================================================ */

const MONTHS = ['FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP']

function series(seed: number, base: number, drift: number, variance: number) {
  const rnd = seededRandom(seed)
  return MONTHS.map((m, i) => ({
    month: m,
    value: Math.round(base + i * drift + (rnd() * 2 - 1) * variance),
  }))
}

const r1 = series(0x11, 42, 3.2, 6)
const r2 = series(0x22, 58, 2.4, 5)
const r3 = series(0x33, 74, -2.1, 7)
const r4 = series(0x44, 18, 1.8, 4)
const r5 = series(0x55, 26, 3, 5)
const r6 = series(0x66, 8, 1.2, 3)
const r7 = series(0x77, 33, 2, 4)

export const reportsService = {
  async getTrends() {
    await asyncDelay(100)
    return {
      maintenanceCompletion: r1,
      blockUtilization: r2,
      trainDelay: r3.map((p) => ({ month: p.month, value: Math.max(8, p.value) })),
      criticalDefects: r4,
      deptPerformance: r5,
      shadowBlockUsage: r6,
      weeklyVsMonthly: r7,
    }
  },

  async getDailySeries(days = 30) {
    await asyncDelay(80)
    const rnd = seededRandom(0x99)
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(2026, 8, 14 - (days - 1 - i))
      const blocks = Math.round(6 + rnd() * 8)
      return {
        date: d.toISOString().slice(0, 10),
        completed: Math.round(rnd() * 10 + 4),
        planned: blocks,
        delayed: Math.round(rnd() * 4),
        utilization: Math.round(58 + rnd() * 34),
      }
    })
  },

  async getDepartmentPerformance() {
    await asyncDelay(60)
    const rnd = seededRandom(0x7c)
    return [
      { dept: 'TRACK', completed: 84, target: 90, crew: 126, incidents: 2, utilization: 78 },
      { dept: 'S&T', completed: 71, target: 85, crew: 88, incidents: 3, utilization: 66 },
      { dept: 'TRACTION', completed: 66, target: 80, crew: 74, incidents: 4, utilization: 61 },
    ].map((d) => ({ ...d, trend: Math.round(-4 + rnd() * 12) }))
  },

  async getBlockHourSummary() {
    await asyncDelay(60)
    const rnd = seededRandom(0xa1)
    return {
      planned: 118,
      aiOptimized: 164,
      wasted: Math.round(14 + rnd() * 8),
      nightSharePct: 68,
      shadowSavedHrs: 19.5,
    }
  },
}