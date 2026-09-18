import { asyncDelay } from '@/lib/utils'
import { STATIONS } from '@/data/network'
import { LINKS } from '@/data/links'

/* ============================================================
 * Global search — single entry point for Ctrl+K.
 * Searches trains, stations, track km, signal IDs, OHE
 * sections, maintenance tasks, blocks and windows.
 * ============================================================ */

export interface SearchHit {
  id: string
  kind: 'TRAIN' | 'STATION' | 'TASK' | 'ASSET' | 'BLOCK' | 'WINDOW' | 'SECTION'
  title: string
  subtitle: string
  link: string
  meta?: string
}

export const searchService = {
  async search(q: string): Promise<SearchHit[]> {
    await asyncDelay(40)
    const s = q.trim().toLowerCase()
    if (!s) return []
    const hits: SearchHit[] = []

    // stations
    for (const st of STATIONS) {
      if (
        st.code.toLowerCase().includes(s) ||
        st.name.toLowerCase().includes(s)
      ) {
        hits.push({
          id: `ST-${st.code}`,
          kind: 'STATION',
          title: `${st.code} — ${st.name}`,
          subtitle: `KM ${st.km.toFixed(1)} · ${st.type} · ${st.platform} PF`,
          link: '/live-network?station=' + st.code,
          meta: 'STATION',
        })
      }
    }

    // sections
    for (const l of LINKS) {
      if (l.name.toLowerCase().includes(s)) {
        hits.push({
          id: `SEC-${l.name}`,
          kind: 'SECTION',
          title: `Section ${l.name}`,
          subtitle: `KM ${l.kmFrom}–${l.kmTo} · ${l.speedLimitKmph} kmph · ${l.electrified ? 'Electrified' : 'Non-EL'}`,
          link: '/live-network?section=' + l.name,
          meta: 'SECTION',
        })
      }
    }

    // trains + tasks + blocks + assets are loaded lazily
    const [trainMod, maintMod, blockMod] = await Promise.all([
      import('./trainService'),
      import('./maintenanceService'),
      import('./blockService'),
    ])
    const trains = await trainMod.trainService.getTrains()
    const tasks = await maintMod.maintenanceService.getTasks()
    const assets = await maintMod.maintenanceService.getAssets()
    const blocks = await blockMod.blockService.getBlocks()

    for (const t of trains) {
      if (
        t.number.includes(s) ||
        t.name.toLowerCase().includes(s) ||
        `${t.origin}${t.dest}`.toLowerCase().includes(s)
      ) {
        hits.push({
          id: `TR-${t.number}`,
          kind: 'TRAIN',
          title: `${t.number} · ${t.name}`,
          subtitle: `${t.origin} → ${t.dest} · ${t.type}${t.delayMinutes ? ` · +${t.delayMinutes} min` : ''}`,
          link: '/live-network?train=' + t.number,
          meta: t.priority,
        })
      }
    }

    for (const tk of tasks) {
      if (
        tk.id.toLowerCase().includes(s) ||
        tk.assetCode.toLowerCase().includes(s) ||
        tk.section.toLowerCase().includes(s) ||
        tk.description.toLowerCase().includes(s)
      ) {
        hits.push({
          id: tk.id,
          kind: 'TASK',
          title: `${tk.id} · ${tk.description}`,
          subtitle: `${tk.departmentLabel} · ${tk.section} · KM ${tk.km.toFixed(1)} · Criticality ${tk.criticality.score}`,
          link: '/maintenance-intelligence?task=' + tk.id,
          meta: tk.priority,
        })
      }
    }

    for (const a of assets) {
      if (a.code.toLowerCase().includes(s) || a.section.toLowerCase().includes(s)) {
        hits.push({
          id: a.id,
          kind: 'ASSET',
          title: `${a.code} · ${a.type}`,
          subtitle: `${a.section} · KM ${a.km.toFixed(1)} · ${a.condition}`,
          link: '/assets?asset=' + a.code,
          meta: a.condition,
        })
      }
    }

    for (const b of blocks) {
      if (b.code.toLowerCase().includes(s) || b.section.toLowerCase().includes(s)) {
        hits.push({
          id: b.id,
          kind: 'BLOCK',
          title: `${b.code} · ${b.departmentLabel} block`,
          subtitle: `${b.section} · ${Math.floor(b.startMin / 60)}:${String(b.startMin % 60).padStart(2, '0')}–${Math.floor(b.endMin / 60)}:${String(b.endMin % 60).padStart(2, '0')} · ${b.durationMin} min`,
          link: '/block-planning?block=' + b.id,
          meta: b.status,
        })
      }
    }

    return hits.slice(0, 40)
  },
}