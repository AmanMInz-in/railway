import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, CornerDownLeft, Send, Sparkles, X } from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { cn } from '@/lib/utils'
import { fmtMin, fmtMinRange, fmtDuration } from '@/lib/format'
import { asyncDelay } from '@/lib/utils'

interface ChatMsg {
  id: number
  role: 'user' | 'assistant'
  text: string
  chips?: string[]
}

const QUICK_PROMPTS = [
  'Show today’s critical maintenance',
  'Find shadow block opportunities',
  'Which blocks can be combined?',
  'Show train conflicts',
  'Why was BLK-07 scheduled?',
  'Highest priority defects',
]

async function answer(q: string): Promise<{ text: string; chips?: string[] }> {
  const s = q.toLowerCase()

  if (/(critical|highest|priority defect|critical maintenance)/.test(s)) {
    const maint = await import('@/services/maintenanceService')
    const tasks = await maint.maintenanceService.getCriticalTasks(5)
    const lines = tasks
      .map((t, i) => `${i + 1}. ${t.id} · ${t.departmentLabel} · ${t.section} KM ${t.km.toFixed(1)} — crit ${t.criticality.score}/100 (${t.criticality.failureProbability}% risk)`)
      .join('\n')
    return {
      text: `Criticality engine — ${tasks.length} tasks above threshold:\n\n${lines}\n\nSchedule: put the first two in tonight’s night blocks on ${tasks[0]?.section ?? 'their sections'}.`,
      chips: ['View maintenance intelligence', 'Generate AI plan'],
    }
  }

  if (/(shadow|combine|combined)/.test(s)) {
    const block = await import('@/services/blockService')
    const shadows = await block.blockService.getShadowBlocks()
    return {
      text: `Found ${shadows.length} shadow opportunities riding on ${new Set(shadows.map((x) => x.primaryBlockId)).size} primary blocks.\n\nTop 3:\n${shadows.slice(0, 3).map((x) => `• ${x.department} work on ${x.section} — saves ~${x.savedTimeMin} min, +${x.utilizationGainPct}% utilization`).join('\n')}\n\nCombining these frees ~${shadows.reduce((a, x) => a + x.savedTimeMin, 0)} minutes of separate outage time.`,
      chips: ['Open shadow blocks', 'Open block planner'],
    }
  }

  if (/(conflict|clash|overlap)/.test(s)) {
    const block = await import('@/services/blockService')
    const conflicts = await block.blockService.getConflicts()
    const open = conflicts.filter((c) => c.status === 'OPEN')
    return {
      text: `${open.length} open conflicts reported. Most severe:\n${open.slice(0, 4).map((c) => `• ${c.blockCode} vs ${c.affectedTrain ?? c.departments.join('/')} on ${c.section} @ ${fmtMin(c.startMin)} — ${c.severity}`).join('\n')}\n\nAI suggests: ${open[0]?.recommendation ?? '—'}`,
      chips: ['Open conflict center'],
    }
  }

  if (/why|reason|scheduled/.test(s)) {
    const block = await import('@/services/blockService')
    const b = await block.blockService.getBlockById('BLK-07')
    return {
      text: `BLK-07 was scheduled because:\n\n• 3 track tasks on ${b?.section ?? 'JHS-BPL'} overdue — top task criticality 91/100\n• Night window 00:00–02:30 had no COA movements\n• Tamping machine TM-26 parked at JHS yard (B shift crew)\n• SMMS outage relocated to avoid overlap\n\nRecommendation: keep it, and ride the SMMS relay work as a shadow task.`,
      chips: ['Open block planning', 'Approve BLK-07'],
    }
  }

  if (/blocks? today|today.*block/.test(s)) {
    const block = await import('@/services/blockService')
    const blocks = await block.blockService.getBlocks()
    const active = blocks.filter((b) => b.status === 'ACTIVE').length
    return {
      text: `Today’s tactical plan has ${blocks.length} blocks (${active} active now):\n${blocks.slice(0, 6).map((b) => `• ${b.code} ${b.departmentLabel} on ${b.section} ${fmtMinRange(b.startMin, b.endMin)} (${b.durationMin} min)`).join('\n')}`,
      chips: ['Open block planner', 'Master control graph'],
    }
  }

  if (/(train|delay|running)/.test(s)) {
    const tr = await import('@/services/trainService')
    const stats = await tr.trainService.getLiveStats()
    const trains = await tr.trainService.getTrains()
    const worst = trains.reduce((a, b) => (b.delayMinutes > a.delayMinutes ? b : a), trains[0])
    return {
      text: `${stats.running} trains on division · ${stats.delayed} delayed > 15 min · ${stats.highPriority} high-priority.\n\nWorst delay: +${worst.delayMinutes} min on ${worst.number} (${worst.name}). 12952 MUMBAI RAJDHANI is +2 min holding on DWN-MTJ.`,
      chips: ['Open live network'],
    }
  }

  if (/window|capacity|density/.test(s)) {
    const block = await import('@/services/blockService')
    const wins = await block.blockService.getAvailableWindows()
    return {
      text: `Engine computed ${wins.length} feasible maintenance windows. ${wins.filter((w) => w.trainDensity === 'LOW').length} are low-density — best for long blocks. Longest: ${wins[0]?.section ?? '—'} ${fmtDuration(wins[0]?.durationMin ?? 0)}.`,
      chips: ['Open block planner'],
    }
  }

  if (/forecast|risk|prediction/.test(s)) {
    return {
      text: 'Failure-risk model v4.2 projects 3 high-risk zones this week: KM 244 AGRA-GWL (TGI 92), KM 908 NGP-BSL (OHE arcing), KM 44 DWN-MTJ (bonding). All three are already flagged in the plan.',
      chips: ['View maintenance intelligence'],
    }
  }

  return {
    text: 'I am RailAI — your block-planning co-pilot. Ask me things like:\n\n• “Show today’s critical maintenance”\n• “Which blocks can be combined?”\n• “Why was this block scheduled?”\n• “Which train conflicts with this maintenance?”\n• “Find shadow block opportunities”\n• “Show me the highest priority defects”',
    chips: QUICK_PROMPTS.slice(0, 4),
  }
}
export function AIAssistant() {
  const { assistantOpen, setAssistantOpen } = useApp()
  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    {
      id: 1,
      role: 'assistant',
      text: 'Operations console ready. Ask me about today’s blocks, critical defects, conflicts or shadow opportunities.',
      chips: QUICK_PROMPTS.slice(0, 3),
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const seq = useRef(2)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const send = async (text: string) => {
    if (!text.trim() || thinking) return
    const userMsg: ChatMsg = { id: seq.current++, role: 'user', text }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setThinking(true)
    await asyncDelay(500 + Math.random() * 500)
    const { text: ans, chips } = await answer(text)
    setMessages((m) => [...m, { id: seq.current++, role: 'assistant', text: ans, chips }])
    setThinking(false)
  }

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'fixed bottom-5 left-5 z-40 flex size-11 items-center justify-center rounded-full border shadow-panel transition-colors',
          assistantOpen
            ? 'border-signal-cyan/60 bg-signal-cyan/20 text-signal-cyan'
            : 'border-signal-cyan/40 bg-panel-raised text-signal-cyan hover:bg-panel-hover',
        )}
        onClick={() => setAssistantOpen(!assistantOpen)}
        aria-label="Toggle RailAI Assistant"
      >
        {assistantOpen ? <X className="size-5" /> : <Bot className="size-5" />}
        {!assistantOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-cyan opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-signal-cyan" />
          </span>
        )}
      </motion.button>
<AnimatePresence>
        {assistantOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-5 z-40 flex h-[520px] max-h-[70vh] w-[360px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-lg border border-signal-cyan/25 bg-panel shadow-panel"
            role="dialog"
            aria-label="RailAI Assistant"
          >
            <div className="flex items-center gap-2 border-b border-line bg-panel-soft px-3 py-2.5">
              <span className="flex size-7 items-center justify-center rounded bg-signal-cyan/15 text-signal-cyan">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">RailAI Assistant</p>
                <p className="text-[9px] uppercase tracking-wider text-signal-cyan">Control-center co-pilot · v2.1</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[88%] whitespace-pre-wrap rounded-md px-2.5 py-2 text-[11px] leading-relaxed',
                      m.role === 'user'
                        ? 'rounded-br-sm bg-accent/20 text-ink ring-1 ring-accent/30'
                        : 'rounded-bl-sm border border-line bg-panel-edge text-ink-dim',
                    )}
                  >
                    {m.text}
                    {m.chips && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.chips.map((c) => (
                          <button
                            key={c}
                            onClick={() => send(c)}
                            className="rounded border border-line bg-panel px-1.5 py-0.5 text-[9px] font-medium text-ink-faint transition-colors hover:border-signal-cyan/40 hover:text-signal-cyan"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex items-center gap-1.5 px-1 text-[10px] text-ink-faint">
                  <span className="flex gap-0.5">
                    <span className="size-1 animate-bounce rounded-full bg-signal-cyan [animation-delay:-0.2s]" />
                    <span className="size-1 animate-bounce rounded-full bg-signal-cyan [animation-delay:-0.1s]" />
                    <span className="size-1 animate-bounce rounded-full bg-signal-cyan" />
                  </span>
                  RailAI is querying services…
                </div>
              )}
            </div>

            <div className="border-t border-line bg-panel-soft p-2">
              <div className="flex items-center gap-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send(input)}
                  placeholder="Ask about blocks, conflicts, trains…"
                  className="h-8 flex-1 rounded-md border border-line bg-panel-edge px-2.5 text-xs text-ink placeholder:text-ink-faint focus:border-signal-cyan/50 focus:outline-none"
                  aria-label="Ask RailAI"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || thinking}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md bg-signal-cyan/20 text-signal-cyan transition-colors hover:bg-signal-cyan/30 disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
              <p className="mt-1.5 flex items-center gap-1 px-0.5 text-[9px] text-ink-muted">
                <CornerDownLeft className="size-2.5" /> Enter to send · answers use live mock data from the service layer
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}