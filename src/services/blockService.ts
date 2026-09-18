import type {
  AvailableWindow,
  BlockConflict,
  DepartmentId,
  MaintenanceBlock,
  PlanGenerationOptions,
  ShadowBlock,
  Train,
} from '@/types'
import { B } from './blocksData'
import { asyncDelay } from '@/lib/utils'
import { TODAY_ISO } from '@/data/network'
import type { MaintenanceTask } from '@/types'

/* ============================================================
 * Block planning engine (mock of OR-Tools MILP planner).
 * Windows, conflicts and shadow blocks are computed from the
 * live train data so the UI reacts to real state.
 * ============================================================ */

export const DEPT_COLOR: Record<DepartmentId, string> = {
  TMS: '#2AC76F',
  SMMS: '#F2B53D',
  TDMS: '#9B7BFF',
}

export const DEPT_LABEL_FULL: Record<DepartmentId, string> = {
  TMS: 'TRACK / ENGINEERING',
  SMMS: 'SIGNAL & TELECOM',
  TDMS: 'TRACTION / OHE',
}

let blocks: MaintenanceBlock[] = [...B]
let generatedPlan: MaintenanceBlock[] = []
let generatedConflicts: BlockConflict[] = []
let shadowCache: ShadowBlock[] = []
let blocksConflicts: BlockConflict[] = []
export const blockService = {
  async getBlocks(date = TODAY_ISO): Promise<MaintenanceBlock[]> {
    await asyncDelay(70)
    const plan = generatedPlan.length ? generatedPlan : blocks
    return plan.filter((b) => b.date === date).map((b) => ({ ...b }))
  },

  async getBlockById(id: string): Promise<MaintenanceBlock | undefined> {
    await asyncDelay(40)
    const source = generatedPlan.length ? generatedPlan : blocks
    const found = source.find((b) => b.id === id || b.code === id)
    return found ? { ...found } : undefined
  },

  async updateBlock(updated: MaintenanceBlock): Promise<MaintenanceBlock> {
    await asyncDelay(30)
    const source = generatedPlan.length ? generatedPlan : blocks
    const idx = source.findIndex((b) => b.id === updated.id)
    if (idx >= 0) source[idx] = { ...updated }
    else source.push({ ...updated })
    return { ...updated }
  },

  /** Replace the tactical plan with an AI-generated one. */
  async applyPlan(plan: MaintenanceBlock[], conflicts: BlockConflict[]) {
    await asyncDelay(80)
    blocks = plan.map((b) => ({ ...b }))
    generatedPlan = []
    generatedConflicts = []
    return blocks
  },

  async getConflicts(scope?: { blockId?: string }): Promise<BlockConflict[]> {
    await asyncDelay(80)
    const mod = await requireTrainService()
    const trains = await mod.getTrains()
    const confs = generatedPlan.length ? generatedConflicts : detectConflicts(blocks, trains)
    if (scope?.blockId) return confs.filter((c) => c.blockId === scope.blockId)
    return confs
  },

  async resolveConflict(id: string, action: 'accept' | 'ignore' | 'acknowledge'): Promise<void> {
    await asyncDelay(60)
    const confs = generatedPlan.length ? generatedConflicts : blocksConflicts
    const c = confs.find((x) => x.id === id)
    if (!c) return
    if (action === 'accept') {
      c.status = 'RESOLVED'
      if (c.suggestedStartMin !== undefined && c.suggestedStartMin !== null) {
        const b = (generatedPlan.length ? generatedPlan : blocks).find((x) => x.id === c.blockId)
        if (b) {
          b.startMin = c.suggestedStartMin
          b.endMin = c.suggestedEndMin ?? c.suggestedStartMin + b.durationMin
          b.trainDelayImpactMin = Math.max(0, b.trainDelayImpactMin - Math.abs(c.suggestedStartMin - ((c.suggestedEndMin ?? 0) - b.durationMin)))
        }
      }
    } else if (action === 'ignore') {
      c.status = 'IGNORED'
    } else {
      c.status = 'ACKNOWLEDGED'
    }
  },

  /** Manually shift a block (used by drag operations). */
  async moveBlock(id: string, newStart: number, newEnd: number) {
    await asyncDelay(20)
    const source = generatedPlan.length ? generatedPlan : blocks
    const b = source.find((x) => x.id === id)
    if (!b) return
    b.startMin = Math.max(0, Math.round(newStart))
    b.endMin = Math.max(b.startMin + 30, Math.round(newEnd))
    b.durationMin = b.endMin - b.startMin
  },

  async getShadowBlocks(): Promise<ShadowBlock[]> {
    await asyncDelay(90)
    const source = generatedPlan.length ? generatedPlan : blocks
    shadowCache = collectShadowBlocks(source)
    return shadowCache
  },

  async addShadowBlock(shadowId: string): Promise<void> {
    await asyncDelay(70)
    shadowCache = shadowCache.map((s) => (s.id === shadowId ? { ...s, status: 'ADDED' as const } : s))
  },

  async getAvailableWindows(): Promise<AvailableWindow[]> {
    await asyncDelay(90)
    const mod = await requireTrainService()
    const trains = await mod.getTrains()
    return computeWindows(trains)
  },

  async generatePlan(options: PlanGenerationOptions) {
    const maint = await requireMaintenance()
    const tasks = await maint.getDueSoon(30)
    const mod = await requireTrainService()
    const trains = await mod.getTrains()
    const windows = computeWindows(trains)
    await asyncDelay(220)
    const { plan, conflicts } = buildAiPlan(tasks, windows, options, trains)
    generatedPlan = plan
    generatedConflicts = conflicts
    return { plan, conflicts }
  },

  /** Merge two compatible departmental blocks (shadow combining). */
  async combineBlocks(primaryId: string, shadowId: string) {
    await asyncDelay(90)
    const source = generatedPlan.length ? generatedPlan : blocks
    const primary = source.find((b) => b.id === primaryId)
    const shadow = source.find((b) => b.id === shadowId)
    if (!primary || !shadow) return
    primary.endMin = Math.max(primary.endMin, shadow.endMin)
    primary.durationMin = primary.endMin - primary.startMin
    primary.taskCount += shadow.taskCount
    primary.tasks = [...primary.tasks, ...shadow.tasks]
    primary.source = 'SHADOW'
    primary.utilizationPct = Math.min(100, primary.utilizationPct + 18)
    source.splice(source.indexOf(shadow), 1)
  },

  resetPlan() {
    generatedPlan = []
    generatedConflicts = []
    blocks = [...B]
  },
}

let _trainService: typeof import('./trainService').trainService | null = null
async function requireTrainService(): Promise<typeof import('./trainService').trainService> {
  if (!_trainService) {
    const mod = await import('./trainService')
    _trainService = mod.trainService
  }
  return _trainService!
}

let _maintenance: typeof import('./maintenanceService').maintenanceService | null = null
async function requireMaintenance(): Promise<typeof import('./maintenanceService').maintenanceService> {
  if (!_maintenance) {
    const mod = await import('./maintenanceService')
    _maintenance = mod.maintenanceService
  }
  return _maintenance!
}
/* ============================================================
 * Window computation — find gaps in the train timetable for
 * every line section. Simulates the MILP feasibility pass.
 * ============================================================ */
import { LINK_INFO } from './mockCommon'
import { segMinPublic } from './trainService'

function sectionNot(name: string) {
  const parts = name.split('-')
  return [`${parts[0]}-${parts[1]}`, `${parts[1]}-${parts[0]}`]
}

function trainTimesOnSection(t: Train) {
  const spans: Array<{ key: string; start: number; end: number }> = []
  let acc = t.departTime
  for (let i = 0; i < t.route.length - 1; i++) {
    const a = t.route[i]
    const b = t.route[i + 1]
    const dur = segMinPublic(a, b)
    spans.push({ key: `${a}-${b}`, start: acc, end: acc + dur })
    acc += dur
  }
  return spans
}

export function computeWindows(trains: Train[]): AvailableWindow[] {
  const windows: AvailableWindow[] = []
  const MIN_LEN = 60

  for (const info of LINK_INFO) {
    const occupied: Array<[number, number]> = []
    for (const t of trains) {
      for (const span of trainTimesOnSection(t)) {
        if (sectionNot(info.section).includes(span.key)) {
          occupied.push([span.start - 20, span.end + 20])
        }
      }
    }
    occupied.sort((a, b) => a[0] - b[0])
    const merged: Array<[number, number]> = []
    for (const o of occupied) {
      const last = merged[merged.length - 1]
      if (last && o[0] <= last[1] + 10) last[1] = Math.max(last[1], o[1])
      else merged.push([Math.max(0, o[0]), Math.min(1439, o[1])])
    }
    let prevEnd = 0
    const gaps: Array<[number, number]> = []
    for (const [s, e] of merged) {
      if (s - prevEnd >= MIN_LEN) gaps.push([prevEnd, s])
      prevEnd = Math.max(prevEnd, e)
    }
    if (1439 - prevEnd >= MIN_LEN) gaps.push([prevEnd, 1439])

    gaps.forEach(([gs, ge], gi) => {
      if (ge - gs < MIN_LEN) return
      const durationMin = ge - gs
      const density: AvailableWindow['trainDensity'] =
        durationMin > 180 ? 'LOW' : durationMin > 90 ? 'MEDIUM' : 'HIGH'
      windows.push({
        id: `WIN-${info.section}-${gi}`,
        section: info.section,
        fromKm: info.kmMin + 2,
        toKm: info.kmMax - 2,
        startMin: gs,
        endMin: ge,
        durationMin,
        trainDensity: density,
        reason:
          gs === 0
            ? 'Night block — no traffic scheduled'
            : `Gap between consecutive train passages on ${info.section}`,
      })
    })
  }
  for (const info of LINK_INFO) {
    if (info.section === 'JHS-BPL' || info.section === 'AGRA-GWL') {
      const exists = windows.some((w) => w.section === info.section && w.startMin < 180)
      if (!exists) {
        windows.push({
          id: `WIN-N-${info.section}`,
          section: info.section,
          fromKm: info.kmMin,
          toKm: info.kmMax,
          startMin: 0,
          endMin: 180,
          durationMin: 180,
          trainDensity: 'LOW',
          reason: 'Statutory night block window (00:00–03:00)',
        })
      }
    }
  }
  return windows.sort((a, b) => a.startMin - b.startMin)
}
/* ============================================================
 * Conflict detection — train vs maintenance, overlap, resource,
 * time window, safety headway and capacity checks.
 * ============================================================ */

function determineSeverity(c: {
  tHigh: boolean
  delay: number
  overlapMin: number
  emergency: boolean
}): BlockConflict['severity'] {
  if (c.tHigh && c.overlapMin > 60) return 'CRITICAL'
  if (c.tHigh || c.emergency) return 'HIGH'
  if (c.overlapMin > 120 || c.delay > 20) return 'MEDIUM'
  return 'LOW'
}

let conflictSeq = 5000

export function detectConflicts(bs: MaintenanceBlock[], trains: Train[]): BlockConflict[] {
  const out: BlockConflict[] = []
  conflictSeq = 5000

  const push = (
    c: Omit<BlockConflict, 'id' | 'status' | 'aiConfidence'> & { aiConfidence?: number },
  ) => {
    out.push({
      id: `CF-${conflictSeq++}`,
      status: 'OPEN',
      aiConfidence: c.aiConfidence ?? 82 + Math.floor(Math.random() * 15),
      ...c,
    } as BlockConflict)
  }

  for (const b of bs) {
    for (const t of trains) {
      for (const span of trainTimesOnSection(t)) {
        if (!sectionNot(b.section).includes(span.key)) continue
        const overlapStart = Math.max(b.startMin, span.start)
        const overlapEnd = Math.min(b.endMin, span.end)
        const overlapMin = overlapEnd - overlapStart
        if (overlapMin < 10) continue
        const tHigh = t.priority === 'HIGH' || t.critical
        const severity = determineSeverity({ tHigh, delay: t.delayMinutes, overlapMin, emergency: b.source === 'EMERGENCY' })
        const delayStr = t.delayMinutes > 0 ? ` (+${t.delayMinutes} min delay)` : ''
        const suggestedStart = tHigh ? b.endMin : undefined
        push({
          type: 'TRAIN_VS_MAINTENANCE',
          severity,
          blockId: b.id,
          blockCode: b.code,
          affectedTrain: t.number,
          section: b.section,
          startMin: Math.max(b.startMin, span.start),
          endMin: Math.min(b.endMin, span.end),
          departments: [b.department],
          description: `${b.departmentLabel} block overlaps with ${t.name} (${t.number})${delayStr} on ${b.section}.`,
          recommendation:
            suggestedStart !== undefined
              ? `Move maintenance from ${fmtMin0(b.startMin)} → ${fmtMin0(suggestedStart)}, after ${t.number} clears the section`
              : `Clamp block duration by ${overlapMin} min and re-run optimizer`,
          suggestedStartMin: suggestedStart,
          suggestedEndMin: suggestedStart !== undefined ? suggestedStart + b.durationMin : undefined,
        })
      }
    }
  }

  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i]
      const c = bs[j]
      if (a.section !== c.section) continue
      const os = Math.max(a.startMin, c.startMin)
      const oe = Math.min(a.endMin, c.endMin)
      if (os >= oe) continue
      const depts = [...new Set([a.department, c.department])] as DepartmentId[]
      push({
        type: 'MAINTENANCE_VS_MAINTENANCE',
        severity: depts.length > 1 ? 'HIGH' : 'MEDIUM',
        blockId: a.id,
        blockCode: `${a.code} x ${c.code}`,
        section: a.section,
        startMin: os,
        endMin: oe,
        departments: depts,
        description: `Independent ${a.departmentLabel}/${c.departmentLabel} outages overlap on ${a.section}.`,
        recommendation: `Combine into one coordinated (shadow) block on ${a.section}.`,
        aiConfidence: 90,
      })
    }
  }

  const perTime: Array<[MaintenanceBlock, number, number]> = bs.map((b) => [b, b.startMin, b.endMin] as const)
  perTime.sort((x, y) => x[1] - y[1])
  for (let i = 0; i < perTime.length; i++) {
    for (let j = i + 1; j < perTime.length; j++) {
      const [a, , ae] = perTime[i]
      const [b, bs2, be] = perTime[j]
      if (bs2 >= ae) break
      if (a.section !== b.section && ae - bs2 > 90) {
        push({
          type: 'CAPACITY',
          severity: 'LOW',
          blockId: a.id,
          blockCode: `${a.code} + ${b.code}`,
          section: a.section,
          startMin: bs2,
          endMin: be,
          departments: [...new Set([a.department, b.department])] as DepartmentId[],
          description: 'Two corridor-wide outages simultaneously reduce corridor capacity.',
          recommendation: 'Stagger start times by at least 60 minutes.',
        })
        break
      }
    }
  }
  return out
}

function fmtMin0(m: number) {
  const h = Math.floor(m / 60) % 24
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}
/* ============================================================
 * collectShadowBlocks — find departmental tasks that can ride
 * inside an existing primary block window (same section zone).
 * ============================================================ */

export function collectShadowBlocks(bs: MaintenanceBlock[]): ShadowBlock[] {
  const out: ShadowBlock[] = []
  let seq = 0
  for (const primary of bs) {
    if (primary.durationMin < 60) continue
    for (const other of bs) {
      if (other.id === primary.id || other.section !== primary.section) continue
      if (other.department === primary.department) continue
      const overlap = Math.min(primary.endMin, other.endMin) - Math.max(primary.startMin, other.startMin)
      if (overlap < 60) continue
      const distanceKm = Math.abs(primary.fromKm - other.fromKm) || Math.round(Math.random() * 4 + 0.4)
      seq++
      out.push({
        id: `SH-${seq}`,
        primaryBlockId: primary.id,
        primaryDepartment: primary.department,
        department: other.department,
        section: primary.section,
        distanceKm: Math.round(distanceKm * 10) / 10,
        startMin: primary.startMin,
        endMin: primary.endMin,
        durationMin: primary.durationMin,
        savedTimeMin: Math.round(primary.durationMin * 0.8),
        utilizationGainPct: Math.round(12 + Math.random() * 16),
        taskIds: other.tasks.slice(0, 1),
        status: 'OPPORTUNITY',
        safetyCleared: distanceKm < 3,
      })
    }
  }
  const seen = new Set<string>()
  return out.filter((s) => {
    const k = `${s.primaryBlockId}-${s.department}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/* ============================================================
 * buildAiPlan — greedy heuristic planner:
 * sort tasks by criticality, assign to earliest window in their
 * section, group by department, merge compatible depts as
 * shadow blocks, then run the conflict pass.
 * ============================================================ */

let planSeq = 900

function buildAiPlan(
  tasks: MaintenanceTask[],
  windows: AvailableWindow[],
  options: PlanGenerationOptions,
  trains: Train[],
) {
  const plan: MaintenanceBlock[] = []
  const byDept = (d: DepartmentId) =>
    tasks.filter((t) => t.department === d).sort((a, b) => b.criticality.score - a.criticality.score)
  const sections = [...new Set(tasks.map((t) => t.section))]
  for (const section of sections) {
    const win = windows.filter((w) => w.section === section && w.durationMin >= 90)
    if (!win.length) continue
    for (const dept of ['TMS', 'SMMS', 'TDMS'] as DepartmentId[]) {
      if (options.departments.length && !options.departments.includes(dept)) continue
      const group = byDept(dept).filter((t) => t.section === section)
      if (!group.length) continue
      const window =
        options.mode === 'MINIMIZE_DISRUPTION'
          ? win[win.length - 1]
          : options.mode === 'MAXIMIZE_UTILIZATION'
            ? win.find((w) => w.durationMin >= 180) ?? win[0]
            : win[Math.floor(win.length / 2)]
      const totalDur = group.reduce((s, t) => s + Math.min(t.durationMinutes, 150), 0)
      const startMin = window.startMin + Math.floor(Math.random() * 15)
      const endMin = Math.min(window.endMin, startMin + Math.min(240, totalDur))
      if (endMin - startMin < 60) continue
      const code = `${dept === 'TMS' ? 'ENG' : dept === 'SMMS' ? 'SAT' : 'TRD'}-${String(planSeq++).slice(2)}`
      plan.push({
        id: `BLK-A${planSeq}`,
        code,
        department: dept,
        departmentLabel: dept === 'TMS' ? 'TRACK' : dept === 'SMMS' ? 'S&T' : 'TRACTION',
        section,
        fromKm: group[0].km - 2,
        toKm: group[group.length - 1].km + 2,
        startMin,
        endMin,
        durationMin: endMin - startMin,
        date: options.date,
        status: 'PROPOSED',
        source: 'AI',
        taskCount: group.length,
        trainDelayImpactMin: Math.round((endMin - startMin) / 20),
        utilizationPct: Math.round(62 + Math.random() * 26),
        tasks: group.map((t) => t.id),
        notes: `AI plan: ${group.length} tasks grouped on ${section}`,
      })
    }
  }
  const conflicts = detectConflicts(plan, trains)
  return { plan, conflicts }
}