'use client'

import { useEffect, useRef, useCallback } from 'react'
import { apiLogEvent } from '@/lib/sheets'
import { toast } from '@/components/ui/Toast'

interface AntiCheatOptions {
  nim: string
  enabled: boolean          // only active when exam is 'started'
  onViolation?: (type: string, count: number) => void
}

interface Violation {
  type: string
  timestamp: string
  count: number
}

const STORAGE_KEY = 'uas_violations'
const MAX_WARNINGS = 5

export function useAntiCheat({ nim, enabled, onViolation }: AntiCheatOptions) {
  const violationCount = useRef(0)
  const lastWarned     = useRef(0)

  const getViolations = useCallback((): Violation[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch { return [] }
  }, [])

  const recordViolation = useCallback((type: string) => {
    if (!enabled) return

    const now = Date.now()
    // Debounce — jangan spam warning dalam 3 detik
    if (now - lastWarned.current < 3000) return
    lastWarned.current = now

    violationCount.current += 1
    const count = violationCount.current

    const violations = getViolations()
    violations.push({ type, timestamp: new Date().toISOString(), count })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(violations))

    // Log ke Sheets (fire and forget)
    apiLogEvent('cp_done', nim, {
      cp: 'violation',
      screenshot_url: `[VIOLATION] ${type} (${count}x) at ${new Date().toISOString()}`,
    }).catch(() => {})

    onViolation?.(type, count)

    // User-facing warning
    if (count === 1) {
      toast.warning(`⚠️ Berpindah tab terdeteksi. Kerjakan di window yang sama.`)
    } else if (count <= MAX_WARNINGS) {
      toast.error(`🚨 Peringatan ${count}/${MAX_WARNINGS}: Aktivitas mencurigakan dicatat.`)
    } else {
      toast.error(`🔴 Pelanggaran berulang dicatat. Laporan dikirim ke dosen.`)
    }
  }, [enabled, nim, getViolations, onViolation])

  useEffect(() => {
    if (!enabled) return

    // 1. Tab visibility change
    const handleVisibility = () => {
      if (document.hidden) recordViolation('tab_switch')
    }

    // 2. Window blur (alt-tab, minimize)
    const handleBlur = () => recordViolation('window_blur')

    // 3. Right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      toast.info('Klik kanan dinonaktifkan saat ujian berlangsung.')
    }

    // 4. Keyboard shortcuts (DevTools, View Source, Print Screen)
    const handleKeydown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') { e.preventDefault(); recordViolation('devtools_shortcut'); return }
      // Ctrl+Shift+I/J/C/U
      if (e.ctrlKey && e.shiftKey && ['I','J','C','U'].includes(e.key.toUpperCase())) {
        e.preventDefault(); recordViolation('devtools_shortcut'); return
      }
      // Ctrl+U (view source)
      if (e.ctrlKey && e.key.toLowerCase() === 'u') {
        e.preventDefault(); recordViolation('view_source'); return
      }
      // Ctrl+P (print)
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault(); return
      }
    }

    // 5. Copy detection on exam content
    const handleCopy = () => {
      const sel = window.getSelection()?.toString().trim()
      if (sel && sel.length > 50) {
        recordViolation('copy_content')
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('copy', handleCopy)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('copy', handleCopy)
    }
  }, [enabled, recordViolation])

  return { violationCount: violationCount.current, getViolations }
}
