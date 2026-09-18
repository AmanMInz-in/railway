import { useEffect, useState } from 'react'
import { Bell, Bot, LogOut, Menu, Search, UserRound, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CURRENT_USER, useApp } from '@/store/AppStore'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DIVISIONS, ZONES } from '@/data/network'
import { fmtClock, initials } from '@/lib/format'
import { NotificationPanel } from './NotificationPanel'
import { cn } from '@/lib/utils'

export function TopBar({ onMenu, onToggle3D }: { onMenu: () => void; onToggle3D: () => void }) {
  const { zone, division, setZone, setDivision, unreadCount, setSearchOpen, setAssistantOpen, logout, user, settings } = useApp()
  const [now, setNow] = useState(new Date())
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-panel/70 px-3 backdrop-blur sm:px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="size-4" />
      </Button>

      <div className="hidden items-center gap-2 rounded border border-line bg-panel-edge px-2.5 py-1.5 md:flex">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-green opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-signal-green" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-signal-green">System Operational</span>
      </div>

      <div className="hidden items-center gap-1.5 lg:flex">
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Zone</span>
        <Select value={zone} onValueChange={setZone}>
          <SelectTrigger className="h-7 w-[76px] py-0 font-mono text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ZONES.map((z) => (
              <SelectItem key={z.code} value={z.code}>{z.code} · {z.name.split(' ')[0]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={division} onValueChange={setDivision}>
          <SelectTrigger className="h-7 w-[100px] py-0 font-mono text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIVISIONS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 flex-1" />

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 w-56 justify-start gap-2 bg-panel-edge text-ink-faint md:flex"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-3.5" />
          <span>Global search…</span>
          <kbd className="ml-auto rounded border border-line bg-panel px-1.5 py-px font-mono text-[9px] text-ink-faint">Ctrl K</kbd>
        </Button>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)} aria-label="Search">
          <Search className="size-4" />
        </Button>

        <button
          onClick={() => setAssistantOpen(true)}
          className="flex size-8 items-center justify-center rounded-md border border-signal-cyan/40 bg-signal-cyan/10 text-signal-cyan transition-colors hover:bg-signal-cyan/20"
          aria-label="Open RailAI Assistant"
          title="RailAI Assistant"
        >
          <Bot className="size-4" />
        </button>

        <button
          onClick={onToggle3D}
          className="hidden rounded-md border border-line bg-panel-edge p-1.5 text-ink-faint hover:bg-panel-hover lg:block"
          aria-label="Toggle 3D visualization"
          title="Toggle 3D"
        >
          <Zap className={cn('size-3.5', settings.show3D && 'text-warn')} />
        </button>

        <NotificationPanel open={notifOpen} onOpenChange={setNotifOpen} count={unreadCount} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md border border-line bg-panel-edge p-1 transition-colors hover:bg-panel-hover" aria-label="User menu">
              <span className="flex size-6 items-center justify-center rounded bg-gradient-to-br from-accent to-signal-violet text-[9px] font-bold text-white">
                {initials(CURRENT_USER.name)}
              </span>
              <span className="hidden pr-1.5 text-left sm:block">
                <span className="block text-[10px] font-semibold leading-tight text-ink">{user?.name ?? CURRENT_USER.name}</span>
                <span className="block text-[8px] uppercase tracking-wider text-ink-faint">{user?.role}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {user?.employeeId} · {zone}/{division}
              <span className="mt-0.5 block text-[10px] font-normal normal-case text-ink-faint">{user?.designation}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}><UserRound /> Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/reports')}>Reports</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-danger"><LogOut /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden flex-col items-end border-l border-line pl-3 xl:flex">
          <span className="mono-num text-[12px] font-semibold tabular-nums text-ink">{fmtClock(now)}</span>
          <span className="text-[8px] uppercase tracking-[0.18em] text-ink-faint">
            {now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </header>
  )
}