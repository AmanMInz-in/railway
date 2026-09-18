import * as React from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AppNotification, User } from '@/types'
import { TODAY_ISO } from '@/data/network'
import { toast } from '@/components/ui/toast'
import { asyncDelay } from '@/lib/utils'

/* ============================================================
 * AppStore — global shell state: session, zone/division,
 * notification center, UI overlays (search/assistant) and
 * user preferences.
 * ============================================================ */

export const CURRENT_USER: User = {
  id: 'U-1042',
  employeeId: 'IR-29817',
  name: 'R. K. Sharma',
  designation: 'Deputy Chief Engineer (Coordination)',
  zone: 'NR',
  division: 'DELHI',
  role: 'CEE',
  email: 'rk.sharma@railnet.gov.in',
  avatarColor: '#3B82F6',
  shift: 'B — 14:00–22:00',
}

export interface AppSettings {
  notifications: {
    critical: boolean
    warnings: boolean
    info: boolean
    aiSuggestions: boolean
  }
  theme: 'control-room'
  autoApprove: boolean
  dataRefreshMs: number
  compactTimeline: boolean
  show3D: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: { critical: true, warnings: true, info: true, aiSuggestions: true },
  theme: 'control-room',
  autoApprove: false,
  dataRefreshMs: 5000,
  compactTimeline: false,
  show3D: true,
}

interface AppStoreValue {
  user: User | null
  login: (employeeId: string, zone: string, division: string) => Promise<void>
  logout: () => void
  zone: string
  division: string
  setZone: (z: string) => void
  setDivision: (d: string) => void
  notifications: AppNotification[]
  unreadCount: number
  markAllRead: () => void
  markRead: (id: string) => void
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  settings: AppSettings
  updateSettings: (p: Partial<AppSettings>) => void
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
  assistantOpen: boolean
  setAssistantOpen: (v: boolean) => void
  isAuthenticated: boolean
}

const AppStoreContext = createContext<AppStoreValue | null>(null)
let notifSeq = 100

function seedNotifications(): AppNotification[] {
  const now = Date.now()
  const mk = (
    type: AppNotification['type'],
    category: string,
    title: string,
    body: string,
    minsAgo: number,
    link?: string,
  ): AppNotification => ({
    id: `N-${notifSeq++}`,
    type,
    category,
    title,
    body,
    createdAt: new Date(now - minsAgo * 60000).toISOString(),
    read: minsAgo > 220,
    link,
  })
  return [
    mk('CRITICAL', 'MAINTENANCE', 'Critical defect detected', 'TGI 92 at KM 244 AGRA-GWL — speed restriction initiated.', 6, '/maintenance-intelligence'),
    mk('WARNING', 'OPERATIONS', 'Train conflict detected', 'ENG-BLK-04 overlaps 12952 MUMBAI RAJDHANI on DWN-MTJ.', 14, '/conflicts'),
    mk('SUCCESS', 'AI ENGINE', 'AI plan generated', 'Optimizer produced OPT-8K3A — 47 tasks scheduled, 11 shadow blocks.', 38, '/optimizer'),
    mk('WARNING', 'MAINTENANCE', 'Emergency maintenance request', 'TDMS: OHE insulator arcing near KM 908 NGP-BSL.', 55, '/maintenance-intelligence'),
    mk('INFO', 'PLANNING', 'Block approval required', 'BLK-07 track machine cycle pending DC-M(W) approval before 22:00.', 90, '/block-planning'),
    mk('SUCCESS', 'OPERATIONS', 'Block completed ahead of time', 'S&T block BLK-12 released 18 min early on DWN-MTJ.', 130, '/block-planning'),
    mk('INFO', 'SYSTEM', 'Data sync complete', 'TMS / SMMS / TDMS tables synced 04:00 — 1,284 work orders.', 210, '/maintenance-intelligence'),
    mk('WARNING', 'PLANNING', 'Schedule changed', 'Shadow block SH-1 merged into primary ENG block on AGRA-GWL.', 260, '/shadow-blocks'),
    mk('INFO', 'OPERATIONS', 'New cargo rake advised', 'Coal rake positioned at BSL yard for night loading.', 340, '/live-network'),
    mk('SUCCESS', 'AI ENGINE', 'Prediction model updated', 'Failure-risk model v4.2 retrained — 91% AUC on holdout.', 1500, '/optimizer'),
  ]
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [zone, setZone] = useState('NR')
  const [division, setDivision] = useState('DELHI')
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [searchOpen, setSearchOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const login = async (employeeId: string, zoneCode: string, divisionName: string) => {
    await asyncDelay(650)
    setUser({
      ...CURRENT_USER,
      employeeId: employeeId || CURRENT_USER.employeeId,
      zone: zoneCode || CURRENT_USER.zone,
      division: divisionName || CURRENT_USER.division,
    })
    setZone(zoneCode || 'NR')
    setDivision(divisionName || 'DELHI')
  }

  const logout = () => setUser(null)

  const pushNotification = (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications((prev) => [
      { ...n, id: `N-${notifSeq++}`, createdAt: new Date().toISOString(), read: false },
      ...prev,
    ])
    toast[n.type === 'CRITICAL' ? 'error' : n.type === 'WARNING' ? 'warning' : n.type === 'SUCCESS' ? 'success' : 'info'](n.title, n.body)
  }

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  const markRead = (id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

  const updateSettings = (p: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...p }))
    toast.info('Settings saved', 'Preferences updated for this session.')
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const isAuthenticated = !!user

  const value = useMemo<AppStoreValue>(
    () => ({
      user,
      login,
      logout,
      zone,
      division,
      setZone,
      setDivision,
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      pushNotification,
      settings,
      updateSettings,
      searchOpen,
      setSearchOpen,
      assistantOpen,
      setAssistantOpen,
      isAuthenticated,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, zone, division, notifications, unreadCount, settings, searchOpen, assistantOpen, isAuthenticated],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useApp must be used within AppStoreProvider')
  return ctx
}

export { TODAY_ISO }