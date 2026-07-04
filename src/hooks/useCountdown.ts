'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface UseCountdownOptions {
  durationMs: number
  startedAt: string | null   // ISO string
  onExpire: () => void
  onTick?: (remainingMs: number) => void
}

export function useCountdown({ durationMs, startedAt, onExpire, onTick }: UseCountdownOptions) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const expiredRef  = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const computeRemaining = useCallback(() => {
    if (!startedAt) return null
    const elapsed = Date.now() - new Date(startedAt).getTime()
    return Math.max(0, durationMs - elapsed)
  }, [startedAt, durationMs])

  useEffect(() => {
    if (!startedAt) { setRemainingMs(null); return }
    expiredRef.current = false

    const tick = () => {
      const rem = computeRemaining()
      if (rem === null) return
      setRemainingMs(rem)
      onTick?.(rem)
      if (rem <= 0 && !expiredRef.current) {
        expiredRef.current = true
        clearInterval(intervalRef.current!)
        onExpire()
      }
    }

    tick() // immediate first tick
    intervalRef.current = setInterval(tick, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [startedAt, computeRemaining, onExpire, onTick])

  const format = (ms: number) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000))
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
    const ss = String(totalSec % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }

  const pct = remainingMs !== null ? remainingMs / durationMs : 1
  const isDanger  = remainingMs !== null && remainingMs < 5 * 60 * 1000
  const isWarning = remainingMs !== null && remainingMs < 15 * 60 * 1000

  return {
    remainingMs,
    formatted: remainingMs !== null ? format(remainingMs) : '--:--',
    pct,
    isDanger,
    isWarning,
    isRunning: startedAt !== null && remainingMs !== null && remainingMs > 0,
  }
}
