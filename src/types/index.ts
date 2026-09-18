/* ============================================================
 * Domain model for Railway AI Block Planner
 * These interfaces mirror the future FastAPI / PostGIS schema.
 * ============================================================ */

export type Department = 'TRACK' | 'S&T' | 'TRACTION'
export type DepartmentId = 'TMS' | 'SMMS' | 'TDMS'
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type BlockStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
export type BlockSource = 'AI' | 'MANUAL' | 'ROUTINE' | 'EMERGENCY' | 'SHADOW'
export type TaskStatus =
  | 'OPEN'
  | 'PLANNED'
  | 'PROPOSED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'EMERGENCY'

export type TrainCategory = 'PASSENGER' | 'GOODS' | 'MAIL_EXPRESS'
export type TrainType =
  | 'VANDE BHARAT'
  | 'RAJDHANI'
  | 'SHATABDI'
  | 'DURONTO'
  | 'SUPERFAST'
  | 'EXPRESS'
  | 'MAIL'
  | 'PASSENGER'
  | 'MEMU'
  | 'GOODS'
export type TrainStatus = 'RUNNING' | 'HALTED' | 'READY' | 'DELAYED'
export type TrainPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Criticality {
  score: number // 0-100
  failureProbability: number // 0-100
  operationalImpact: Severity
  safetyImpact: Severity
  overdueScore: number // 0-100
  recommendation: string
}

export interface MaintenanceTask {
  id: string // MT-2041
  code: string
  department: DepartmentId // TMS | SMMS | TDMS
  departmentLabel: Department
  assetCode: string
  assetType: string
  section: string // "NDLS-DWN"
  km: number
  description: string
  findDate: string // ISO
  dueDate: string // ISO
  lastMaintenance: string // ISO
  durationMinutes: number
  priority: Severity
  risk: Severity
  status: TaskStatus
  crewSize: number
  criticality: Criticality
  flags: string[]
}

export interface Station {
  code: string
  name: string
  km: number // on-corridor cumulative km
  platform: number
  type: 'MAJOR' | 'JUNCTION' | 'MINOR'
  onMainCorridor: boolean
  x: number // schematic layout coords
  y: number
}

export interface NetworkLink {
  id: string
  name: string // "NDLS-DWN"
  from: string
  to: string
  kmFrom: number
  kmTo: number
  electrified: boolean
  speedLimitKmph: number
  trackXing: number // level crossings
  points: Array<[number, number]> // schematic polyline
}

export type AssetType =
  | 'TRACK'
  | 'SIGNAL'
  | 'OHE'
  | 'SUBSTATION'
  | 'TURNOUT'
  | 'BRIDGE'
  | 'LEVEL_CROSSING'
export type AssetCondition = 'GOOD' | 'WARNING' | 'SERIOUS' | 'CRITICAL'

export interface RailwayAsset {
  id: string
  code: string // "SIG-NDLS-12"
  type: AssetType
  department: DepartmentId
  section: string
  km: number
  condition: AssetCondition
  criticality: number
  lastMaintenance: string
  nextDue: string
  predictedFailureRisk: number
  ageYears: number
  tgi?: number
  detail: Record<string, string | number | boolean>
  history: Array<{ date: string; value: number }>
}

export interface Train {
  id: string
  number: string // "12952"
  name: string // "MUMBAI RAJDHANI"
  type: TrainType
  category: TrainCategory
  origin: string // station code
  dest: string
  route: string[] // ordered station codes
  departTime: number // minutes
  arrivalTime: number // minutes
  delayMinutes: number
  priority: TrainPriority
  status: TrainStatus
  sectionIdx: number // current route segment index
  progress: number // 0..1 within section
  speedKmph: number
  critical: boolean
  blockAffected?: boolean
}
export interface MaintenanceBlock {
  id: string
  code: string // "ENG-BLK-07"
  department: DepartmentId
  departmentLabel: Department
  section: string
  fromKm: number
  toKm: number
  startMin: number
  endMin: number
  durationMin: number
  date: string // ISO (planning date)
  status: BlockStatus
  source: BlockSource
  taskCount: number
  trainDelayImpactMin: number
  utilizationPct: number
  tasks: string[] // task ids
  notes: string
  approvedBy?: string
}

export type ConflictType =
  | 'TRAIN_VS_MAINTENANCE'
  | 'MAINTENANCE_VS_MAINTENANCE'
  | 'RESOURCE'
  | 'TIME_WINDOW'
  | 'SAFETY_HEADWAY'
  | 'CAPACITY'

export interface BlockConflict {
  id: string
  type: ConflictType
  severity: Severity
  blockId: string
  blockCode: string
  affectedTrain?: string
  section: string
  startMin: number
  endMin: number
  departments: DepartmentId[]
  description: string
  recommendation: string
  suggestedStartMin?: number
  suggestedEndMin?: number
  status: 'OPEN' | 'RESOLVED' | 'ACKNOWLEDGED' | 'IGNORED'
  aiConfidence: number
}

export interface ShadowBlock {
  id: string
  primaryBlockId: string
  primaryDepartment: DepartmentId
  department: DepartmentId // the exploiting department
  section: string
  distanceKm: number
  startMin: number
  endMin: number
  durationMin: number
  savedTimeMin: number
  utilizationGainPct: number
  taskIds: string[]
  status: 'OPPORTUNITY' | 'ADDED' | 'DISMISSED'
  safetyCleared: boolean
}

export interface OptimizationResult {
  status: 'IDLE' | 'ANALYZING' | 'COMPLETED'
  progress: number // 0-100
  stepText: string
  analyzed: {
    tasks: number
    trains: number
    windows: number
    constraints: number
    shadowBlocks: number
  }
  metrics: {
    blockUtilizationDelta: number
    trainDelayDelta: number
    completionDelta: number
    conflictDelta: number
    criticalTasksDelta: number
    blockHoursSaved: number
    shadowBlocksUsed: number
  }
  planCode: string
}

export interface PlanComparisonMetric {
  label: string
  current: number
  optimized: number
  unit: string
  betterWhen: 'LOW' | 'HIGH'
}

export type NotificationType = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS'

export interface AppNotification {
  id: string
  type: NotificationType
  category: string
  title: string
  body: string
  createdAt: string // ISO datetime
  read: boolean
  link?: string
}

export interface User {
  id: string
  employeeId: string
  name: string
  designation: string
  zone: string
  division: string
  role: 'CRB' | 'DRM' | 'CTE' | 'CSTE' | 'CEE' | 'Controller' | 'AI Supervisor'
  email: string
  avatarColor: string
  shift: string
}

export interface AvailableWindow {
  id: string
  section: string
  fromKm: number
  toKm: number
  startMin: number
  endMin: number
  durationMin: number
  trainDensity: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
}

export interface PlanGenerationOptions {
  date: string
  division: string
  corridor: string
  horizon: 'DAY' | 'WEEK' | 'MONTH'
  mode: 'MINIMIZE_DISRUPTION' | 'MAXIMIZE_UTILIZATION' | 'BALANCED'
  departments: DepartmentId[]
}