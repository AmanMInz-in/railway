import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/widgets/Panel'
import { Cpu, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { reportsService } from '@/services/reportsService'
import { exportCsv } from '@/services/mockCommon'
import { toast } from '@/components/ui/toast'

export default function Reports() {
  const [trends, setTrends] = useState<Record<string, Array<{ month: string; value: number }>>>({})
  const [range, setRange] = useState('8M')

  useEffect(() => {
    let active = true
    reportsService.getTrends().then((t) => active && setTrends(t))
    return () => { active = false }
  }, [])

  const charts: Record<string, { color: string; label: string; data: Array<{ month: string; value: number }> }> = {
    maintenanceCompletion: { color: '#2AC76F', label: 'Maintenance Completion', data: trends.maintenanceCompletion ?? [] },
    blockUtilization: { color: '#3b82f6', label: 'Block Utilization %', data: trends.blockUtilization ?? [] },
    trainDelay: { color: '#f2b53d', label: 'Avg Train Delay (min)', data: trends.trainDelay ?? [] },
    criticalDefects: { color: '#f0506e', label: 'Critical Defects', data: trends.criticalDefects ?? [] },
    shadowBlockUsage: { color: '#29C5E0', label: 'Shadow Block Usage', data: trends.shadowBlockUsage ?? [] },
    weeklyVsMonthly: { color: '#9B7BFF', label: 'Weekly vs Monthly Blocks', data: trends.weeklyVsMonthly ?? [] },
  }

  const exportReport = () => {
    const rows: Array<Array<string | number>> = []
    Object.entries(charts).forEach(([k, c]) => c.data.forEach((d) => rows.push([k, d.month, d.value])))
    exportCsv('analytics-report.csv', ['metric', 'month', 'value'], rows)
    toast.info('Report exported', 'analytics-report.csv downloaded.')
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 p-4 lg:p-5">
      <PageHeader
        eyebrow="Insights"
        title="Reports & Analytics"
        description="Maintenance completion, block utilisation, delays and AI improvement trends across the division."
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1M">Last month</SelectItem>
                <SelectItem value="3M">Last quarter</SelectItem>
                <SelectItem value="8M">8 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportReport}><Download className="size-3.5" />CSV</Button>
            <Button size="sm" onClick={() => { window.print() }}><Cpu className="size-3.5" />PRINT / PDF</Button>
          </div>
        }
      />

      {Object.entries(charts).map(([k, c]) => <TrendCard key={k} label={c.label} color={c.color} data={c.data} />)}
    </div>
  )
}

function TrendCard({ label, color, data }: { label: string; color: string; data: Array<{ month: string; value: number }> }) {
  if (!data.length) return <div className="h-36 animate-pulse rounded-lg bg-panel-raised/60" />
  const W = 700, H = 150, PAD = 28
  const vals = data.map((d) => d.value)
  const min = Math.min(...vals), max = Math.max(...vals)
  const span = max - min || 1
  const px = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2)
  const py = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2)
  const line = data.map((d, i) => `${px(i).toFixed(1)},${py(d.value).toFixed(1)}`).join(' ')
  const area = `${PAD},${H - PAD} ${line} ${(W - PAD).toFixed(1)},${H - PAD}`
  const last = data[data.length - 1]
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink">{label}</p>
        <div className="flex items-center gap-2">
          {data.slice(-3).map((d) => <span key={d.month} className="chip">{d.month}: <b>{d.value}</b></span>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
        {[0, 1, 2, 3].map((i) => <line key={i} x1={PAD} y1={PAD + i * ((H - PAD * 2) / 3)} x2={W - PAD} y2={PAD + i * ((H - PAD * 2) / 3)} stroke="rgba(46,61,92,0.2)" />)}
        <polygon points={area} fill={color} opacity={0.08} />
        <polyline points={line} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${color}66)` }} />
        {data.map((d, i) => <circle key={d.month} cx={px(i)} cy={py(d.value)} r={2.8} fill={color} stroke="#080d18" strokeWidth={1} />)}
        {last && <text x={px(data.length - 1) - 6} y={py(last.value) - 8} fontSize={9} fill={color} fontFamily="JetBrains Mono, monospace">{last.value}</text>}
      </svg>
      <div className="flex justify-between text-[9px] text-ink-faint"><span>{data[0].month}</span><span>{data[data.length - 1].month}</span></div>
    </div>
  )
}