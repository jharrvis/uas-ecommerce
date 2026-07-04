'use client'

import { useEffect, useRef, useCallback } from 'react'
import { apiUploadScreenshot } from '@/lib/sheets'
import type { CheckpointId } from '@/types'
import { toast } from '@/components/ui/Toast'

interface QueuedUpload {
  id: string
  nim: string
  cp: CheckpointId
  fileName: string
  dataUrl: string   // base64 data URL stored locally
  retries: number
  createdAt: string
}

const QUEUE_KEY = 'uas_upload_queue'
const MAX_RETRIES = 3

function getQueue(): QueuedUpload[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}
function saveQueue(q: QueuedUpload[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)) } catch {}
}

export function useOfflineQueue(onUploaded: (cp: CheckpointId, url: string) => void) {
  const processingRef = useRef(false)

  const processQueue = useCallback(async () => {
    if (processingRef.current || !navigator.onLine) return
    const queue = getQueue()
    if (queue.length === 0) return

    processingRef.current = true

    for (const item of queue) {
      try {
        // Convert dataUrl back to File
        const res  = await fetch(item.dataUrl)
        const blob = await res.blob()
        const file = new File([blob], item.fileName, { type: blob.type })

        const { file_url } = await apiUploadScreenshot(item.nim, item.cp, file)

        // Remove from queue on success
        const newQueue = getQueue().filter((q) => q.id !== item.id)
        saveQueue(newQueue)

        onUploaded(item.cp, file_url)
        toast.success(`Upload ${item.cp.toUpperCase()} berhasil (mode offline terselesaikan)`)
      } catch {
        // Increment retries
        const newQueue = getQueue().map((q) =>
          q.id === item.id ? { ...q, retries: q.retries + 1 } : q
        ).filter((q) => q.retries <= MAX_RETRIES)
        saveQueue(newQueue)
      }
    }

    processingRef.current = false
  }, [onUploaded])

  // Enqueue a failed upload for later retry
  const enqueue = useCallback((nim: string, cp: CheckpointId, dataUrl: string, fileName: string) => {
    const queue = getQueue()
    queue.push({ id: `${Date.now()}_${cp}`, nim, cp, fileName, dataUrl, retries: 0, createdAt: new Date().toISOString() })
    saveQueue(queue)
    toast.warning('Koneksi bermasalah. Upload disimpan dan akan otomatis dikirim saat online.')
  }, [])

  const queueSize = getQueue().length

  // Process on coming back online
  useEffect(() => {
    window.addEventListener('online', processQueue)
    // Also try immediately in case we're already online
    processQueue()
    return () => window.removeEventListener('online', processQueue)
  }, [processQueue])

  return { enqueue, processQueue, queueSize }
}
