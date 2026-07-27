'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ResultDetail {
  id: string
  label: string
  weight: number
  status: 'completed' | 'not_found' | 'verification_failed'
  earned: number
}

interface CheckpointResult {
  label: string
  tab: string
  bobot: number
  rawScore: number
  weightedScore: number
  maxScore: number
  status: string
  completedCount: number
  notFoundCount: number
  totalItems: number
  details: ResultDetail[]
}

interface StudentResult {
  nim: string
  studentName: string
  className: string
  websiteUrl: string
  storeId: string
  storeName: string
  assignedProductIds: string[]
  score: number
  status: string
  manualReview: boolean
  manualReviewReasons: string[]
  checkpoints: Record<string, CheckpointResult>
  summary?: string
}

export default function GradePage() {
  const router = useRouter()
  const [nim, setNim] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<StudentResult | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('grade_nim')
    if (saved) {
      setNim(saved)
      loadResult(saved)
    }
  }, [])

  async function loadResult(nimValue: string) {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const resp = await fetch(`/results/${nimValue}.json`)
      if (!resp.ok) throw new Error('Data tidak ditemukan')
      const json = await resp.json()
      const data = Array.isArray(json) ? json[0] : json
      setResult(data as StudentResult)
      sessionStorage.setItem('grade_nim', nimValue)
    } catch {
      setError('NIM tidak ditemukan atau hasil ujian belum tersedia')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanNim = nim.trim()
    if (!cleanNim) return
    loadResult(cleanNim)
  }

  function handleLogout() {
    sessionStorage.removeItem('grade_nim')
    setNim('')
    setResult(null)
  }

  if (result) {
    return <GradeReport result={result} onBack={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Hasil Ujian</h1>
          <p className="text-slate-400">Masukkan NIM untuk melihat hasil evaluasi</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              NIM
            </label>
            <input
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Masukkan NIM..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-lg tracking-wider"
              autoFocus
            />
          </div>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !nim.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold transition text-lg"
          >
            {loading ? 'Memuat...' : 'Lihat Hasil'}
          </button>
        </form>
      </div>
    </div>
  )
}

function GradeReport({ result, onBack }: { result: StudentResult; onBack: () => void }) {
  const cpOrder = ['cp01', 'cp02', 'cp03', 'cp04', 'cp05', 'cp06', 'cp07', 'cp08', 'cp09']
  const [openCp, setOpenCp] = useState<string | null>(null)

  const scoreClass = result.score >= 80 ? 'text-emerald-400' : result.score >= 60 ? 'text-amber-400' : 'text-red-400'
  const statusBadge = result.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : result.score >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
  const statusLabel = result.score >= 80 ? 'Lulus' : result.score >= 60 ? 'Cukup' : 'Kurang'

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 md:p-8 mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">Laporan Hasil Ujian</h1>
                <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${statusBadge}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="text-slate-400 text-sm">OpenCart 1.5.6.4 — Hybrid DB + Playwright</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${scoreClass}`}>{result.score}</div>
              <div className="text-slate-400 text-sm">dari 100</div>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-slate-800 rounded-xl p-5 mb-6 shadow-lg grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'NIM', value: result.nim },
            { label: 'Nama', value: result.studentName },
            { label: 'Kelas', value: result.className || '-' },
            { label: 'Toko', value: `${result.storeName || '-'} (${result.storeId || ''})` },
            { label: 'Produk', value: (result.assignedProductIds || []).join(', ') },
            { label: 'Website', value: result.websiteUrl, link: true },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{item.label}</div>
              <div className="text-sm text-white font-medium truncate">
                {item.link ? (
                  <a href={item.value} target="_blank" className="text-blue-400 hover:underline">{item.value}</a>
                ) : item.value}
              </div>
            </div>
          ))}
        </div>

        {/* CP Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {cpOrder.map((cpId) => {
            const cp = result.checkpoints?.[cpId]
            if (!cp) return null
            const score = cp.rawScore ?? 0
            const sClass = score >= 80 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
            const barClass = score >= 80 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
            const borderClass = cp.status === 'lengkap' ? 'border-l-emerald-500' : cp.status === 'parsial' ? 'border-l-amber-500' : 'border-l-red-500'
            const open = openCp === cpId

            return (
              <div
                key={cpId}
                className={`bg-slate-800 rounded-xl p-5 shadow-lg border-l-4 ${borderClass} cursor-pointer transition hover:bg-slate-750`}
                onClick={() => setOpenCp(open ? null : cpId)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-white font-semibold text-sm">{cp.label}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{cp.tab || ''}</div>
                  </div>
                  <div className={`text-xl font-bold ${sClass}`}>{score}</div>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${barClass} transition-all`} style={{ width: `${score}%` }} />
                </div>
                <div className="text-xs text-slate-500">
                  {cp.completedCount} selesai &middot; {cp.notFoundCount} belum &middot; bobot {cp.bobot}%
                </div>
                {open && (
                  <div className="mt-3 pt-3 border-t border-slate-700 space-y-1">
                    {cp.details.map((d) => {
                      const dot = d.status === 'completed' ? 'bg-emerald-500' : d.status === 'not_found' ? 'bg-red-500' : 'bg-amber-500'
                      const pts = d.status === 'completed' ? 'text-emerald-400' : 'text-red-400'
                      const label = d.status === 'completed' ? 'Selesai' : d.status === 'not_found' ? 'Tidak ditemukan' : 'Gagal'
                      return (
                        <div key={d.id} className="flex justify-between items-center py-1 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className={`w-2 h-2 rounded-full ${dot}`} />
                            <span>{d.label}</span>
                          </div>
                          <span className={`text-xs font-medium ${pts}`}>{d.earned}/{d.weight} {label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        {result.summary && (
          <div className="bg-slate-800 rounded-xl p-5 mb-6 shadow-lg">
            <h3 className="text-white font-semibold mb-2">Ringkasan</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{result.summary}</p>
          </div>
        )}

        {/* Manual Review */}
        {result.manualReviewReasons?.length > 0 && (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-5 mb-6 shadow-lg">
            <h3 className="text-amber-400 font-semibold mb-2">Perlu Review Manual</h3>
            <ul className="list-disc list-inside text-amber-300 text-sm space-y-1">
              {result.manualReviewReasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {/* Back button */}
        <div className="text-center">
          <button onClick={onBack} className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition text-sm">
            &larr; Kembali
          </button>
        </div>
      </div>
    </div>
  )
}
