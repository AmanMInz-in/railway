import { Link } from 'react-router-dom'
import { RailSymbol } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-xl border border-line bg-panel text-ink-faint">
        <RailSymbol className="size-8" />
      </div>
      <h1 className="mt-5 text-lg font-bold text-ink">404 — Route not found</h1>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-ink-faint">
        The requested control panel is not on this corridor. Check the URL or return to the command center.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild><Link to="/dashboard">Return to Dashboard</Link></Button>
        <Button variant="outline" asChild><Link to="/login">Sign out</Link></Button>
      </div>
    </div>
  )
}