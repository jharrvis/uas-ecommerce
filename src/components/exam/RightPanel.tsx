'use client'

import { useExamStore } from '@/store/examStore'
import Checkpoint from './Checkpoint'
import { CP_ORDER } from '@/types'

interface RightPanelProps {
  isExamLocked: boolean
  onSubmit: () => void
  submitting: boolean
}

export default function RightPanel({ isExamLocked, onSubmit, submitting }: RightPanelProps) {
  const session = useExamStore((s) => s.session)
  const completedCount = useExamStore((s) => s.completedCount)

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
  const manufacturers = produk.reduce<string[]>((acc, item) => {
    if (!acc.includes(item.manufacturer)) acc.push(item.manufacturer)
    return acc
  }, [])

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  return (
    <main className="h-full flex flex-col overflow-y-auto scrollbar-thin">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 mb-5 flex-shrink-0">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-2xl flex-shrink-0">
            🏪
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-1">Soal Ujian Anda</div>
            <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight">{toko.nama_toko}</h2>
            <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
              <span>📍</span>{toko.alamat}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { icon: '✉️', label: 'Email', value: toko.email },
            { icon: '📞', label: 'Telepon', value: toko.telepon },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-2.5 bg-slate-700/40 rounded-xl">
              <span className="text-base flex-shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-semibold">{item.label}</p>
                <p className="text-slate-300 text-xs font-mono truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Latar Belakang</p>
          <p className="text-slate-300 text-sm leading-relaxed">{toko.deskripsi_bisnis}</p>
        </div>

        {eventPromo.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Promosi</p>
            <div className="flex flex-wrap gap-2">
              {eventPromo.map((ev) => (
                <span key={ev} className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-semibold rounded-full">
                  {ev}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Produk yang Akan Anda Input ({produk.length} produk)
          </p>
          <div className="space-y-2">
            {produk.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-700/40 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-200 text-sm font-semibold leading-tight truncate">{p.nama_produk}</p>
                  <p className="text-slate-400 text-xs">{p.manufacturer} · {fmt(p.harga)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-4 mb-5 flex-shrink-0">
        <h3 className="font-bold text-sky-300 mb-3 flex items-center gap-2">
          <span>📋</span> Instruksi Pengerjaan
        </h3>
        <ol className="space-y-2 text-sm text-slate-300">
          {[
            `Lengkapi data toko <strong>${toko.nama_toko}</strong> di OpenCart (nama, alamat, email, telepon, logo).`,
            `Tambahkan manufacturer ${manufacturers.join(' dan ')} beserta logonya ke carousel halaman depan.`,
            'Buat kategori yang diperlukan untuk produk-produk Anda.',
            `Input ${produk.length} produk lengkap sesuai data di masing-masing checkpoint.`,
            `Terapkan strategi diskon dan harga spesial untuk event ${eventPromo.slice(0, 2).join(' dan ') || 'promosi'}.`,
            'Pasang banner slideshow produk Anda di halaman depan toko.',
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: text }} />
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 px-1">
          <span>🎯</span> 9 Checkpoint Pengerjaan
          <span className="ml-auto text-xs font-normal text-slate-500">{completed}/9 selesai</span>
        </h3>
        {CP_ORDER.map((cp) => (
          <Checkpoint
            key={cp}
            cp={cp}
            nim={nim}
            toko={toko}
            produk={produk}
            isExamLocked={isExamLocked}
          />
        ))}
      </div>

      {session.status === 'submitted' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center flex-shrink-0">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-emerald-300 font-bold text-lg">Ujian Sudah Dikumpulkan</p>
          <p className="text-slate-400 text-sm mt-1">Tunggu penilaian dari dosen pengampu.</p>
        </div>
      ) : session.status === 'started' ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-slate-200 font-bold">Kumpulkan Ujian</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {allDone
                  ? 'Semua checkpoint selesai, siap dikumpulkan.'
                  : `${CP_ORDER.length - completed} checkpoint belum selesai`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-sky-400">{completed}</p>
              <p className="text-xs text-slate-500">/ {CP_ORDER.length} CP</p>
            </div>
          </div>

          {!allDone && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3 text-xs text-amber-300">
              <span>⚠️</span>
              Anda boleh mengerjakan checkpoint dalam urutan bebas, tetapi semua bukti harus lengkap sebelum dikumpulkan.
            </div>
          )}

          <button
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengirim...</>
            ) : (
              'Selesai & Kumpulkan'
            )}
          </button>
        </div>
      ) : null}
    </main>
  )
}
