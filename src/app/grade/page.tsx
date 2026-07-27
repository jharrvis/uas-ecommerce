'use client'

import { useState, useEffect, useRef } from 'react'
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

interface Evidence {
  screenshots: string[]
  storefrontOk?: boolean
  loginOk?: boolean
  dbEvaluationUsed?: boolean
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
  evidence?: Evidence
  summary?: string
}

function RadialScore({ value, size = 160 }: { value: number; size?: number }) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'
  const label = value >= 80 ? 'Lulus' : value >= 60 ? 'Cukup' : 'Kurang'
  const bg = value >= 80 ? 'from-emerald-500/20 to-emerald-500/5' : value >= 60 ? 'from-amber-500/20 to-amber-500/5' : 'from-red-500/20 to-red-500/5'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke}
          className="text-slate-200 dark:text-slate-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          className="transition-all duration-1500 ease-out"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tracking-tight" style={{ color }}>{value}</span>
          <span className={`text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r ${bg} ${value >= 80 ? 'text-emerald-600 dark:text-emerald-400' : value >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
          {label}
        </span>
      </div>
    </div>
  )
}

function ScoreBar({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(value), 200); return () => clearTimeout(t) }, [value])
  const h = size === 'md' ? 'h-3' : 'h-2'
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className={`${h} bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden`}>
      <div className={`${h} ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${w}%` }} />
    </div>
  )
}

function ScreenshotGallery({ screenshots }: { screenshots: string[] }) {
  const labels = ['Storefront', 'Kategori (Admin)', 'Produk (Admin)']
  const [selected, setSelected] = useState(0)

  if (!screenshots?.length) return null

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {screenshots.map((_, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              selected === i
                ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}>
            {labels[i] || `Screenshot ${i + 1}`}
          </button>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50">
        <a href={screenshots[selected]} target="_blank" rel="noopener noreferrer">
          <img src={screenshots[selected]} alt={`Screenshot ${selected}`}
            className="w-full object-contain max-h-[400px] hover:opacity-90 transition" />
        </a>
      </div>
    </div>
  )
}

export default function GradePage() {
  const router = useRouter()
  const [nim, setNim] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<StudentResult | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('grade_nim')
    if (saved) { setNim(saved); loadResult(saved) }
  }, [])

  async function loadResult(nimValue: string) {
    setLoading(true); setError(''); setResult(null)
    try {
      const resp = await fetch(`/results/${nimValue}.json`)
      if (!resp.ok) throw new Error('Data tidak ditemukan')
      const json = await resp.json()
      const data = Array.isArray(json) ? json[0] : json
      setResult(data as StudentResult)
      sessionStorage.setItem('grade_nim', nimValue)
    } catch { setError('NIM tidak ditemukan atau hasil ujian belum tersedia') }
    finally { setLoading(false) }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanNim = nim.trim()
    if (!cleanNim) return
    loadResult(cleanNim)
  }

  function handleLogout() {
    sessionStorage.removeItem('grade_nim')
    setNim(''); setResult(null)
  }

  if (result) return <GradeReport result={result} onBack={handleLogout} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Hasil Ujian</h1>
          <p className="text-slate-500 dark:text-slate-400">Masukkan NIM untuk melihat hasil evaluasi</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200 dark:border-slate-700 p-8 transition-colors">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">NIM</label>
            <input type="text" value={nim} onChange={(e) => setNim(e.target.value)}
              placeholder="Masukkan NIM..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-lg tracking-wider"
              autoFocus />
          </div>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading || !nim.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold transition shadow-lg shadow-blue-500/25 text-lg">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Memuat...
              </span>
            ) : 'Lihat Hasil'}
          </button>
        </form>
      </div>
    </div>
  )
}

function GradeReport({ result, onBack }: { result: StudentResult; onBack: () => void }) {
  const cpOrder = ['cp01', 'cp02', 'cp03', 'cp04', 'cp05', 'cp06', 'cp07', 'cp08', 'cp09']
  const [openCp, setOpenCp] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(true)
  const [activeTab, setActiveTab] = useState<'score' | 'screenshots'>('score')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-[fadeIn_0.5s_ease-out]">

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-200 dark:border-slate-700 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <RadialScore value={result.score} size={160} />
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Laporan Hasil Ujian</h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">OpenCart 1.5.6.4 — Hybrid DB + Playwright</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {[
                  { label: 'NIM', value: result.nim },
                  { label: 'Nama', value: result.studentName },
                  { label: 'Kelas', value: result.className || '-' },
                  { label: 'Toko', value: result.storeName || '-' },
                  { label: 'Produk', value: (result.assignedProductIds || []).join(', ') },
                  { label: 'Website', value: result.websiteUrl, link: true },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{item.label}</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {item.link ? <a href={item.value} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">{item.value}</a> : item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab: Scores / Screenshots */}
        <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 rounded-xl p-1 w-fit">
          {[
            { id: 'score', label: 'Nilai', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'screenshots', label: 'Screenshots', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as 'score' | 'screenshots')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'screenshots' && result.evidence?.screenshots && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-200 dark:border-slate-700 p-6 animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Screenshot Evaluasi</h2>
            <ScreenshotGallery screenshots={result.evidence.screenshots} />
          </div>
        )}

        {activeTab === 'score' && (
          <>
            {/* CP Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cpOrder.map((cpId, idx) => {
                const cp = result.checkpoints?.[cpId]
                if (!cp) return null
                const score = cp.rawScore ?? 0
                const open = openCp === cpId
                const borderColor = score >= 80 ? 'border-l-emerald-500' : score >= 40 ? 'border-l-amber-500' : 'border-l-red-500'

                return (
                  <div key={cpId}
                    className={`bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 border-l-4 ${borderColor} overflow-hidden transition-all hover:shadow-lg animate-[slideUp_0.4s_ease-out]`}
                    style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}>
                    <button onClick={() => setOpenCp(open ? null : cpId)} className="w-full text-left p-5 focus:outline-none">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase">{cpId}</span>
                            <span className="text-slate-900 dark:text-white font-semibold truncate">{cp.label}</span>
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{cp.tab || ''}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xl font-bold ${score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {score}
                          </span>
                          <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <ScoreBar value={score} />
                      <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{cp.completedCount} selesai · {cp.notFoundCount} belum</span>
                        <span>Bobot {cp.bobot}%</span>
                      </div>
                    </button>
                    {open && (
                      <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700 animate-[fadeIn_0.2s_ease-out]">
                        <div className="pt-3 space-y-1">
                          {cp.details.map((d) => {
                            const dotColor = d.status === 'completed' ? 'bg-emerald-500' : d.status === 'not_found' ? 'bg-red-500' : 'bg-amber-500'
                            const label = d.status === 'completed' ? 'Selesai' : d.status === 'not_found' ? 'Tidak ditemukan' : 'Gagal'
                            return (
                              <div key={d.id} className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-sm">
                                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 min-w-0">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                                  <span className="truncate">{d.label}</span>
                                </div>
                                <span className={`text-xs font-medium flex-shrink-0 ml-2 ${
                                  d.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {d.earned}/{d.weight}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            {result.summary && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button onClick={() => setShowSummary(!showSummary)}
                  className="w-full flex items-center justify-between p-5 focus:outline-none">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-slate-900 dark:text-white font-semibold">Ringkasan</span>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${showSummary ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showSummary && (
                  <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700 animate-[fadeIn_0.2s_ease-out]">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap pt-3">
                      {result.summary}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Manual Review */}
            {result.manualReviewReasons?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold text-sm">Perlu Review Manual</span>
                </div>
                <ul className="space-y-1">
                  {result.manualReviewReasons.map((r, i) => (
                    <li key={i} className="text-amber-600 dark:text-amber-300 text-sm flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Back */}
        <div className="text-center">
          <button onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kembali
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
