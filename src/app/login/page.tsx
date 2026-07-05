'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGetMahasiswa, apiGetPool, apiLogEvent } from '@/lib/sheets'
import { pickProducts, pickToko } from '@/lib/shuffle'
import { buildInitialCheckpoints, useExamStore } from '@/store/examStore'
import type { ExamSession } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const hydrated = useExamStore((s) => s.hydrated)
  const session = useExamStore((s) => s.session)
  const setSession = useExamStore((s) => s.setSession)

  const [nim, setNim] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hydrated || !session) return
    if (session.status === 'submitted') {
      router.replace(`/ujian/${session.nim}/done`)
      return
    }
    router.replace(`/ujian/${session.nim}`)
  }, [hydrated, router, session])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nim.trim()
    if (!trimmed) { setError('NIM tidak boleh kosong.'); return }

    setLoading(true)
    setError('')

    try {
      // 1. Validasi NIM ke Apps Script
      const { mahasiswa, config } = await apiGetMahasiswa(trimmed)

      // 2. Cek mode ujian
      if (config.mode_ujian === 'selesai') {
        setError('Ujian sudah ditutup. Hubungi dosen pengampu.')
        setLoading(false)
        return
      }
      if (config.mode_ujian === 'jeda') {
        setError('Ujian sedang dijeda oleh dosen. Silakan tunggu.')
        setLoading(false)
        return
      }

      // 3. Ambil pool soal
      const { toko: poolToko, produk: poolProduk } = await apiGetPool()

      // 4. Seeded shuffle — generate soal
      const tokoSoal = pickToko(poolToko, trimmed)
      const produkPool = poolProduk.filter(
        (p) => String(p.id_toko).trim() === String(tokoSoal.id).trim()
      )

      if (produkPool.length === 0) {
        throw new Error(`Toko ${tokoSoal.nama_toko} belum memiliki produk terkait. Periksa kolom id_toko pada sheet Produk.`)
      }

      const produkSoal = pickProducts(
        produkPool,
        trimmed,
        Number(config.produk_per_mahasiswa) || produkPool.length
      )

      // 5. Build initial checkpoints
      const checkpoints = buildInitialCheckpoints()

      // 6. Build session
      const session: ExamSession = {
        nim: mahasiswa.nim,
        nama: mahasiswa.nama,
        kelas: mahasiswa.kelas,
        foto: mahasiswa.foto,
        website_ujian: mahasiswa.website_ujian,
        tokoSoal,
        produkSoal,
        status: 'registered',
        registeredAt: new Date().toISOString(),
        startedAt: null,
        submittedAt: null,
        checkpoints,
      }

      setSession(session)

      // 7. Log ke Sheets (fire and forget)
      apiLogEvent('login', trimmed, {
        id_toko: tokoSoal.id,
        id_produk: produkSoal.map((p) => p.id),
      }).catch(console.warn)

      router.push(`/ujian/${trimmed}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-slate-500 text-sm">Memulihkan sesi...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">UAS Praktik E-Commerce</h1>
          <p className="text-slate-500 text-sm mt-1">STIEAMA · AK8IC115 · Genap 2025/2026</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Masuk dengan NIM</h2>
          <p className="text-slate-500 text-sm mb-6">
            Soal akan diacak otomatis berdasarkan NIM Anda.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nomor Induk Mahasiswa (NIM)
              </label>
              <input
                type="text"
                value={nim}
                onChange={(e) => { setNim(e.target.value); setError('') }}
                placeholder="Contoh: 2022105020"
                maxLength={20}
                disabled={loading}
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <span className="text-red-400 mt-0.5">⚠️</span>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

              <button
              type="submit"
              disabled={loading || !nim.trim()}
              className="w-full py-3 px-6 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memvalidasi NIM...
                </>
              ) : (
                'Masuk & Lihat Soal →'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Hubungi dosen jika NIM tidak dikenali oleh sistem.
        </p>
      </div>
    </div>
  )
}
