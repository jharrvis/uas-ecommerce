'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  apiGetHasil,
  apiGetMahasiswa,
  apiGetPool,
  apiLogEvent,
  apiRequestRetake,
} from '@/lib/sheets'
import { pickProducts, pickToko } from '@/lib/shuffle'
import { buildInitialCheckpoints, useExamStore } from '@/store/examStore'
import type { CheckpointId, ExamSession, ExamStatus, HasilMahasiswa } from '@/types'

function parseScreenshotList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean)
  }
  if (typeof value !== 'string') return []

  const trimmed = value.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean)
    }
  } catch {}

  return [trimmed]
}

function isTruthy(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  const text = String(value || '').trim().toLowerCase()
  return text === 'true' || text === '1' || text === 'ya' || text === 'yes'
}

function restoreCheckpoints(hasil: HasilMahasiswa | null) {
  const checkpoints = buildInitialCheckpoints()
  if (!hasil) return checkpoints

  const cpList: CheckpointId[] = [
    'cp01', 'cp02', 'cp03', 'cp04', 'cp05', 'cp06', 'cp07', 'cp08', 'cp09',
  ]

  cpList.forEach((cp) => {
    const key = `ss_${cp}` as keyof HasilMahasiswa
    const urls = parseScreenshotList(hasil[key])
    if (urls.length === 0) return

    checkpoints[cp] = {
      status: 'done',
      screenshotUrl: urls[0],
      screenshotUrls: urls,
    }
  })

  return checkpoints
}

function restoreExamStatus(hasil: HasilMahasiswa | null): ExamStatus {
  const rawStatus = String(hasil?.status || '').trim().toLowerCase()
  if (rawStatus === 'submitted') return 'submitted'
  if (rawStatus === 'started') return 'started'
  return 'registered'
}

export default function LoginPage() {
  const router = useRouter()
  const hydrated = useExamStore((s) => s.hydrated)
  const session = useExamStore((s) => s.session)
  const setSession = useExamStore((s) => s.setSession)

  const [nim, setNim] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retakePrompt, setRetakePrompt] = useState<{
    nim: string
    nama: string
    requested: boolean
  } | null>(null)
  const [requestingRetake, setRequestingRetake] = useState(false)

  useEffect(() => {
    if (!hydrated || !session) return
    if (session.status === 'submitted') {
      router.replace(`/ujian/${session.nim}/done`)
      return
    }
    router.replace(`/ujian/${session.nim}`)
  }, [hydrated, router, session])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nimFromQuery = params.get('nim')
    if (nimFromQuery) {
      setNim(nimFromQuery)
    }
    if (params.get('expired') === '1') {
      setError('Waktu ujian habis. Login kembali untuk melihat status ujian Anda.')
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nim.trim()
    if (!trimmed) {
      setError('NIM tidak boleh kosong.')
      return
    }

    setLoading(true)
    setError('')
    setRetakePrompt(null)

    try {
      const [{ mahasiswa, config }, { hasil: hasilList }] = await Promise.all([
        apiGetMahasiswa(trimmed),
        apiGetHasil(),
      ])
      const hasil = hasilList.find(
        (item) => String(item.nim || '').trim() === trimmed
      ) || null

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

      const status = String(hasil?.status || '').trim().toLowerCase()
      if (status === 'timeout') {
        setRetakePrompt({
          nim: trimmed,
          nama: mahasiswa.nama,
          requested: isTruthy(hasil?.retake_requested),
        })
        setLoading(false)
        return
      }

      const { toko: poolToko, produk: poolProduk } = await apiGetPool()
      const tokoSoal = pickToko(poolToko, trimmed)
      const produkPool = poolProduk.filter(
        (p) => String(p.id_toko).trim() === String(tokoSoal.id).trim()
      )

      if (produkPool.length === 0) {
        throw new Error(
          `Toko ${tokoSoal.nama_toko} belum memiliki produk terkait. Periksa kolom id_toko pada sheet Produk.`
        )
      }

      const produkSoal = pickProducts(
        produkPool,
        trimmed,
        Number(config.produk_per_mahasiswa) || produkPool.length
      )

      const checkpoints = restoreCheckpoints(hasil)
      const restoredStatus = restoreExamStatus(hasil)

      const nextSession: ExamSession = {
        nim: mahasiswa.nim,
        nama: mahasiswa.nama,
        kelas: mahasiswa.kelas,
        foto: mahasiswa.foto,
        website_ujian: mahasiswa.website_ujian,
        tokoSoal,
        produkSoal,
        status: restoredStatus,
        registeredAt: hasil?.waktu_login ? String(hasil.waktu_login) : new Date().toISOString(),
        startedAt: hasil?.waktu_mulai ? String(hasil.waktu_mulai) : null,
        submittedAt: hasil?.waktu_submit ? String(hasil.waktu_submit) : null,
        checkpoints,
      }

      setSession(nextSession)

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

  async function handleRequestRetake() {
    if (!retakePrompt) return
    setRequestingRetake(true)
    setError('')
    try {
      await apiRequestRetake(retakePrompt.nim)
      setRetakePrompt((current) => (
        current ? { ...current, requested: true } : current
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengajukan retake.')
    } finally {
      setRequestingRetake(false)
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            UAS Praktik E-Commerce
          </h1>
          <p className="text-slate-500 text-sm mt-1">STIEAMA · AK8IC115 · Genap 2025/2026</p>
        </div>

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
                onChange={(e) => {
                  setNim(e.target.value)
                  setError('')
                  setRetakePrompt(null)
                }}
                placeholder="Contoh: 2022105020"
                maxLength={20}
                disabled={loading || requestingRetake}
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <span className="text-red-400 mt-0.5">⚠️</span>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {retakePrompt && (
              <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-bold text-amber-300">
                  Waktu ujian untuk {retakePrompt.nama} sudah habis.
                </p>
                {retakePrompt.requested ? (
                  <p className="text-sm text-amber-200">
                    Permintaan retake sudah dikirim. Menunggu persetujuan dosen di dashboard.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-amber-200">
                      Apakah Anda akan mengulangi ujian? Jika ya, dosen harus menyetujui retake
                      terlebih dahulu.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleRequestRetake}
                        disabled={requestingRetake}
                        className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-400 disabled:bg-slate-600"
                      >
                        {requestingRetake ? 'Mengirim...' : 'Ya, Ajukan Retake'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRetakePrompt(null)}
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Tidak
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !nim.trim() || requestingRetake || !!retakePrompt}
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
