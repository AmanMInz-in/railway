import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Train } from '@/types'
import { ALL_LINKS, pointOnLink, linkBetween } from '@/data/links'
import { STATIONS } from '@/data/network'

/* ============================================================
 * Subtle 3D schematic network — best-effort decorative layer.
 * Fallbacks to a 2D graphic automatically when WebGL is absent
 * or when the user disables 3D.
 * ============================================================ */

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

function TrackNetwork() {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -0.22, 0.04)
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.012
  })

  const curves = useMemo(
    () =>
      ALL_LINKS.map((l) => {
        const pts = l.points.map(([x, y]) => new THREE.Vector3((x - 380) * 0.05, -y * 0.05, 0))
        return new THREE.CatmullRomCurve3(pts)
      }),
    [],
  )

  return (
    <group ref={group}>
      {curves.map((c, i) => (
        <Line key={i} points={c.points} color="#27405f" lineWidth={3} transparent opacity={0.8} />
      ))}
      {ALL_LINKS.map((l) => (
        <Line key={`rail-${l.id}`} points={l.points.map(([x, y]) => new THREE.Vector3((x - 380) * 0.05, -y * 0.05, 0))}
          color="#3a5a88" lineWidth={8} transparent opacity={0.06} />
      ))}
      {STATIONS.filter((s) => s.type !== 'MINOR').map((s) => (
        <mesh key={s.code} position={[(s.x - 380) * 0.05, -s.y * 0.05, 0]}>
          <sphereGeometry args={[0.55, 12, 12]} />
          <meshStandardMaterial color={s.type === 'JUNCTION' ? '#3B82F6' : '#6788b8'} emissive={s.type === 'JUNCTION' ? '#3B82F6' : '#22375a'} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function MovingTrains({ trains }: { trains: Train[] }) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef(0)
  const positions = useMemo(() => {
    const map = new Map<string, { link: ReturnType<typeof linkBetween>; a: string; b: string }>()
    for (const tr of trains) {
      const a = tr.route[tr.sectionIdx]
      const b = tr.route[tr.sectionIdx + 1]
      map.set(tr.id, { link: linkBetween(a, b), a, b })
    }
    return map
  }, [trains])

  useFrame((state) => {
    if (!ref.current) return
    const speed = 0.05 + Math.sin(state.clock.elapsedTime * 1.2) * 0.012
    t.current = (t.current + speed * 0.0025) % 1
    trains.forEach((train, i) => {
      const entry = positions.get(train.id)
      if (!entry?.link) return
      const obj = ref.current?.children[i] as THREE.Mesh | undefined
      if (!obj) return
      const frac = (train.progress + t.current) % 1
      const [x, y] = pointOnLink(entry.link, frac)
      obj.position.set((x - 380) * 0.05, -y * 0.05, 0.4)
      obj.rotation.z = 0
    })
  })

  return (
    <group ref={ref}>
      {trains.map((tr) => (
        <mesh key={tr.id}>
          <boxGeometry args={[0.7, 0.32, 0.32]} />
          <meshStandardMaterial color={tr.critical ? '#f0506e' : tr.category === 'GOODS' ? '#8293ae' : tr.priority === 'HIGH' ? '#f2b53d' : '#29C5E0'}
            emissive={tr.critical ? '#f0506e' : '#29C5E0'} emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  )
}

export function ThreeDNetwork({ enabled, trains }: { enabled: boolean; trains: Train[] }) {
  const webgl = useMemo(() => (typeof window !== 'undefined' ? hasWebGL() : false), [])

  if (!enabled || !webgl) {
    // graceful 2D fallback
    return (
      <div className="relative h-44 w-full overflow-hidden rounded-md border border-line bg-[#080d18]" aria-hidden>
        <svg viewBox="0 0 1200 300" className="h-full w-full">
          {ALL_LINKS.map((l) => (
            <path key={l.id} d={l.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')}
              fill="none" stroke="#25395a" strokeWidth={7} strokeLinecap="round" />
          ))}
          {STATIONS.filter((s) => s.type !== 'MINOR').map((s) => (
            <circle key={s.code} cx={s.x} cy={s.y} r={6} fill="#1a2b4a" stroke="#3a5a88" strokeWidth={1.5} />
          ))}
          <text x={560} y={290} textAnchor="middle" fill="#47597a" fontSize={11} letterSpacing={2}>
            2D FALLBACK — WEBGL UNAVAILABLE ON THIS DEVICE
          </text>
        </svg>
        <div className="absolute left-3 top-3 rounded bg-panel/80 px-2 py-1 text-[9px] text-ink-faint backdrop-blur">GPU OFF</div>
      </div>
    )
  }

  return (
    <div className="relative h-44 w-full overflow-hidden rounded-md border border-line bg-[#080d18]">
      <Canvas camera={{ position: [0, -4, 15], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.55} />
        <pointLight position={[10, 10, 12]} intensity={40} color="#3b82f6" />
        <TrackNetwork />
        <MovingTrains trains={trains} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} minPolarAngle={Math.PI / 2.6} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-panel/80 px-2 py-1 text-[9px] text-ink-faint backdrop-blur">3D SLOW ORBIT</div>
      <Html />
    </div>
  )
}