import * as React from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppStoreProvider, useApp } from '@/store/AppStore'
import { AppShell } from '@/components/layout/AppShell'

const Login = React.lazy(() => import('@/pages/Login'))
const Dashboard = React.lazy(() => import('@/pages/Dashboard'))
const LiveNetwork = React.lazy(() => import('@/pages/LiveNetwork'))
const MaintenanceIntelligence = React.lazy(() => import('@/pages/MaintenanceIntelligence'))
const BlockPlanning = React.lazy(() => import('@/pages/BlockPlanning'))
const MasterControlGraphPage = React.lazy(() => import('@/pages/MasterControlGraphPage'))
const AIOptimizer = React.lazy(() => import('@/pages/AIOptimizer'))
const ScheduleComparison = React.lazy(() => import('@/pages/ScheduleComparison'))
const MonthlyPlanning = React.lazy(() => import('@/pages/MonthlyPlanning'))
const WeeklyPlanning = React.lazy(() => import('@/pages/WeeklyPlanning'))
const ConflictCenter = React.lazy(() => import('@/pages/ConflictCenter'))
const ShadowBlocks = React.lazy(() => import('@/pages/ShadowBlocks'))
const AssetDetail = React.lazy(() => import('@/pages/AssetDetail'))
const Departments = React.lazy(() => import('@/pages/Departments'))
const Reports = React.lazy(() => import('@/pages/Reports'))
const Notifications = React.lazy(() => import('@/pages/Notifications'))
const Settings = React.lazy(() => import('@/pages/Settings'))
const Profile = React.lazy(() => import('@/pages/Profile'))
const NotFound = React.lazy(() => import('@/pages/NotFound'))

function AppRoutes() {
  const { isAuthenticated } = useApp()
  const router = createBrowserRouter([
    { path: '/login', element: <Login /> },
    {
      element: isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />,
      children: [
        { path: '/', element: <Navigate to="/dashboard" replace /> },
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/live-network', element: <LiveNetwork /> },
        { path: '/maintenance-intelligence', element: <MaintenanceIntelligence /> },
        { path: '/block-planning', element: <BlockPlanning /> },
        { path: '/master-control-graph', element: <MasterControlGraphPage /> },
        { path: '/optimizer', element: <AIOptimizer /> },
        { path: '/schedule-comparison', element: <ScheduleComparison /> },
        { path: '/monthly-planning', element: <MonthlyPlanning /> },
        { path: '/weekly-planning', element: <WeeklyPlanning /> },
        { path: '/conflicts', element: <ConflictCenter /> },
        { path: '/shadow-blocks', element: <ShadowBlocks /> },
        { path: '/assets', element: <AssetDetail /> },
        { path: '/departments', element: <Departments /> },
        { path: '/reports', element: <Reports /> },
        { path: '/notifications', element: <Notifications /> },
        { path: '/settings', element: <Settings /> },
        { path: '/profile', element: <Profile /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ])
  return <RouterProvider router={router} key={String(isAuthenticated)} />
}

export default function App() {
  return (
    <React.Suspense fallback={<BootSplash />}>
      <AppStoreProvider>
        <AppRoutes />
      </AppStoreProvider>
    </React.Suspense>
  )
}

function BootSplash() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex size-14 items-center justify-center rounded-lg bg-gradient-to-b from-accent/30 to-transparent text-accent-bright ring-1 ring-accent/40">
          <span className="absolute size-14 animate-ping rounded-lg bg-accent/10" />
          <RailMark />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-ink-faint">Railway AI Block Planner</p>
        <div className="h-0.5 w-40 overflow-hidden rounded bg-panel-raised">
          <div className="h-full w-1/2 animate-scan bg-accent" />
        </div>
      </div>
    </div>
  )
}

function RailMark() {
  return <span className="relative">🚂</span>
}