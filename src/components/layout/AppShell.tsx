import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { SearchPalette } from './SearchPalette'
import { useApp } from '@/store/AppStore'
import { AIAssistant } from '@/components/assistant/AIAssistant'
import { Toaster } from '@/components/ui/toast'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { setAssistantOpen, updateSettings, settings, searchOpen, setSearchOpen } = useApp()
  const location = useLocation()

  return (
    <div className="control-room-bg flex h-screen w-full overflow-hidden">
      {/* desktop sidebar */}
      <div className="hidden h-full lg:block">
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && <Sidebar mobile collapsed={false} onToggleCollapse={() => {}} onClose={() => setMobileOpen(false)} />}
      </AnimatePresence>

      <div className="control-room-grid relative flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileOpen(true)} onToggle3D={() => updateSettings({ show3D: !settings.show3D })} />
        <main key={location.pathname} className="relative min-w-0 flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-0 bg-vignette" aria-hidden />
          <Outlet />
        </main>
        <Toaster />
      </div>

      {/* global overlays */}
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <AIAssistant />
    </div>
  )
}