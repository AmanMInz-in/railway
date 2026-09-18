import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, KeyRound, Loader2, RailSymbol, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/store/AppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ZONES, DIVISIONS, STATIONS } from '@/data/network'
import { ALL_LINKS } from '@/data/links'
import { SignalTower } from '@/components/network/SignalTower'
import { toast } from '@/components/ui/toast'

export default function Login() {
  const [employeeId, setEmployeeId] = useState('IR-29817')
  const [password, setPassword] = useState('rail-bit')
  const [showPw, setShowPw] = useState(false)
  const [zone, setZone] = useState('NR')
  const [division, setDivision] = useState('DELHI')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [pulse, setPulse] = useState(0)
  const navigate = useNavigate()
  const { login } = useApp()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId.trim() || !password.trim()) {
      toast.warning('Missing credentials', 'Enter your Employee ID and password.')
      return
    }
    setBusy(true)
    await login(employeeId, zone, division)
    setBusy(false)
    toast.success('Access granted', `${employeeId} · ${zone}/${division} — session opened.`)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <div className="relative hidden flex-1 overflow-hidden border-r border-line lg:block">
        <div className="control-room-grid absolute inset-0" />
        <div className="absolute inset-0 bg-vignette" />
        <div className="absolute left-6 top-6 z-10 flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-signal-green" />
          <span className="text-[10px] font-semibold tracking-[0.24em] text-signal-green">NR DELHI CONTROL · LIVE</span>
        </div>
        <div className="absolute left-6 top-12 z-10">
          <p className="text-[11px] text-ink-faint">Automatic Railway Maintenance Block Planning &amp; Optimization</p>
          <p className="mt-0.5 font-mono text-[10px] text-ink-muted">Integrating TMS · SMMS · TDMS · COA</p>
        </div>

        <svg className="absolute inset-0 h-full w-full opacity-90" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid meet" aria-hidden>
          {ALL_LINKS.map((l) => (
            <g key={l.id}>
              <path d={l.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')} fill="none" stroke="#1e3152" strokeWidth={9} strokeLinecap="round" />
              <path d={l.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')} fill="none" stroke="#2e4a72" strokeWidth={4} strokeLinecap="round" strokeDasharray="14 7" className="animate-dash-move" />
            </g>
          ))}
          {STATIONS.map((s) => (
            <g key={s.code} transform={`translate(${s.x} ${s.y})`}>
              <circle r={s.type === 'MINOR' ? 7 : 13} fill="#101b33" stroke="#3a5a88" strokeWidth={2} />
              {s.type === 'MAJOR' && <circle r={3.4} fill="#29C5E0" className="animate-pulse" />}
              <text x={20} y={3} fontSize={11} fontFamily="JetBrains Mono, monospace" fontWeight={700} fill="#8fa3bf">{s.code}</text>
            </g>
          ))}
          <motion.circle r={8} fill="#f2b53d" animate={{ cx: [150, 420, 700], cy: [210, 215, 210] }} transition={{ duration: 11, repeat: Infinity, ease: 'linear' }} style={{ filter: 'drop-shadow(0 0 6px #f2b53d)' }} />
          <motion.circle r={7} fill="#f0506e" animate={{ cx: [1150, 900, 560], cy: [640, 640, 640] }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }} style={{ filter: 'drop-shadow(0 0 6px #f0506e)' }} />
          <motion.circle r={7} fill="#29C5E0" animate={{ cx: [300, 500, 700], cy: [600, 500, 400] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }} style={{ filter: 'drop-shadow(0 0 6px #29C5E0)' }} />
        </svg>

        <motion.div
          className="absolute bottom-6 left-6 z-10 flex items-center gap-4 rounded-lg border border-line bg-panel/70 px-4 py-2.5 backdrop-blur"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        >
          <SignalTower aspect={{ on: true, color: '#2AC76F' }} className="scale-125" />
          <div>
            <p className="text-[10px] font-semibold text-ink-dim">AI CRITICALITY ENGINE</p>
            <p className="text-[9px] text-ink-faint">2,048 assets monitored · 5,112 predictions / day · 94.2% accuracy</p>
          </div>
        </motion.div>

        <div className="absolute right-8 top-1/2 flex -translate-y-1/2 flex-col gap-5 opacity-80">
          {[0, 1].map((i) => (
            <SignalAspect key={i} on={pulse % 2 === i % 2} color={i === 0 ? '#2AC76F' : '#f2b53d'} onClick={() => setPulse((p) => p + 1)} />
          ))}
        </div>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center bg-panel-soft px-6 lg:w-[520px]">
<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-[380px]">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative mb-4 flex size-16 items-center justify-center rounded-xl bg-gradient-to-b from-accent/30 to-transparent text-accent-bright ring-1 ring-accent/40">
              <span className="absolute inset-0 animate-ping rounded-xl bg-accent/5" />
              <RailSymbol className="size-9" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              RAILWAY AI <span className="text-accent-bright">BLOCK PLANNER</span>
            </h1>
            <p className="mt-1.5 text-xs text-ink-faint">Intelligent Maintenance Block Planning &amp; Optimization</p>
            <div className="mt-3 flex items-center gap-2">
              <SignalTower />
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-muted">IR Enterprise Console · v2.1</span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="emp">Employee ID</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
                <Input id="emp" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="h-9 pl-8 font-mono"
                  placeholder="e.g. IR-29817" autoComplete="username" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
                <Input id="pw" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="h-9 pl-8 pr-8" placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink" aria-label="Toggle password visibility">
                  {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Zone</Label>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ZONES.map((z) => <SelectItem key={z.code} value={z.code}>{z.code} — {z.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Division</Label>
                <Select value={division} onValueChange={setDivision}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-ink-faint">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                Remember me
              </label>
              <button type="button" onClick={() => toast.info('Password reset', 'SSO reset link sent to registered railnet email.')} className="text-[11px] text-accent-bright hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" size="lg" className="h-10 w-full gap-2 text-xs font-bold tracking-wide" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <RailSymbol className="size-4" />}
              {busy ? 'AUTHENTICATING…' : 'ENTER CONTROL CENTER'}
            </Button>

            <p className="text-center text-[9px] leading-relaxed text-ink-muted">
              Authorized personnel only. Sessions logged (IR DMAA) and encrypted (AES-256). Demo credentials pre-filled.
            </p>
          </form>
        </motion.div>
        <p className="absolute bottom-4 text-center text-[9px] text-ink-muted">
          © 2026 Indian Railways · Northern Railway · Smart India Hackathon build
        </p>
      </div>
    </div>
  )
}

function SignalAspect({ on, color, onClick }: { on: boolean; color: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="pointer-events-auto cursor-pointer" aria-label="Toggle signal">
      <div className="relative flex h-20 w-6 flex-col items-center justify-center rounded-[5px] border border-line bg-panel-edge">
        <span className="absolute inset-y-2 left-2 w-[3px] rounded bg-[#22304d]" />
        <span
          className="size-3.5 rounded-full border border-canvas transition-colors"
          style={{ background: on ? color : '#152036', boxShadow: on ? `0 0 10px ${color}` : 'none' }}
        />
      </div>
    </button>
  )
}