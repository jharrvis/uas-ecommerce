'use client'

import { useEffect, useState } from 'react'

interface ImageViewerModalProps {
  url: string
  title?: string
  onClose: () => void
  footer?: React.ReactNode
}

function getDriveDirectUrl(url: string): string {
  if (!url) return url

  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`
  }

  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    return `https://lh3.googleusercontent.com/d/${openMatch[1]}`
  }

  return url
}

export default function ImageViewerModal({ url, title, onClose, footer }: ImageViewerModalProps) {
  const [imgError, setImgError] = useState(false)
  const directUrl = getDriveDirectUrl(url)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <p className="text-sm font-semibold text-slate-300 truncate">{title || 'Screenshot'}</p>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Buka di Drive ↗
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition text-xl"
            >
              ×
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-0 min-h-[300px]">
          {imgError ? (
            <div className="text-center space-y-3">
              <p className="text-slate-400 text-sm">Gambar tidak dapat ditampilkan langsung.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition"
              >
                Buka di Google Drive ↗
              </a>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={directUrl}
              alt={title || 'Screenshot'}
              className="max-w-full max-h-full object-contain rounded-xl"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        {footer && (
          <div className="flex-shrink-0 border-t border-slate-700 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
