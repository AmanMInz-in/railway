import {
  Activity, AlertTriangle, BarChart3, Blocks, Bot, Boxes, CalendarDays, CheckCircle2,
  ChevronLeft, Gauge, GitCompareArrows, LayoutDashboard, Map, Network,
  RailSymbol, Settings, ShieldCheck, Sparkles, UserRound, Workflow, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavLink, useNavigate } from 'react-router-dom'
import { CURRENT_USER, useApp } from '@/store/AppStore'
import { initials } from '@/lib/format'
import { motion } from 'framer-motion'

const sections: Array<{ label: string; items: Array<{ to: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }> }> = [
  {
    label: 'Operations',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/live-network', label: 'Live Network', icon: Network },
      { to: '/conflicts', label: 'Conflict Center', icon: AlertTriangle, badge: 3 },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/maintenance-intelligence', label: 'Maintenance Intel', icon: Activity },
      { to: '/assets', label: 'Asset Details', icon: Boxes },
      { to: '/departments', label: 'Departments', icon: ShieldCheck },
      { to: '/shadow-blocks', label: 'Shadow Blocks', icon: Sparkles },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/block-planning', label: 'Block Planner', icon: Workflow },
      { to: '/master-control-graph', label: 'Master Control Graph', icon: Gauge },
      { to: '/optimizer', label: 'AI Optimizer', icon: Bot },
      { to: '/schedule-comparison', label: 'Schedule Comparison', icon: GitCompareArrows },
    ],
  },
  {
    label: 'Strategic',
    items: [
      { to: '/monthly-planning', label: 'Monthly Planner', icon: CalendarDays },
      { to: '/weekly-planning', label: 'Weekly Planner', icon: Blocks },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
      { to: '/notifications', label: 'Notifications', icon: CheckCircle2 },
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/profile', label: 'Profile', icon: UserRound },
    ],
  },
]

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onClose,
  mobile,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
  onClose?: () => void
  mobile?: boolean
}) {
  const { unreadCount } = useApp()
  const navigate = useNavigate()

  const body = (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center gap-2.5 border-b border-line/80 px-4 py-3', collapsed && 'justify-center px-2')}>
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-accent/25 to-transparent text-accent-bright ring-1 ring-accent/40">
          <RailSymbol className="size-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[12px] font-bold tracking-tight text-ink">RAILWAY AI</p>
            <p className="truncate text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-bright">Block Planner</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3" aria-label="Primary">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-muted">{section.label}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-accent/12 text-ink shadow-[inset_2px_0_0_0_rgba(96,165,250,0.8)]'
                            : 'text-ink-faint hover:bg-panel-hover hover:text-ink',
                          collapsed && 'justify-center px-0',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={cn('size-4 shrink-0', isActive ? 'text-accent-bright' : 'text-ink-faint group-hover:text-ink-dim')} />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                          {!collapsed && item.to === '/notifications' && unreadCount > 0 && (
                            <span className="ml-auto rounded bg-accent/20 px-1 py-px text-[9px] font-bold text-accent-bright">{unreadCount}</span>
                          )}
                          {!collapsed && item.badge !== undefined && (
                            <span className="ml-auto rounded bg-danger/15 px-1 py-px text-[9px] font-bold text-danger">{item.badge}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-line/70 p-3', collapsed && 'px-2')}>
        {!collapsed ? (
          <button onClick={() => navigate('/profile')} className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-panel-hover">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-signal-violet text-[10px] font-bold text-white">
              {initials(CURRENT_USER.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-semibold text-ink">{CURRENT_USER.name}</span>
              <span className="block truncate text-[9px] text-ink-faint">{CURRENT_USER.designation}</span>
            </span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/profile')}
            className="mx-auto flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-signal-violet text-[10px] font-bold text-white"
            aria-label="Profile"
          >
            {initials(CURRENT_USER.name)}
          </button>
        )}
      </div>
      <Map className="pointer-events-none absolute bottom-1 right-1 size-24 opacity-[0.03]" aria-hidden />
    </div>
  )

  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-canvas/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 w-[260px] border-r border-line bg-panel"
        >
          {body}
          <button onClick={onClose} className="absolute right-2 top-3 rounded p-1 text-ink-faint hover:text-ink" aria-label="Close menu">
            <X className="size-4" />
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={cn('relative flex h-full flex-col border-r border-line bg-panel/80 transition-[width] duration-200', collapsed ? 'w-14' : 'w-[218px]')}>
      {body}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-16 hidden size-6 items-center justify-center rounded-full border border-line bg-panel-raised text-ink-faint hover:text-ink lg:flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft className={cn('size-3.5 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </div>
  )
}