'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

// Global toast queue
let listeners: ((toasts: ToastItem[]) => void)[] = []
let toastQueue: ToastItem[] = []

function notify(toast: Omit<ToastItem, 'id'>) {
  const item: ToastItem = { id: Date.now().toString(), duration: 4000, ...toast }
  toastQueue = [...toastQueue, item]
  listeners.forEach((l) => l(toastQueue))
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== item.id)
    listeners.forEach((l) => l(toastQueue))
  }, item.duration)
}

export const toast = {
  success: (message: string) => notify({ message, type: 'success' }),
  error:   (message: string) => notify({ message, type: 'error',   duration: 6000 }),
  warning: (message: string) => notify({ message, type: 'warning', duration: 5000 }),
  info:    (message: string) => notify({ message, type: 'info' }),
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handler = (t: ToastItem[]) => setToasts([...t])
    listeners.push(handler)
    return () => { listeners = listeners.filter((l) => l !== handler) }
  }, [])

  if (!mounted) return null

  const icons: Record<ToastType, string> = {
    success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️'
  }
  const styles: Record<ToastType, string> = {
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    error:   'border-red-500/40 bg-red-500/10 text-red-300',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    info:    'border-sky-500/40 bg-sky-500/10 text-sky-300',
  }

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur shadow-xl animate-fade-in ${styles[t.type]}`}
        >
          <span className="flex-shrink-0 text-base mt-0.5">{icons[t.type]}</span>
          <p className="text-sm font-medium flex-1">{t.message}</p>
        </div>
      ))}
    </div>,
    document.body
  )
}
