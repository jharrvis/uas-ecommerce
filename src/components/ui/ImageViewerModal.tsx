'use client'

import { useEffect, useMemo, useState } from 'react'
import { getImageProxyUrl } from '@/lib/utils'

interface ImageViewerModalProps {
  url?: string
  urls?: string[]
  title?: string
  onClose: () => void
  footer?: React.ReactNode
}

export default function ImageViewerModal({
  url,
  urls,
  title,
  onClose,
  footer,
}: ImageViewerModalProps) {
  const gallery = useMemo(
    () => (urls && urls.length > 0 ? urls : url ? [url] : []).filter(Boolean),
    [url, urls]
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    setActiveIndex(0)
    setImgError(false)
  }, [url, urls])

  const activeUrl = gallery[activeIndex]

  if (!activeUrl) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3">
          <p className="truncate text-sm font-semibold text-slate-300">
            {title || 'Screenshot'}
            {gallery.length > 1 ? ` (${activeIndex + 1}/${gallery.length})` : ''}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-600"
            >
              Buka di Drive
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-700 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex min-h-[300px] min-h-0 flex-1 items-center justify-center overflow-auto p-4">
          {imgError ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-slate-400">Gambar tidak dapat ditampilkan langsung.</p>
              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                Buka di Google Drive
              </a>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getImageProxyUrl(activeUrl, 'checkpoint-preview.jpg')}
              alt={title || 'Screenshot'}
              className="max-h-full max-w-full rounded-xl object-contain"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        {gallery.length > 1 && (
          <div className="flex-shrink-0 border-t border-slate-700 px-4 py-3">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {gallery.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  type="button"
                  onClick={() => {
                    setActiveIndex(index)
                    setImgError(false)
                  }}
                  className={`overflow-hidden rounded-lg border ${
                    index === activeIndex
                      ? 'border-sky-400 ring-1 ring-sky-400'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageProxyUrl(item, `checkpoint-thumb-${index + 1}.jpg`)}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-16 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {footer && (
          <div className="flex-shrink-0 border-t border-slate-700 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
