import type { BlockStatus, DepartmentId, Severity, TrainPriority } from '@/types'

/* Central colour/icon mapping so every surface renders consistently. */

export type Tone = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'violet' | 'cyan'

export const severityTone = (s: Severity | TrainPriority | string): Tone =>
  s === 'CRITICAL' || s === 'HIGH'
    ? s === 'CRITICAL'
      ? 'danger'
      : 'warning'
    : s === 'MEDIUM'
      ? 'accent'
      : 'default'

export const severityColor = (s: Severity | string) =>
  s === 'CRITICAL' ? '#f0506e' : s === 'HIGH' ? '#f2b53d' : s === 'MEDIUM' ? '#60a5fa' : '#6c7e9e'

export const deptColor: Record<DepartmentId, string> = {
  TMS: '#2AC76F',
  SMMS: '#F2B53D',
  TDMS: '#9B7BFF',
}

export const deptLabel: Record<DepartmentId, string> = {
  TMS: 'TRACK',
  SMMS: 'S&T',
  TDMS: 'TRACTION',
}

export const blockStatusTone = (s: BlockStatus): Tone =>
  s === 'ACTIVE' ? 'success' : s === 'COMPLETED' ? 'cyan' : s === 'CANCELLED' ? 'default' : s === 'APPROVED' ? 'violet' : 'accent'

export const conflictTypeLabel: Record<string, string> = {
  TRAIN_VS_MAINTENANCE: 'Train vs Maintenance',
  MAINTENANCE_VS_MAINTENANCE: 'Maintenance vs Maintenance',
  RESOURCE: 'Resource Conflict',
  TIME_WINDOW: 'Time Window',
  SAFETY_HEADWAY: 'Safety Headway',
  CAPACITY: 'Capacity',
}

export const taskStatusLabel: Record<string, string> = {
  OPEN: 'OPEN',
  PLANNED: 'PLANNED',
  PROPOSED: 'PROPOSED',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN PROGRESS',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
  EMERGENCY: 'EMERGENCY',
}