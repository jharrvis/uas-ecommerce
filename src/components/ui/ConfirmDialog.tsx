'use client'

import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open, title, description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel  = 'Batal',
  danger = false,
  onConfirm, onCancel
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-fade-in">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${
          danger ? 'bg-red-500/15' : 'bg-sky-500/15'
        }`}>
          {danger ? '⚠️' : '❓'}
        </div>
        <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl transition text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 font-bold rounded-xl transition text-sm text-white ${
              danger
                ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20'
                : 'bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
