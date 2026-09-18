import { useState } from 'react'
import { PageHeader } from '@/components/widgets/Panel'
import { BellRing, Database, Save } from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'

export default function Settings() {
  const { settings, updateSettings } = useApp()

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="System"
        title="System Settings"
        description="Control-room preferences, data feeds and AI governance."
        actions={<Button size="sm" onClick={() => updateSettings({})} className="gap-1.5"><Save className="size-3.5" />Save (auto)</Button>}
      />

      <div className="rounded-lg border border-line bg-panel p-5">
        <p className="ctrl-title mb-4 flex items-center gap-2"><BellRing className="size-3.5" /> Notification channels</p>
        <div className="space-y-3">
          <Row label="Critical alerts" desc="Always on — cannot disable for safety" checked={settings.notifications.critical} />
          <Row label="Warnings" desc="Conflicts, overrun risk, emergency defects" checked={settings.notifications.warnings} onChange={(v) => updateSettings({ notifications: { ...settings.notifications, warnings: v } })} />
          <Row label="Informational" desc="Data-sync, approvals, schedule changes" checked={settings.notifications.info} onChange={(v) => updateSettings({ notifications: { ...settings.notifications, info: v } })} />
          <Row label="AI suggestions" desc="RailAI optimisation nudges" checked={settings.notifications.aiSuggestions} onChange={(v) => updateSettings({ notifications: { ...settings.notifications, aiSuggestions: v } })} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel p-5">
          <p className="ctrl-title mb-4 flex items-center gap-2"><Database className="size-3.5" /> Data & AI</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-line bg-panel-edge/40 px-3 py-2.5">
              <div><p className="text-xs font-semibold text-ink">3D visualization</p><p className="text-[10px] text-ink-faint">WebGL network on dashboard</p></div>
              <Switch checked={settings.show3D} onCheckedChange={(v) => updateSettings({ show3D: !!v })} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-line bg-panel-edge/40 px-3 py-2.5">
              <div><p className="text-xs font-semibold text-ink">Auto-approve AI plans</p><p className="text-[10px] text-ink-faint">Skip review queue for low-risk blocks</p></div>
              <Switch checked={settings.autoApprove} onCheckedChange={(v) => updateSettings({ autoApprove: !!v })} />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-ink-faint">Data refresh interval (mock feed tick)</p>
              <Select value={String(settings.dataRefreshMs)} onValueChange={(v) => updateSettings({ dataRefreshMs: Number(v) })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3000">3 s · live demo</SelectItem>
                  <SelectItem value="5000">5 s · standard</SelectItem>
                  <SelectItem value="15000">15 s · low bandwidth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-5">
          <p className="ctrl-title mb-4">Integrations</p>
          <div className="space-y-2 text-[11px]">
            {[
              ['TMS — Track Management', 'Connected'],
              ['SMMS — Signal & Telecom', 'Connected'],
              ['TDMS — Traction / OHE', 'Connected · degraded feed'],
              ['COA — Train operations', 'Connected'],
              ['FastAPI + PostGIS (target)', 'Pending deployment'],
              ['OR-Tools / MILP engine', 'Pending deployment'],
            ].map(([name, state]) => (
              <div key={name} className="flex items-center justify-between rounded-md border border-line bg-panel-edge/40 px-3 py-2">
                <span className="text-ink-dim">{name}</span>
                <span className={`inline-flex items-center gap-1.5 text-[9px] ${state === 'Connected' ? 'text-signal-green' : state === 'Connected · degraded feed' ? 'text-warn' : 'text-ink-faint'}`}>
                  <span className={`size-1.5 rounded-full ${state === 'Connected' ? 'bg-signal-green' : state === 'Connected · degraded feed' ? 'bg-warn' : 'bg-ink-muted'}`} />{state}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded border border-accent/20 bg-accent/5 px-2.5 py-2 text-[9.5px] leading-relaxed text-ink-faint">
            The service layer auto-falls back to mock endpoints until the FastAPI backend is reachable at <kbd className="rounded bg-panel px-1 font-mono text-[8px]">https://api.rail-planner.in</kbd>.
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange?: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-line bg-panel-edge/40 px-3 py-2.5">
      <div><p className="text-xs font-semibold text-ink">{label}</p><p className="text-[10px] text-ink-faint">{desc}</p></div>
      <Switch checked={checked} disabled={!onChange} onCheckedChange={(v) => onChange?.(!!v)} />
    </div>
  )
}