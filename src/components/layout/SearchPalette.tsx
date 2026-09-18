import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Command, Search, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { searchService, type SearchHit } from '@/services/searchService'
import { toast } from '@/components/ui/toast'
import { exportCsv } from '@/services/mockCommon'
import { useApp } from '@/store/AppStore'
import { cn } from '@/lib/utils'

const COMMANDS: Array<{
  label: string
  hint: string
  icon: string
  action: (nav: (p: string) => void) => void
}> = [
  { label: 'Generate AI Plan', hint: 'Run the optimization engine', icon: '⚡', action: (nav) => nav('/optimizer') },
  { label: 'Open Master Control Graph', hint: 'Full time–station chart', icon: '📈', action: (nav) => nav('/master-control-graph') },
  { label: 'View Critical Defects', hint: 'Criticality Index > 75', icon: '⚠', action: (nav) => nav('/maintenance-intelligence') },
  { label: 'Open Today’s Blocks', hint: 'Tactical timeline', icon: '🗓', action: (nav) => nav('/block-planning') },
  { label: 'Open Conflict Center', hint: 'Active conflicts', icon: '🚨', action: (nav) => nav('/conflicts') },
  { label: 'Open Shadow Blocks', hint: 'Shadow opportunities', icon: '🫥', action: (nav) => nav('/shadow-blocks') },
  {
    label: 'Export Schedule (CSV)',
    hint: 'Download current plan',
    icon: '⬇',
    action: () =>
      exportCsv(
        'block-schedule.csv',
        ['Block', 'Dept', 'Section', 'Start', 'End', 'Duration'],
        [['BLK-01', 'TMS', 'DWN-MTJ', '00:00', '02:00', '120']],
      ),
  },
  { label: 'Open Reports & Analytics', hint: 'BI dashboards', icon: '📊', action: (nav) => nav('/reports') },
  { label: 'Open Monthly Planner', hint: 'Strategic plan', icon: '🗺', action: (nav) => nav('/monthly-planning') },
]

const KIND_META: Record<string, { color: string; label: string }> = {
  TRAIN: { color: '#29C5E0', label: 'TRAIN' },
  STATION: { color: '#2AC76F', label: 'STATION' },
  SECTION: { color: '#3B82F6', label: 'SECTION' },
  TASK: { color: '#F2B53D', label: 'TASK' },
  ASSET: { color: '#9B7BFF', label: 'ASSET' },
  BLOCK: { color: '#F0506E', label: 'BLOCK' },
  WINDOW: { color: '#6c7e9e', label: 'WINDOW' },
}
export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'search' | 'commands'>('search')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const { pushNotification } = useApp()

  useEffect(() => {
    if (open) {
      setQ('')
      setHits([])
      setTab('search')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => {
    if (!open || tab !== 'search') return
    if (!q.trim()) {
      setHits([])
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      const results = await searchService.search(q)
      setHits(results)
      setLoading(false)
      setActive(0)
    }, 90)
    return () => {
      clearTimeout(t)
      setLoading(false)
    }
  }, [q, tab, open])

  const runCommand = useCallback(
    (c: (typeof COMMANDS)[number]) => {
      onOpenChange(false)
      c.action(navigate)
      toast.info('Command executed', c.label)
      pushNotification({ type: 'INFO', category: 'COMMAND', title: c.label, body: 'Command executed from the palette.' })
    },
    [navigate, onOpenChange, pushNotification],
  )

  const items = useMemo(() => (tab === 'commands' ? COMMANDS : hits), [tab, hits])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onOpenChange(false)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(items.length - 1, a + 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    }
    if (e.key === 'Enter' && items[active]) {
      if (tab === 'commands') {
        runCommand(COMMANDS[active])
      } else {
        const hit = hits[active]
        if (hit) {
          onOpenChange(false)
          navigate(hit.link)
        }
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      setTab((t) => (t === 'search' ? 'commands' : 'search'))
      setActive(0)
    }
  }
return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-canvas/75 backdrop-blur-[3px]"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.16 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-[12vh] w-[min(640px,92vw)] overflow-hidden rounded-lg border border-line bg-panel-soft shadow-panel"
            role="dialog"
            aria-label="Global search"
          >
            <div className="flex items-center gap-2.5 border-b border-line px-3.5">
              <Search className="size-4 text-ink-faint" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={tab === 'search' ? 'Search trains, stations, KM, signals, tasks, blocks…' : 'Type a command…'}
                className="h-12 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
              />
              {loading && <Loader2 className="size-4 animate-spin text-ink-faint" />}
              {tab === 'commands' && <Command className="size-4 text-accent-bright" />}
              <button
                onClick={() => setTab(tab === 'search' ? 'commands' : 'search')}
                className="rounded border border-line bg-panel-edge px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-ink-faint hover:text-ink"
              >
                {tab === 'search' ? 'Commands' : 'Search'} · Tab
              </button>
            </div>

            <div className="max-h-[46vh] overflow-y-auto p-1.5">
              {tab === 'search' && !q.trim() && (
                <div className="px-3 py-6 text-center">
                  <p className="text-[11px] text-ink-faint">Start typing to search across the entire control center.</p>
                  <p className="mt-1 text-[10px] text-ink-muted">Try “02060”, “NDLS”, “KM 244”, “T-1022”, “BLK-07”</p>
                </div>
              )}

              {tab === 'commands' && (
                <div className="p-1">
                  <p className="px-2 pb-1.5 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-muted">Commands</p>
                  {COMMANDS.map((c, i) => (
                    <button key={c.label} onClick={() => runCommand(c)} onMouseEnter={() => setActive(i)}
                      className={cn('flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left', active === i ? 'bg-panel-hover text-ink' : 'text-ink-dim')}
                    >
                      <span className="text-sm">{c.icon}</span>
                      <span className="flex-1">
                        <span className="block text-xs font-medium">{c.label}</span>
                        <span className="block text-[10px] text-ink-faint">{c.hint}</span>
                      </span>
                      {active === i && <CornerDownLeft className="size-3.5 text-ink-faint" />}
                    </button>
                  ))}
                </div>
              )}

              {tab === 'search' && hits.length === 0 && q.trim() && !loading && (
                <div className="px-3 py-6 text-center text-[11px] text-ink-faint">No results for “{q}”</div>
              )}
              {tab === 'search' &&
                hits.map((h, i) => (
                  <button key={h.id} onClick={() => { onOpenChange(false); navigate(h.link) }} onMouseEnter={() => setActive(i)}
                    className={cn('flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors', active === i && 'bg-panel-hover')}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded text-[8px] font-bold"
                      style={{ color: KIND_META[h.kind]?.color, background: `${KIND_META[h.kind]?.color}18`, border: `1px solid ${KIND_META[h.kind]?.color}40` }}>
                      {h.kind.slice(0, 3)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-ink">{h.title}</span>
                      <span className="block truncate text-[10px] text-ink-faint">{h.subtitle}</span>
                    </span>
                    {h.meta && <span className="rounded border border-line bg-panel-edge px-1.5 py-px text-[9px] font-semibold text-ink-faint">{h.meta}</span>}
                    <ArrowRight className="size-3.5 shrink-0 text-ink-faint" />
                  </button>
                ))}
            </div>

            <div className="flex items-center justify-between border-t border-line bg-panel-edge/50 px-3.5 py-2 text-[9px] text-ink-faint">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="rounded border border-line bg-panel px-1">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="rounded border border-line bg-panel px-1">↵</kbd> open</span>
                <span className="flex items-center gap-1"><kbd className="rounded border border-line bg-panel px-1">Tab</kbd> commands</span>
              </span>
              <span>IR PLANNER v1.0 · MOCK API</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}