'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useExamStore } from '@/store/examStore'
import Checkpoint from './Checkpoint'
import type { CheckpointId } from '@/types'
import { CP_ORDER, CHECKPOINT_META } from '@/types'
import { getTokoBrands, getDriveDirectUrl } from '@/lib/utils'

interface RightPanelProps {
  isExamLocked: boolean
  onSubmit: () => void
  submitting: boolean
}

export default function RightPanel({ isExamLocked, onSubmit, submitting }: RightPanelProps) {
  const session = useExamStore((s) => s.session)
  const completedCount = useExamStore((s) => s.completedCount)

  // State untuk Tab Navigasi. Default ke 'summary', setelah itu cp01-cp09
  const [activeTab, setActiveTab] = useState<CheckpointId | 'summary'>('summary')

  if (!session) return null

  const { tokoSoal: toko, produkSoal: produk, nim } = session
  const completed = completedCount()
  const allDone = completed === CP_ORDER.length
  const canSubmit = allDone && session.status === 'started' && !isExamLocked
  const eventPromo = Array.isArray(toko.event_promo)
    ? toko.event_promo
    : String(toko.event_promo || '')
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
  const manufacturers = getTokoBrands(toko).map((brand) => brand.name)

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  // Helper untuk navigasi Prev/Next
  const tabs = ['summary' as const, ...CP_ORDER]
  const currentIndex = tabs.indexOf(activeTab)
  const prevTab = currentIndex > 0 ? tabs[currentIndex - 1] : null
  const nextTab = currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null

  return (
    <main className="h-full flex flex-col overflow-hidden">
      
      {/* ── Tab Bar Horizontal ── */}
      <div className="flex overflow-x-auto scrollbar-thin bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <button
          onClick={() => setActiveTab('summary')}
          className={`whitespace-nowrap px-5 py-3.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'summary' 
              ? 'border-sky-500 text-sky-500 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/5' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          📋 Ringkasan Ujian
        </button>

        {CP_ORDER.map((cp) => {
          const cpState = session.checkpoints[cp]
          const isDone = cpState.status === 'done'
          const meta = CHECKPOINT_META[cp]

          return (
            <button
              key={cp}
              onClick={() => setActiveTab(cp)}
              className={`whitespace-nowrap px-5 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === cp 
                  ? 'border-sky-500 text-sky-500 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/5' 
                  : isDone
                    ? 'border-transparent text-emerald-600 dark:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {isDone ? '✅' : '⚪'} {meta.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 md:p-8 bg-slate-50 dark:bg-slate-950">
        
        {/* Konten Tab Summary */}
        {activeTab === 'summary' && (
          <div className="fade-in max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-sky-100 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-3xl flex-shrink-0">
                  🏪
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-1">Soal Ujian Anda</div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">{toko.nama_toko}</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                    <span>📍</span>{toko.alamat}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                {[
                  { icon: '✉️', label: 'Email', value: toko.email },
                  { icon: '📞', label: 'Telepon', value: toko.telepon },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{item.label}</p>
                      <p className="text-slate-900 dark:text-slate-200 text-sm font-mono truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-5">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Latar Belakang Bisnis</p>
                <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed">{toko.deskripsi_bisnis}</p>
              </div>

              {eventPromo.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">Event Promosi</p>
                  <div className="flex flex-wrap gap-2">
                    {eventPromo.map((ev) => (
                      <span key={ev} className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-bold rounded-full">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Produk yang Akan Anda Input ({produk.length} produk)
                </p>
                <div className="space-y-2.5">
                  {produk.map((p, i) => (
                    <div key={p.id} className="flex gap-4 p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      {/* Gambar Produk */}
                      <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex-shrink-0 overflow-hidden">
                        {p.gambar_1 ? (
                          <Image 
                            src={getDriveDirectUrl(p.gambar_1)} 
                            alt={p.nama_produk}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iI2ZmZiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjMzMzMzMzIi8+CjxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iIzMzMzMzMyIvPgo8cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iIzMzMzMzMyIvPgo8L3N2Zz4K';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#94a3b8"/>
                            </svg>
                          </div>
                        )}
                      </div>
                       
                       <div className="min-w-0 flex-1">
                        <p className="text-slate-900 dark:text-slate-100 text-base font-bold leading-tight truncate">{p.nama_produk}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{p.manufacturer} · {fmt(p.harga)}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">SKU: {p.sku}</p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-sm font-black flex items-center justify-center">
                          {i + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-sky-50 dark:bg-sky-500/5 border border-sky-200 dark:border-sky-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400 mb-4 flex items-center gap-2">
                <span>📋</span> Instruksi Utama Pengerjaan
              </h3>
              <ol className="space-y-3 text-base text-slate-700 dark:text-slate-300">
                {[
                  'Link website praktek tersedia di bagian kiri halaman. Login ke URL website praktek/admin dengan username <strong>admin</strong> dan password <strong>admin</strong>.',
                  `Lengkapi data toko <strong>${toko.nama_toko}</strong> di OpenCart (nama, alamat, email, telepon, logo).`,
                  `Tambahkan manufacturer ${manufacturers.join(' dan ')} beserta logonya ke carousel halaman depan.`,
                  'Buat kategori yang diperlukan untuk produk-produk Anda.',
                  `Input ${produk.length} produk lengkap sesuai data di masing-masing checkpoint.`,
                  `Terapkan strategi diskon dan harga spesial untuk event ${eventPromo.slice(0, 2).join(' dan ') || 'promosi'}.`,
                  'Pasang banner slideshow produk Anda di halaman depan toko.',
                  'Tampilkan semua produk di beranda pada kolom <strong>Featured</strong> atau produk unggulan.',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-sm font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: text }} />
                  </li>
                ))}
              </ol>
            </div>

            {/* Area Pengumpulan Ujian di Tab Summary */}
            {session.status === 'submitted' ? (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-8 text-center">
                <p className="text-5xl mb-4">✅</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-black text-2xl">Ujian Sudah Dikumpulkan</p>
                <p className="text-slate-500 dark:text-slate-400 text-base mt-2">Tunggu penilaian dari dosen pengampu.</p>
              </div>
            ) : session.status === 'started' ? (
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Kumpulkan Ujian</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                      {allDone
                        ? 'Semua checkpoint selesai! Pastikan Anda sudah mengecek ulang.'
                        : `Masih ada ${CP_ORDER.length - completed} checkpoint yang belum selesai.`}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-3xl font-black text-sky-500 dark:text-sky-400">{completed}<span className="text-lg text-slate-400 dark:text-slate-500 font-normal"> / {CP_ORDER.length} CP</span></p>
                  </div>
                </div>

                {!allDone && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl mb-6 text-sm text-amber-700 dark:text-amber-400 font-medium">
                    <span className="text-lg">⚠️</span>
                    Selesaikan semua checkpoint (Tab CP01 - CP09 di atas) sebelum mengumpulkan ujian.
                  </div>
                )}

                <button
                  onClick={onSubmit}
                  disabled={!canSubmit || submitting}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-lg font-black rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengirim...</>
                  ) : (
                    'Selesai & Kumpulkan Ujian'
                  )}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Konten Tab Checkpoint (CP01-09) */}
        {activeTab !== 'summary' && (
          <div className="fade-in max-w-4xl mx-auto">
            <Checkpoint
              cp={activeTab}
              nim={nim}
              toko={toko}
              produk={produk}
              isExamLocked={isExamLocked}
            />
          </div>
        )}

      </div>

      {/* ── Footer Navigasi Prev/Next ── */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div>
          {prevTab && (
            <button
              onClick={() => setActiveTab(prevTab as 'summary' | CheckpointId)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition flex items-center gap-2"
            >
              <span>←</span>
              <span className="hidden sm:inline">{prevTab === 'summary' ? 'Ringkasan' : CHECKPOINT_META[prevTab as CheckpointId].label}</span>
              <span className="sm:hidden">Prev</span>
            </button>
          )}
        </div>
        <div>
          {nextTab && (
            <button
              onClick={() => setActiveTab(nextTab as 'summary' | CheckpointId)}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold rounded-xl transition flex items-center gap-2"
            >
              <span className="hidden sm:inline">{nextTab !== 'summary' ? CHECKPOINT_META[nextTab as CheckpointId].label : 'Ringkasan'}</span>
              <span className="sm:hidden">Next</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
