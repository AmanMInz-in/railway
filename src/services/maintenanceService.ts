import type {
  Criticality,
  DepartmentId,
  MaintenanceTask,
  RailwayAsset,
  Severity,
  TaskStatus,
} from '@/types'
import { LINK_INFO, randomSeverity, sectionKm } from './mockCommon'
import { seededRandom, inRange } from '@/lib/utils'
import { addDays, TODAY_ISO } from '@/data/network'
import { asyncDelay } from '@/lib/utils'
/* ============================================================
 * TMS / SMMS / TDMS maintenance intelligence.
 * IMPORTANT: seeded data — deterministic across reloads.
 * ============================================================ */

export const DEPARTMENT_LABEL: Record<DepartmentId, 'TRACK' | 'S&T' | 'TRACTION'> = {
  TMS: 'TRACK',
  SMMS: 'S&T',
  TDMS: 'TRACTION',
}

const TASKS_PER_DEPT = 34

interface TaskTemplate {
  assetType: string
  descriptions: string[]
  flags: string[]
  durationMin: [number, number]
  crewSize: [number, number]
}

const TEMPLATES: Record<DepartmentId, TaskTemplate[]> = {
  TMS: [
    { assetType: 'TRACK', descriptions: ['Track geometry defect on curve', 'Corrugation / rail surface irregularity', 'Deep-seated geometry deterioration', 'Dip in longitudinal profile'], flags: ['TGI > 70'], durationMin: [90, 180], crewSize: [8, 16] },
    { assetType: 'TURNOUT', descriptions: ['Turnout dissection overdue', 'Switch rail wear beyond limit', 'Locking & detection defects'], flags: ['SWITCH WEAR', 'GAP > 4mm'], durationMin: [120, 240], crewSize: [6, 12] },
    { assetType: 'TRACK', descriptions: ['Rail fracture suspected', 'Broken fishplate at joint', 'Weld joint defect'], flags: ['URGENT', 'SPEED RESTRICTION 30'], durationMin: [60, 150], crewSize: [10, 18] },
    { assetType: 'LEVEL_CROSSING', descriptions: ['Level crossing surface renew', 'Check rail renewal at LC'], flags: ['LC-48'], durationMin: [90, 150], crewSize: [10, 14] },
  ],
  SMMS: [
    { assetType: 'SIGNAL', descriptions: ['Signal relay contact clean-up', 'Track circuit bonding renewal', 'IB signal lamp renew'], flags: ['RELAY CYCLE', 'TC-41'], durationMin: [60, 120], crewSize: [4, 8] },
    { assetType: 'SIGNAL', descriptions: ['Point machine overhaul', 'Point operating rod adjustment', 'Detection circuit testing'], flags: ['POINT MACHINE', 'CYCLE > 70k'], durationMin: [120, 210], crewSize: [5, 9] },
    { assetType: 'SIGNAL', descriptions: ['Cable joint resleaving', 'Signalling cable replacement', 'Earth fault location'], flags: ['CABLE', 'OPTI'], durationMin: [150, 300], crewSize: [6, 12] },
    { assetType: 'SIGNAL', descriptions: ['Interlocking logic column test', 'Route relay test', 'Panel operation drill'], flags: ['INTERLOCKING TEST'], durationMin: [90, 150], crewSize: [4, 6] },
  ],
  TDMS: [
    { assetType: 'OHE', descriptions: ['OHE stagger correction at neutral section', 'Contact wire wear measurement', 'Overlap span adjustment'], flags: ['STAGGER > 250mm', 'WEAR 28%'], durationMin: [90, 180], crewSize: [6, 12] },
    { assetType: 'OHE', descriptions: ['Pantograph bump detected — OHE profile repair', 'Registration arm renewal', 'Illegal short-circuit clamp removal'], flags: ['IRC', 'PANT BUMP'], durationMin: [60, 120], crewSize: [6, 10] },
    { assetType: 'SUBSTATION', descriptions: ['Traction substation bay maintenance', 'Circuit breaker oil top-up', 'Transformer tapping change'], flags: ['TSS-26', 'CB CYCLE'], durationMin: [120, 240], crewSize: [4, 8] },
    { assetType: 'OHE', descriptions: ['Section insulator renewal', 'Anti-creep anchor adjustment', 'Tension length balancing'], flags: ['SECTION INSULATOR'], durationMin: [100, 200], crewSize: [6, 10] },
  ],
}

function buildCriticality(seed: number, priority: Severity, overdueFactor: number): Criticality {
  const rnd = seededRandom(seed)
  const base = priority === 'CRITICAL' ? 82 : priority === 'HIGH' ? 66 : priority === 'MEDIUM' ? 44 : 26
  const score = inRange(12, 98, Math.round(base + (rnd() * 16 - 6) + overdueFactor * 8))
  const failureProbability = inRange(8, 96, Math.round(score * 0.62 + rnd() * 30))
  const safetyImpact: Severity =
    score > 78 ? 'CRITICAL' : score > 60 ? 'HIGH' : score > 38 ? 'MEDIUM' : 'LOW'
  const operationalImpact: Severity =
    priority === 'CRITICAL' || score > 70 ? 'HIGH' : score > 45 ? 'MEDIUM' : 'LOW'
  const overdueScore = inRange(5, 100, Math.round(overdueFactor * 100))
  const recommendation =
    score >= 80
      ? 'Schedule within next available maintenance window'
      : score >= 60
        ? 'Plan in this week’s block if capacity permits'
        : 'Monitor; combine with routine works'
  return { score, failureProbability, operationalImpact, safetyImpact, overdueScore, recommendation }
}

let taskSeq = 1000
function genTasks(): MaintenanceTask[] {
  const tasks: MaintenanceTask[] = []
  const depts: DepartmentId[] = ['TMS', 'SMMS', 'TDMS']
  depts.forEach((dept, dIdx) => {
    const rnd = seededRandom(0x1f0 + dIdx)
    const templates = TEMPLATES[dept]
    for (let i = 0; i < TASKS_PER_DEPT; i++) {
      const tpl = templates[Math.floor(rnd() * templates.length)]
      const section = LINK_INFO[Math.floor(rnd() * LINK_INFO.length)].section
      const [kmMin, kmMax] = sectionKm(section)
      const km = Math.round((kmMin + rnd() * (kmMax - kmMin)) * 10) / 10
      const priority = randomSeverity(rnd) as Severity
      const negShift = priority === 'CRITICAL' ? 25 : priority === 'HIGH' ? 10 : 2
      const dueInDays = Math.round(inRange(0, 60, rnd() * 60 - negShift))
      const dueDate = addDays(TODAY_ISO, dueInDays)
      const lastAgo = 20 + Math.floor(rnd() * 150)
      const assetCode =
        dept === 'TMS'
          ? `TRK-${section.split('-')[0]}-${Math.floor(km)}`
          : dept === 'SMMS'
            ? `SIG-${section.split('-')[0]}-${Math.floor(km)}`
            : `OHE-${section.split('-')[0]}-${Math.floor(km)}`
      const id = `MT-${taskSeq++}`
      const code = `${dept === 'TMS' ? 'T' : dept === 'SMMS' ? 'S' : 'O'}-${id.slice(3)}`
      const durationMinutes = Math.round(tpl.durationMin[0] + rnd() * (tpl.durationMin[1] - tpl.durationMin[0]))
      const overdueFactor =
        dueInDays < -5 ? 1 : dueInDays < 0 ? 0.8 : dueInDays < 7 ? 0.5 : dueInDays < 21 ? 0.2 : 0
      const status: TaskStatus =
        dueInDays < -10 ? 'OVERDUE' : priority === 'CRITICAL' ? 'EMERGENCY' : rnd() < 0.28 ? 'OPEN' : rnd() < 0.5 ? 'PLANNED' : 'PROPOSED'
      const criticality = buildCriticality(id.charCodeAt(4) + i + dIdx * 999, priority, overdueFactor)
      tasks.push({
        id,
        code,
        department: dept,
        departmentLabel: DEPARTMENT_LABEL[dept],
        assetCode,
        assetType: tpl.assetType,
        section,
        km,
        description: tpl.descriptions[Math.floor(rnd() * tpl.descriptions.length)],
        findDate: addDays(TODAY_ISO, -Math.floor(rnd() * 40) - (status === 'EMERGENCY' ? 2 : 0)),
        dueDate,
        lastMaintenance: addDays(TODAY_ISO, -lastAgo),
        durationMinutes,
        priority,
        risk: criticality.safetyImpact === 'CRITICAL' ? 'CRITICAL' : criticality.safetyImpact === 'HIGH' ? 'HIGH' : criticality.score > 40 ? 'MEDIUM' : 'LOW',
        status,
        crewSize: Math.round(tpl.crewSize[0] + rnd() * (tpl.crewSize[1] - tpl.crewSize[0])),
        criticality,
        flags: [...tpl.flags],
      })
    }
  })
  return tasks
}

const TASKS = genTasks()
let assetSeq = 1

function genAssets(): RailwayAsset[] {
  const assets: RailwayAsset[] = []
  const rnd = seededRandom(0xbeef)
  for (let i = 0; i < 42; i++) {
    const section = LINK_INFO[Math.floor(rnd() * LINK_INFO.length)].section
    const [kmMin, kmMax] = sectionKm(section)
    const km = Math.round((kmMin + rnd() * (kmMax - kmMin)) * 10) / 10
    const typeSeed = rnd()
    const type =
      typeSeed < 0.34 ? 'TRACK' : typeSeed < 0.55 ? 'SIGNAL' : typeSeed < 0.72 ? 'OHE' : typeSeed < 0.84 ? 'TURNOUT' : typeSeed < 0.92 ? 'SUBSTATION' : 'LEVEL_CROSSING'
    const dept: DepartmentId = type === 'SIGNAL' ? 'SMMS' : type === 'OHE' || type === 'SUBSTATION' ? 'TDMS' : 'TMS'
    const code = `${type === 'OHE' || type === 'SUBSTATION' ? 'OHE' : type === 'SIGNAL' ? 'SIG' : type === 'TURNOUT' ? 'TN' : type === 'LEVEL_CROSSING' ? 'LC' : 'TRK'}-${section.split('-')[0]}-${Math.floor(km)}`
    const condition: RailwayAsset['condition'] = rnd() < 0.1 ? 'CRITICAL' : rnd() < 0.3 ? 'SERIOUS' : rnd() < 0.65 ? 'WARNING' : 'GOOD'
    const riskOf =
      condition === 'CRITICAL' ? 78 + rnd() * 18 : condition === 'SERIOUS' ? 55 + rnd() * 22 : condition === 'WARNING' ? 25 + rnd() * 28 : 5 + rnd() * 18
    const lastMaintenance = addDays(TODAY_ISO, -Math.floor(rnd() * 200 - 10))
    const nextDue = addDays(TODAY_ISO, Math.floor(rnd() * 60) - (condition === 'CRITICAL' ? 30 : 10))
    const criticality = Math.round(inRange(5, 99, riskOf * 0.85 + rnd() * 15))
    assets.push({
      id: `AST-${assetSeq++}`,
      code,
      type: type as RailwayAsset['type'],
      department: dept,
      section,
      km,
      condition,
      criticality,
      lastMaintenance,
      nextDue,
      predictedFailureRisk: Math.round(riskOf),
      ageYears: Math.round(inRange(2, 34, rnd() * 32)),
      tgi: type === 'TRACK' || type === 'TURNOUT' ? Math.round(inRange(32, 96, rnd() * 64 + 32)) : undefined,
      detail: { 'Speed limit': rnd() > 0.5 ? 130 : 100 },
      history: Array.from({ length: 8 }, (_, h) => ({
        date: addDays(TODAY_ISO, -(8 - h) * 30),
        value: Math.round(inRange(10, 96, (condition === 'CRITICAL' ? 72 : condition === 'SERIOUS' ? 55 : 30) + Math.sin(h) * 14 + rnd() * 10)),
      })),
    })
  }
  return assets
}

const ASSETS = genAssets()

export type TaskFilters = Partial<{
  dept: DepartmentId
  priority: Severity
  risk: Severity
  status: TaskStatus
  section: string
  km: number
  maxDueInDays: number
  query: string
}>

export const maintenanceService = {
  async getTasks(filters: TaskFilters = {}): Promise<MaintenanceTask[]> {
    await asyncDelay(80)
    return TASKS.filter((t) => {
      if (filters.dept && t.department !== filters.dept) return false
      if (filters.priority && t.priority !== filters.priority) return false
      if (filters.risk && t.risk !== filters.risk) return false
      if (filters.section && t.section !== filters.section) return false
      if (filters.status && t.status !== filters.status) return false
      if (filters.query && !(t.id + t.code + t.assetCode + t.section + t.description).toLowerCase().includes(filters.query.toLowerCase())) return false
      if (filters.maxDueInDays !== undefined) {
        const days = Math.round((new Date(t.dueDate).getTime() - new Date(TODAY_ISO).getTime()) / 86400000)
        if (days > filters.maxDueInDays) return false
      }
      return true
    })
  },

  async getTaskById(id: string): Promise<MaintenanceTask | undefined> {
    await asyncDelay(40)
    return TASKS.find((t) => t.id === id)
  },

  async getCriticalTasks(limit = 12): Promise<MaintenanceTask[]> {
    await asyncDelay(60)
    return TASKS.filter((t) => t.criticality.score >= 70 || t.priority === 'CRITICAL')
      .sort((a, b) => b.criticality.score - a.criticality.score)
      .slice(0, limit)
  },

  async getDueSoon(days = 7): Promise<MaintenanceTask[]> {
    await asyncDelay(60)
    const ref = new Date(TODAY_ISO).getTime()
    return TASKS.filter((t) => {
      const d = new Date(t.dueDate).getTime() - ref
      return t.status !== 'COMPLETED' && d <= days * 86400000
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  },

  async getAssets(dept?: DepartmentId): Promise<RailwayAsset[]> {
    await asyncDelay(70)
    return dept ? ASSETS.filter((a) => a.department === dept) : ASSETS
  },

  async getAssetById(id: string): Promise<RailwayAsset | undefined> {
    await asyncDelay(40)
    return ASSETS.find((a) => a.id === id || a.code === id)
  },

  async getAssetStats() {
    await asyncDelay(50)
    const depts: DepartmentId[] = ['TMS', 'SMMS', 'TDMS']
    const total = TASKS.length
    const critical = TASKS.filter((t) => t.criticality.score >= 75 || t.priority === 'CRITICAL').length
    const overdue = TASKS.filter((t) => t.status === 'OVERDUE').length
    const emergency = TASKS.filter((t) => t.status === 'EMERGENCY').length
    const avgScore = Math.round(TASKS.reduce((s, t) => s + t.criticality.score, 0) / total)
    return {
      total,
      critical,
      overdue,
      emergency,
      avgScore,
      byDept: depts.map((d) => ({
        dept: d,
        count: TASKS.filter((t) => t.department === d).length,
        critical: TASKS.filter((t) => t.department === d && t.criticality.score >= 75).length,
      })),
    }
  },
}