'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useExamStore } from '@/store/examStore'
import { CP_ORDER, CHECKPOINT_META } from '@/types'

export default function DonePage() {
  const params  = useParams<{ nim: string }>()
  const router  = useRouter()
  const session = useExamStore((s) => s.session)

  useEffect(() => {
    if (!session || session.nim !== params.nim) router.replace('/login')
  }, [session, params.nim, router])

  if (!session) return null

  const dur = session.startedAt && session.submittedAt
    ? Math.round((new Date(session.submittedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
    : null

  const completedCPs = CP_ORDER.filter((cp) => session.checkpoints[cp].status === 'done')
  const totalBobot   = completedCPs.reduce((sum, cp) => sum + CHECKPOINT_META[cp].bobot, 0)

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl fade-in">

        {/* Success card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/20 rounded-2xl p-8 text-center mb-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-4xl mx-auto mb-4">
            ✅
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Ujian Berhasil Dikumpulkan!</h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Pekerjaan Anda telah diterima. Tunggu penilaian dari dosen pengampu.
          </p>
        </div>

        {/* Summary */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-4">
          <h2 className="font-bold text-slate-300 text-sm mb-4 flex items-center gap-2">
            <span>📊</span> Ringkasan Pengerjaan
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Nama',       value: session.nama },
              { label: 'NIM',        value: session.nim },
              { label: 'Kelas',      value: session.kelas },
              { label: 'Toko Soal',  value: session.tokoSoal.nama_toko },
              { label: 'CP Selesai', value: `${completedCPs.length} / ${CP_ORDER.length}` },
              { label: 'Durasi',     value: dur ? `${dur} menit` : '—' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-700/40 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                <p className="font-bold text-slate-200 text-sm truncate">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Checkpoint list */}
          <div className="space-y-1.5">
            {CP_ORDER.map((cp) => {
              const meta  = CHECKPOINT_META[cp]
              const done  = session.checkpoints[cp].status === 'done'
              return (
                <div key={cp} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
                  done ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/30 text-slate-600'
                }`}>
                  <span>{done ? '✅' : '—'}</span>
                  <span className="flex-1">{meta.label}</span>
                  <span className="font-bold">{meta.bobot}pt</span>
                </div>
              )
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-400">Bobot checkpoint selesai</span>
            <span className="font-bold text-sky-400 text-lg">{totalBobot} / 100</span>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs">
          Screenshot Anda sudah tersimpan di Google Drive. Dosen akan melakukan verifikasi dan input nilai.
        </p>
      </div>
    </div>
  )
}
