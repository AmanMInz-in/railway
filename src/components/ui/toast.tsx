import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, BellRing, CheckCircle2, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  message?: string
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()
let seq = 0

function emit() {
  listeners.forEach((l) => l([...toasts]))
}

export const toast = {
  push(t: Omit<ToastItem, 'id'>) {
    const id = ++seq
    toasts = [...toasts, { ...t, id }]
    emit()
    setTimeout(() => {
      toasts = toasts.filter((x) => x.id !== id)
      emit()
    }, 4600)
  },
  success(title: string, message?: string) {
    this.push({ kind: 'success', title, message })
  },
  error(title: string, message?: string) {
    this.push({ kind: 'error', title, message })
  },
  warning(title: string, message?: string) {
    this.push({ kind: 'warning', title, message })
  },
  info(title: string, message?: string) {
    this.push({ kind: 'info', title, message })
  },
  dismiss(id: number) {
    toasts = toasts.filter((x) => x.id !== id)
    emit()
  },
}

export function useToasts() {
  const [state, setState] = useState<ToastItem[]>(toasts)
  useEffect(() => {
    const l: Listener = (t) => setState(t)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return state
}

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="size-4 text-signal-green" />,
  error: <AlertTriangle className="size-4 text-danger" />,
  warning: <AlertTriangle className="size-4 text-warn" />,
  info: <Info className="size-4 text-accent-bright" />,
}

const ACCENT: Record<ToastKind, string> = {
  success: 'border-signal-green/50 shadow-glowGreen',
  error: 'border-danger/50 shadow-glowRed',
  warning: 'border-warn/50 shadow-glowAmber',
  info: 'border-accent/40',
}

export function Toaster() {
  const items = useToasts()
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[340px] max-w-[92vw] flex-col gap-2">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, transition: { duration: 0.18 } }}
            className={cn(
              'pointer-events-auto relative overflow-hidden rounded-md border bg-panel-raised p-3 shadow-panel',
              ACCENT[t.kind],
            )}
            role="status"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0">{ICONS[t.kind]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink">{t.title}</p>
                {t.message && <p className="mt-0.5 text-[11px] leading-snug text-ink-dim">{t.message}</p>}
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 rounded p-0.5 text-ink-faint hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-current opacity-20" />
            <BellRing className="absolute -right-2 -top-2 size-8 opacity-[0.06]" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}