import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/widgets/Panel'
import { KeyRound, Save } from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/toast'

export default function Profile() {
  const { user, logout } = useApp()
  const [old, setOld] = useState('')
  const [next, setNext] = useState('')
  const navigate = useNavigate()

  const changePwd = () => {
    if (!old.trim() || next.trim().length < 8) {
      toast.warning('Weak password', 'New password must be at least 8 characters.')
      return
    }
    toast.success('Password updated', 'Keys rotated. Re-authenticate on next login.')
    setOld(''); setNext('')
  }

  return (
    <div className="mx-auto w-full max-w-[820px] space-y-4 p-4 lg:p-5">
      <PageHeader eyebrow="Account" title="User Profile" description="Session identity, shift and security details." />
      <div className="rounded-lg border border-line bg-panel p-6">
        <div className="flex items-center gap-5">
          <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-signal-violet text-xl font-bold text-white ring-4 ring-accent/30">
            {user?.name.split(' ').map((p) => p[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-ink">{user?.name}</p>
            <p className="text-[11px] text-ink-faint">{user?.designation} · {user?.role}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[[user?.employeeId, 'Employee ID'], [`${user?.zone}/${user?.division}`, 'Zone / Division'], [user?.email, 'Railnet mail'], [user?.shift, 'Current shift']].map(([v, l]) => (
                <span key={l} className="chip">{l}: <b>{v}</b></span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 hairline" />
        <div className="space-y-5">
          <div>
            <p className="ctrl-title mb-3">Security · Change password</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Current password</Label><Input type="password" value={old} onChange={(e) => setOld(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>New password</Label><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} /></div>
            </div>
            <Button className="mt-3 gap-1.5" size="sm" onClick={changePwd}><KeyRound className="size-3.5" />Update credentials</Button>
          </div>
          <div>
            <p className="ctrl-title mb-3">Session</p>
            <div className="flex items-center justify-between rounded-md border border-line bg-panel-edge/50 px-3 py-2.5">
              <div>
                <p className="text-xs font-semibold text-ink">Active session</p>
                <p className="text-[10px] text-ink-faint">Signed in · MOCK AUTH (FastAPI session token planned)</p>
              </div>
              <Switch checked aria-label="Session active" />
            </div>
            <Button variant="destructive" className="mt-2 gap-1.5" size="sm" onClick={() => { logout(); navigate('/login') }}><Save className="size-3.5" />End session</Button>
          </div>
        </div>
      </div>
    </div>
  )
}