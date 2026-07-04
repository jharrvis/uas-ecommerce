'use client'

import { useRef, useState, useCallback } from 'react'
import { apiUploadScreenshot } from '@/lib/sheets'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import ImageViewerModal from '@/components/ui/ImageViewerModal'
import type { CheckpointId } from '@/types'

interface UploadZoneProps {
  nim: string
  cp: CheckpointId
  disabled?: boolean
  existingUrl?: string
  onUploaded: (url: string) => void
}

export default function UploadZone({ nim, cp, disabled, existingUrl, onUploaded }: UploadZoneProps) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState<string | null>(null)
  const [error, setError]         = useState('')
  const [uploadedUrl, setUploadedUrl] = useState(existingUrl || '')
  const [queued, setQueued]       = useState(false)
  const [showModal, setShowModal] = useState(false)

  const { enqueue } = useOfflineQueue((cpId, url) => {
    if (cpId === cp) { setUploadedUrl(url); setQueued(false); onUploaded(url) }
  })

  const MAX_MB = 10

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar (PNG, JPG) yang diterima.'); return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_MB}MB.`); return
    }

    setError('')
    setUploading(true)

    // Preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)

      // Try upload — fall back to offline queue on failure
      apiUploadScreenshot(nim, cp, file)
        .then(({ file_url }) => {
          setUploadedUrl(file_url)
          onUploaded(file_url)
        })
        .catch(() => {
          enqueue(nim, cp, dataUrl, file.name)
          setQueued(true)
          onUploaded('queued') // mark as done locally
        })
        .finally(() => setUploading(false))
    }
    reader.readAsDataURL(file)
  }, [nim, cp, onUploaded, enqueue])

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return
    processFile(files[0])
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }

  // ── Already uploaded ──
  if ((uploadedUrl && uploadedUrl !== 'queued') && !uploading) {
    return (
      <>
        <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3 flex items-center gap-3">
          {preview ? (
            <button onClick={() => setShowModal(true)} className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="ss" className="w-14 h-14 rounded-lg object-cover border border-emerald-500/20 hover:opacity-80 transition cursor-zoom-in" />
            </button>
          ) : (
            <button onClick={() => setShowModal(true)}
              className="w-14 h-14 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition flex-shrink-0">
              👁
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-emerald-400 text-sm font-semibold">✅ Screenshot diupload</p>
            <button onClick={() => setShowModal(true)}
              className="text-sky-400 text-xs underline mt-0.5 hover:text-sky-300 block text-left">
              Lihat screenshot
            </button>
          </div>
          {!disabled && (
            <button onClick={() => { setUploadedUrl(''); setPreview(null) }}
              className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded-lg hover:bg-slate-700 transition">
              Ganti
            </button>
          )}
        </div>
        {showModal && (
          <ImageViewerModal
            url={preview || uploadedUrl}
            title="Screenshot Checkpoint"
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    )
  }

  // ── Queued for offline ──
  if (queued) {
    return (
      <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="ss" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-amber-500/20" />
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-amber-400 text-sm font-semibold">⏳ Antrian upload</p>
          <p className="text-amber-300/70 text-xs mt-0.5">Akan dikirim otomatis saat koneksi pulih</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all
          ${disabled
            ? 'opacity-40 cursor-not-allowed border-slate-700'
            : dragging
            ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
            : 'border-slate-600 hover:border-sky-500 hover:bg-sky-500/5 cursor-pointer'
          }`}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef} type="file" accept="image/*" className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="w-8 h-8 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
            <p className="text-sky-400 text-sm font-medium">Mengupload ke Google Drive...</p>
            <p className="text-slate-500 text-xs">Jangan tutup halaman ini</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <span className="text-3xl">{dragging ? '📂' : '📸'}</span>
            <p className="text-sm font-semibold text-slate-300">
              {dragging ? 'Lepas untuk upload' : 'Klik atau drag screenshot di sini'}
            </p>
            <p className="text-xs text-slate-500">PNG, JPG — maks {MAX_MB}MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs px-1">
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  )
}
