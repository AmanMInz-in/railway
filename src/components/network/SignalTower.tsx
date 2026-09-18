export function SignalTower({
  aspect,
  className,
}: {
  aspect?: { on: boolean; color: string }
  className?: string
}) {
  const A = aspect ?? { on: true, color: '#2AC76F' }
  return (
    <div className={`flex items-center gap-0.5 ${className ?? ''}`} aria-label={A.on ? 'Signal ON' : 'Signal OFF'}>
      <svg width="16" height="26" viewBox="0 0 16 26" aria-hidden>
        <rect x="6" y="2" width="4" height="18" fill="#24344f" />
        <rect x="2" y="0" width="12" height="8" rx="1" fill="#0d1730" stroke="#3a5378" strokeWidth="1" />
        <circle cx="8" cy="4 " r="2.2" fill={A.on ? A.color : '#4a5568'}
          className={A.on ? 'animate-pulse' : undefined}
          style={A.on ? { filter: `drop-shadow(0 0 3px ${A.color})` } : undefined}
        />
      </svg>
      <svg width="16" height="26" viewBox="0 0 16 26" aria-hidden>
        <rect x="6" y="2" width="4" height="18" fill="#24344f" />
        <rect x="2" y="0" width="12" height="8" rx="1" fill="#0d1730" stroke="#3a5378" strokeWidth="1" />
        <circle cx="8" cy="4" r="2.2" fill={A.on ? A.color : '#4a5568'}
          className={A.on ? 'animate-pulse [animation-delay:600ms]' : undefined}
          style={A.on ? { filter: `drop-shadow(0 0 3px ${A.color})` } : undefined}
        />
      </svg>
    </div>
  )
}