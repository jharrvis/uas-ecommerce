'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useExamStore } from '@/store/examStore'
import { apiGetConfig, apiGetMahasiswa, apiGetPool, apiLogEvent } from '@/lib/sheets'
import { pickProducts, pickToko } from '@/lib/shuffle'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import { useCountdown } from '@/hooks/useCountdown'
import LeftPanel from '@/components/exam/LeftPanel'
import RightPanel from '@/components/exam/RightPanel'
import ToastContainer, { toast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ViolationBadge from '@/components/ui/ViolationBadge'

export default function UjianPage() {
  const params = useParams<{ nim: string }>()
  const router = useRouter()
  const hydrated = useExamStore((s) => s.hydrated)
  const session = useExamStore((s) => s.session)
  const startExam = useExamStore((s) => s.startExam)
  const submitExam = useExamStore((s) => s.submitExam)
  const clearSession = useExamStore((s) => s.clearSession)
  const setSession = useExamStore((s) => s.setSession)

  const [duration, setDuration] = useState(90)
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(false)
  const [showSubmitDlg, setShowSubmitDlg] = useState(false)
  const [violationCount, setViolationCount] = useState(0)
  const [antiCheatEnabled, setAntiCheatEnabled] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    const initialSession = useExamStore.getState().session

    if (!initialSession) {
      router.replace('/login')
      return
    }
    if (initialSession.nim !== params.nim) {
      router.replace('/login')
      return
    }
    if (initialSession.status === 'submitted') {
      router.replace(`/ujian/${params.nim}/done`)
      return
    }

    let cancelled = false

    const initializeExam = async () => {
      try {
        const { config } = await apiGetConfig()
        if (cancelled) return

        setDuration(Number(config.durasi_ujian_menit) || 90)
        setAntiCheatEnabled(String(config.anti_cheat_enabled || 'OFF').toUpperCase() === 'ON')

        const [{ mahasiswa }, { toko: poolToko, produk: poolProduk }] = await Promise.all([
          apiGetMahasiswa(initialSession.nim),
          apiGetPool(),
        ])
        if (cancelled) return

        const tokoSoal = pickToko(poolToko, initialSession.nim)
        const produkPool = poolProduk.filter(
          (p) => String(p.id_toko).trim() === String(tokoSoal.id).trim()
        )
        const produkSoal = pickProducts(
          produkPool,
          initialSession.nim,
          Number(config.produk_per_mahasiswa) || produkPool.length
        )

        const latestSession = useExamStore.getState().session
        if (!latestSession || latestSession.nim !== initialSession.nim) return

        setSession({
          ...latestSession,
          nama: mahasiswa.nama,
          kelas: mahasiswa.kelas,
          foto: mahasiswa.foto,
          website_ujian: mahasiswa.website_ujian,
          tokoSoal,
          produkSoal,
        })
      } catch {
        // Keep the persisted exam session available when a refresh request fails.
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    initializeExam()
    return () => {
      cancelled = true
    }
  }, [hydrated, params.nim, router, setSession])

  useEffect(() => {
    if (!hydrated || !session) return

    const checkMode = async () => {
      try {
        const { config } = await apiGetConfig()
        const mode = String(config.mode_ujian || 'aktif').toLowerCase()
        if (mode === 'aktif') return

        clearSession()
        useExamStore.persist.clearStorage()
        window.location.replace(`/login?mode=${encodeURIComponent(mode)}&nim=${encodeURIComponent(params.nim)}`)
      } catch {
        // ignore polling failure, keep current exam page active
      }
    }

    const interval = window.setInterval(checkMode, 15000)
    return () => window.clearInterval(interval)
  }, [clearSession, hydrated, params.nim, session])

  const handleExpire = useCallback(() => {
    toast.error('Waktu habis. Anda akan logout otomatis.')
    apiLogEvent('timeout', params.nim)
      .catch(console.warn)
      .finally(() => {
        window.setTimeout(() => {
          clearSession()
          useExamStore.persist.clearStorage()
          window.location.replace(`/login?expired=1&nim=${encodeURIComponent(params.nim)}`)
        }, 1200)
      })
  }, [clearSession, params.nim])

  const { formatted, isDanger, isWarning, pct, isRunning } = useCountdown({
    durationMs: duration * 60 * 1000,
    startedAt: session?.startedAt ?? null,
    onExpire: handleExpire,
  })

  useAntiCheat({
    nim: params.nim,
    enabled: session?.status === 'started' && antiCheatEnabled,
    onViolation: (_, count) => setViolationCount(count),
  })

  const handleStartExam = () => {
    if (session?.startedAt) return
    startExam()
    apiLogEvent('start', params.nim).catch(console.warn)
    toast.success('Timer dimulai! Selamat mengerjakan.')
  }

  const handleLogout = () => {
    clearSession()
    useExamStore.persist.clearStorage()
    window.location.replace('/login')
  }

  const handleSubmitConfirm = async () => {
    setShowSubmitDlg(false)
    if (!session || submitting) return
    setSubmitting(true)
    try {
      submitExam()
      const dur = session.startedAt
        ? Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)
        : 0
      await apiLogEvent('submit', params.nim, { durasi: dur })
      toast.success('Ujian berhasil dikumpulkan.')
      router.push(`/ujian/${params.nim}/done`)
    } catch (err) {
      toast.error('Gagal mengirim. Coba lagi.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!hydrated || !ready || !session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Memuat soal ujian...</p>
        </div>
      </div>
    )
  }

  const isLocked = false

  const timerColor =
    isDanger
      ? 'text-red-500 dark:text-red-400 border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 timer-pulse'
      : isWarning
        ? 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/10'
        : 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      <ToastContainer />

      <header className="flex-shrink-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
          <span className="font-bold text-slate-900 dark:text-white text-sm truncate">UAS Praktik E-Commerce</span>
          <span className="hidden sm:inline text-slate-500 text-xs">STIEAMA · AK8IC115</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ViolationBadge count={violationCount} />

          {session.startedAt && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${timerColor}`}>
              {formatted}
            </div>
          )}

          <span className="hidden md:inline text-slate-500 text-xs border border-slate-700 rounded-lg px-2 py-1 font-mono">
            {session.nim}
          </span>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {isRunning && (
        <div className="h-0.5 bg-slate-200 dark:bg-slate-800 flex-shrink-0">
          <div
            className={`h-full transition-all duration-1000 ${
              isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(0, pct * 100)}%` }}
          />
        </div>
      )}

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[340px_1fr]">
        <div className="hidden md:flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 overflow-hidden">
          <LeftPanel
            durationMinutes={duration}
            timerFormatted={formatted}
            timerDanger={isDanger}
            timerWarning={isWarning}
            timerPct={pct}
            onStartExam={handleStartExam}
          />
        </div>

        <div className="bg-white dark:bg-slate-950 overflow-y-auto scrollbar-thin">
          <div className="md:hidden sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{session.nama}</p>
              <p className="text-slate-500 text-xs">{session.tokoSoal.nama_toko}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {session.status === 'registered' && (
                <button
                  onClick={handleStartExam}
                  className="px-3 py-1.5 bg-sky-500 text-white text-xs font-bold rounded-lg"
                >
                  Mulai
                </button>
              )}
              {session.website_ujian && (
                <a
                  href={session.website_ujian.startsWith('http') ? session.website_ujian : `https://${session.website_ujian}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 text-xs font-semibold rounded-lg"
                >
                  OpenCart
                </a>
              )}
            </div>
          </div>

          <div className="h-full flex flex-col">
            <RightPanel
              isExamLocked={isLocked}
              onSubmit={() => setShowSubmitDlg(true)}
              submitting={submitting}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showSubmitDlg}
        title="Kumpulkan Ujian?"
        description="Pastikan semua checkpoint yang ingin Anda kumpulkan sudah selesai dan screenshot sudah diupload."
        confirmLabel="Ya, Kumpulkan"
        cancelLabel="Kembali"
        onConfirm={handleSubmitConfirm}
        onCancel={() => setShowSubmitDlg(false)}
      />
    </div>
  )
}
