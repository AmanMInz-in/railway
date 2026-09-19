# Railway AI Block Planner - Command Center

**AI-Powered Automatic Railway Maintenance Block Planning & Optimization System**
Indian Railways Operations Control Center · Smart India Hackathon build

A production-style dark command-center frontend that integrates **TMS** (track), **SMMS** (signal & telecom), **TDMS** (traction/OHE) and **COA** (train operations) feeds to plan, optimize, visualize and approve railway maintenance blocks.

## Stack

- React 18 + TypeScript + Vite 5
- Tailwind CSS 3 + shadcn-style Radix UI primitives (hand-tuned for the control-room theme)
- React Router 6 (browser router, lazy-loaded pages)
- D3 (geometry helpers, schematic network), Recharts-ready service layer
- React Three Fiber + Three.js (subtle 3D dashboard scene with auto 2D fallback)
- Framer Motion (fast, purposeful motion)
- Lucide icons

## Run locally

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer

### Install and start

Run these commands from the project root, the folder containing `package.json`:

```bash
cd G:\Projects\Railway\railway
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

Do not run `npm run dev` from the `src` folder. `src` contains application code, but it is not the Vite project root and does not contain `package.json`.

### Other commands

```bash
npm run build      # type-check and create the production bundle in dist/
npm run preview    # serve the production bundle locally
```

The login screen includes pre-filled demo credentials. Use employee ID `IR-29817` and any password with at least 8 characters if you change it.

### Troubleshooting a blank page

1. Stop any incorrectly started Vite process with `Ctrl+C`.
2. Open a terminal in `G:\Projects\Railway\railway`, not `G:\Projects\Railway\railway\src`.
3. Run `npm install`, then `npm run dev`.
4. Open the exact local URL printed in the terminal and refresh the page.

If the page is still blank, run `npm run build`. TypeScript or module errors will be printed in the terminal and should be fixed before starting the app again.

## Architecture

```
src/
  services/         Mock API layer — replace internals with FastAPI calls later
    api.ts          fetch adapter + mock handler registry (isMock flag)
    maintenanceService.ts  TMS / SMMS / TDMS work-orders + assets (seeded, deterministic)
    trainService.ts live train feed (subscriber pattern, moving positions)
    blockService.ts windows, conflict detection, shadow blocks, AI plan builder
    optimizationService.ts animation steps + metrics
    reportsService.ts  analytics series
    searchService.ts   global search (Ctrl+K)
  data/             schematic network (stations, links, geometry)
  types/            domain model (Train, Station, MaintenanceTask, MaintenanceBlock,
                    BlockConflict, ShadowBlock, OptimizationResult, …)
  store/AppStore    session, zone/division, notifications, settings, overlays
  components/
    ui/             shadcn-style primitives (button, dialog, select, tabs, table, …)
    widgets/        KPI card, criticality gauge, data table, status badges, …
    network/        RailwayMap (interactive D3 schematic), RouteDetail, SignalTower
    graph/          MasterControlGraph (time–distance control-office chart)
    planning/       MaintenanceTimeline (draggable/resizable block lanes)
    three/          ThreeDNetwork (+ 2D fallback)
    assistant/      RailAI assistant (intent parser over the mock services)
  pages/            18 screens: Login, Dashboard, Live Network, Maintenance Intelligence,
                    Block Planner, AI Optimizer, Master Control Graph, Monthly/Weekly
                    planning, Conflict Center, Shadow Blocks, Schedule Comparison,
                    Assets, Departments, Reports, Notifications, Settings, Profile
```

## Design language

- Deep navy/charcoal (`#070C16–#16233C`) control-room surfaces, hairline borders
- Signal-derived accents: green `#2AC76F` · amber `#F2B53D` · red `#F0506E` · violet `#9B7BFF` · cyan `#29C5E0`
- Subtle grid texture, controlled glow, reduced-motion support, tabular numerals

## Key interactions

- **Live Network** — pan/zoom schematic, click stations/trains/defects/blocks
- **Block Planner** — generate AI plan, drag / resize blocks, approve, export CSV
- **Master Control Graph** — time vs stations chart with zoom, pan, filters and tooltips
- **AI Optimizer** — animated MILP-style run, predicted improvement metrics
- **Ctrl+K** — global search + command palette (Tab to switch)
- **RailAI Assistant** — floating chat that answers operational questions from live mock data
- CSV export is real (client-side blob); PDF flow prints the current page