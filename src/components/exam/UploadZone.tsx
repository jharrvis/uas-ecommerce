'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiUploadScreenshot } from '@/lib/sheets'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import ImageViewerModal from '@/components/ui/ImageViewerModal'
import type { CheckpointId } from '@/types'

interface UploadZoneProps {
  nim: string
  cp: CheckpointId
  disabled?: boolean
  existingUrls?: string[]
  onUploaded: (urls: string[]) => void
}

interface PreparedFile {
  file: File
  dataUrl: string
}

export default function UploadZone({
  nim,
  cp,
  disabled,
  existingUrls = [],
  onUploaded,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [error, setError] = useState('')
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(
    existingUrls.filter((url) => url && url !== 'queued')
  )
  const [queued, setQueued] = useState(existingUrls.includes('queued'))
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setUploadedUrls(existingUrls.filter((url) => url && url !== 'queued'))
    setQueued(existingUrls.includes('queued'))
    setPreviewUrls([])
    setShowModal(false)
    setError('')
    setUploading(false)
  }, [cp, existingUrls])

  const { enqueue } = useOfflineQueue((cpId, url) => {
    if (cpId !== cp) return

    setUploadedUrls((current) => {
      const next = [...current, url]
      onUploaded(next)
      return next
    })
    setQueued(false)
  })

  const MAX_MB = 10

  const prepareFile = useCallback(async (file: File): Promise<PreparedFile | null> => {
    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar (PNG, JPG) yang diterima.')
      return null
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_MB}MB.`)
      return null
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve((e.target?.result as string) || '')
      reader.onerror = () => reject(new Error('read_failed'))
      reader.readAsDataURL(file)
    })

    return { file, dataUrl }
  }, [])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return

    setError('')
    setUploading(true)

    const nextUploaded = [...uploadedUrls]
    const nextPreviews = [...previewUrls]
    let hasQueued = queued

    for (const file of Array.from(files)) {
      const prepared = await prepareFile(file)
      if (!prepared) continue

      nextPreviews.push(prepared.dataUrl)

      try {
        const { file_url } = await apiUploadScreenshot(nim, cp, prepared.file)
        nextUploaded.push(file_url)
      } catch {
        enqueue(nim, cp, prepared.dataUrl, prepared.file.name)
        hasQueued = true
      }
    }

    setPreviewUrls(nextPreviews)
    setUploadedUrls(nextUploaded)
    setQueued(hasQueued)

    if (nextUploaded.length > 0 || hasQueued) {
      onUploaded(hasQueued ? [...nextUploaded, 'queued'] : nextUploaded)
    }

    setUploading(false)
  }, [cp, enqueue, nim, onUploaded, prepareFile, previewUrls, queued, uploadedUrls])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) void handleFiles(e.dataTransfer.files)
  }

  if ((uploadedUrls.length > 0 || queued) && !uploading) {
    return (
      <>
        <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => uploadedUrls.length > 0 && setShowModal(true)}
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-emerald-500/20 bg-emerald-500/10"
            >
              {previewUrls[0] || uploadedUrls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrls[0] || uploadedUrls[0]}
                  alt="Screenshot"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-emerald-400">VIEW</span>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-400">
                {uploadedUrls.length > 0
                  ? `${uploadedUrls.length} screenshot tersimpan`
                  : 'Screenshot masuk antrean upload'}
              </p>
              {uploadedUrls.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="mt-0.5 block text-left text-xs text-sky-400 underline hover:text-sky-300"
                >
                  Lihat semua screenshot
                </button>
              )}
              {queued && (
                <p className="mt-0.5 text-xs text-amber-300/80">
                  Sebagian file masih antre dan akan dikirim otomatis saat koneksi pulih.
                </p>
              )}
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-700 hover:text-slate-300"
              >
                Tambah
              </button>
            )}
          </div>

          {uploadedUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {uploadedUrls.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="overflow-hidden rounded-lg border border-emerald-500/20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrls[index] || url}
                    alt={`Screenshot ${index + 1}`}
                    className="h-20 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => void handleFiles(e.target.files)}
        />

        {showModal && (
          <ImageViewerModal
            urls={uploadedUrls}
            title="Screenshot Checkpoint"
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    )
  }

  if (queued) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        {previewUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrls[0]}
            alt="Screenshot"
            className="h-14 w-14 flex-shrink-0 rounded-lg border border-amber-500/20 object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-400">Antrian upload</p>
          <p className="mt-0.5 text-xs text-amber-300/70">
            Akan dikirim otomatis saat koneksi pulih
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative rounded-xl border-2 border-dashed p-5 text-center transition-all ${
          disabled
            ? 'cursor-not-allowed border-slate-700 opacity-40'
            : dragging
              ? 'scale-[1.01] border-sky-400 bg-sky-500/10'
              : 'cursor-pointer border-slate-600 hover:border-sky-500 hover:bg-sky-500/5'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => void handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-400" />
            <p className="text-sm font-medium text-sky-400">Mengupload ke Google Drive...</p>
            <p className="text-xs text-slate-500">Jangan tutup halaman ini</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <span className="text-3xl">{dragging ? '📂' : '📸'}</span>
            <p className="text-sm font-semibold text-slate-300">
              {dragging ? 'Lepas untuk upload' : 'Klik atau drag screenshot di sini'}
            </p>
            <p className="text-xs text-slate-500">
              PNG, JPG - maks {MAX_MB}MB, bisa pilih beberapa file
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 px-1 text-xs text-red-400">
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  )
}
