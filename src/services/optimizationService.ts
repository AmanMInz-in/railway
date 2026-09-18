import type { OptimizationResult, PlanComparisonMetric } from '@/types'
import { asyncDelay, seededRandom } from '@/lib/utils'

/* ============================================================
 * AI Optimization Engine (mock OR-Tools / MILP + ML).
 * `startOptimization` emits progress ticks and resolves with
 * the final OptimizationResult. Swap the internals with a
 * WebSocket / task-poll to the FastAPI optimizer later.
 * ============================================================ */

const ANALYSIS_TARGETS = {
  tasks: 1284,
  trains: 342,
  windows: 87,
  constraints: 36,
  shadowBlocks: 12,
}

export const OPT_STEPS: Array<{ key: string; label: string; detail: string }> = [
  { key: 'ingest', label: 'INGESTING MAINTENANCE DATA', detail: 'TMS · SMMS · TDMS work orders merged from the central data lake' },
  { key: 'fusing', label: 'FUSING TRAIN OPERATIONS', detail: 'COA / NTES timetable universe + real-time running positions' },
  { key: 'windows', label: 'ENUMERATING BLOCK WINDOWS', detail: 'Feasible night & inter-traffic gaps with headway buffers' },
  { key: 'constraints', label: 'LOADING OPERATIONAL CONSTRAINTS', detail: 'Crew laws, machine availability, corridor capacity, safety rules' },
  { key: 'shadow', label: 'DETECTING SHADOW BLOCK GROUPS', detail: 'Cross-department compatible task clusters on shared windows' },
  { key: 'milp', label: 'SOLVING MILP OPTIMIZATION', detail: 'Objective: max utilisation · min schedule-weighted delay' },
  { key: 'verifying', label: 'VERIFYING PLAN FEASIBILITY', detail: 'Conflict-check every block against the full train universe' },
]

let runningResult: OptimizationResult | null = null

export const optimizationService = {
  getTargets() {
    return ANALYSIS_TARGETS
  },

  async startOptimization(onTick?: (r: OptimizationResult) => void): Promise<OptimizationResult> {
    const rnd = seededRandom(0xd00d)
    const r: OptimizationResult = {
      status: 'ANALYZING',
      progress: 0,
      stepText: OPT_STEPS[0].label,
      analyzed: { ...ANALYSIS_TARGETS },
      metrics: {
        blockUtilizationDelta: 0,
        trainDelayDelta: 0,
        completionDelta: 0,
        conflictDelta: 0,
        criticalTasksDelta: 0,
        blockHoursSaved: 0,
        shadowBlocksUsed: 0,
      },
      planCode: `OPT-${Date.now().toString(36).toUpperCase()}`,
    }
    const stepDur = 450 + rnd() * 260
    for (let s = 0; s < OPT_STEPS.length; s++) {
      await asyncDelay(stepDur)
      r.stepText = OPT_STEPS[s].label
      r.progress = Math.round(((s + 1) / OPT_STEPS.length) * 100)
      onTick?.({ ...r })
    }
    r.status = 'COMPLETED'
    r.progress = 100
    r.stepText = 'OPTIMAL PLAN FOUND'
    r.metrics = {
      blockUtilizationDelta: 23,
      trainDelayDelta: -18,
      completionDelta: 31,
      conflictDelta: -42,
      criticalTasksDelta: 27,
      blockHoursSaved: 127,
      shadowBlocksUsed: 11,
    }
    runningResult = r
    onTick?.({ ...r })
    return { ...r }
  },

  async buildPlan(): Promise<OptimizationResult> {
    await asyncDelay(600)
    return runningResult ?? {
      status: 'IDLE',
      progress: 0,
      stepText: 'Not started',
      analyzed: { ...ANALYSIS_TARGETS },
      metrics: { blockUtilizationDelta: 0, trainDelayDelta: 0, completionDelta: 0, conflictDelta: 0, criticalTasksDelta: 0, blockHoursSaved: 0, shadowBlocksUsed: 0 },
      planCode: 'OPT-PENDING',
    }
  },

  /** Current vs AI-optimized comparison metrics for the schedule page. */
  async comparePlans(): Promise<PlanComparisonMetric[]> {
    await asyncDelay(120)
    return [
      { label: 'Total Block Hours', current: 118, optimized: 164, unit: 'hrs', betterWhen: 'HIGH' },
      { label: 'Weighted Train Delay', current: 94, optimized: 51, unit: 'min', betterWhen: 'LOW' },
      { label: 'Maintenance Tasks Completed', current: 32, optimized: 47, unit: '', betterWhen: 'HIGH' },
      { label: 'Conflicts', current: 38, optimized: 14, unit: '', betterWhen: 'LOW' },
      { label: 'Shadow Block Utilization', current: 22, optimized: 47, unit: '%', betterWhen: 'HIGH' },
      { label: 'Critical Tasks Completed', current: 9, optimized: 19, unit: '', betterWhen: 'HIGH' },
      { label: 'Avg Block Utilization', current: 61, optimized: 84, unit: '%', betterWhen: 'HIGH' },
      { label: 'Safety Incidents (projected)', current: 2.4, optimized: 1.1, unit: '', betterWhen: 'LOW' },
    ]
  },

  /** Strategic monthly recommendations (AI). */
  async monthlyRecommendations(): Promise<string[]> {
    await asyncDelay(150)
    return [
      'Cluster deep-tamping cycles into Week 1–2 nights when JLX/BNC corridors carry < 40 trains/night.',
      'Schedule major bridge & girder works for the 02–04 Sep full-line closure the division has approved.',
      'Move SMMS interlocking renewals to shadow-ride inside engineering blocks — saves ~14 hrs of separate outages.',
      'Reserve 60% of night capacity for track machines before 31 Oct monsoon-led track-bed renewal deadline.',
      'Bulk OHE contact-wire measurement can be completed in 3 combined TDMS blocks instead of 9 small ones.',
    ]
  },
}