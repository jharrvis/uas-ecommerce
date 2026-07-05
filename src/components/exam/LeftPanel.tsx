'use client'

import Image from 'next/image'
import { useExamStore } from '@/store/examStore'
import { CP_ORDER, CHECKPOINT_META } from '@/types'

interface LeftPanelProps {
  durationMinutes: number
  timerFormatted: string
  timerDanger: boolean
  timerWarning: boolean
  timerPct: number
  onStartExam: () => void
}

export default function LeftPanel({
  durationMinutes, timerFormatted, timerDanger, timerWarning, timerPct, onStartExam
}: LeftPanelProps) {
  const session        = useExamStore((s) => s.session)
  const completedCount = useExamStore((s) => s.completedCount)

  if (!session) return null

  const total     = CP_ORDER.length
  const completed = completedCount()
  const pctDone   = Math.round((completed / total) * 100)

  const statusConfig = {
    registered: { color: 'bg-slate-200 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-500/30', label: 'Belum Dimulai',       dot: 'bg-slate-400' },
    started:    { color: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30',       label: 'Sedang Dikerjakan',   dot: 'bg-sky-400 animate-pulse' },
    submitted:  { color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30', label: 'Sudah Dikumpulkan', dot: 'bg-emerald-400' },
    locked:     { color: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30',       label: 'Waktu Habis',         dot: 'bg-red-400' },
  }[session.status]

  const timerColor =
    timerDanger  ? 'text-red-500 dark:text-red-400 border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10' :
    timerWarning ? 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10' :
                   'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'

  return (
    <aside className="h-full flex flex-col gap-3 overflow-y-auto scrollbar-thin pr-1">

      {/* ── Identity ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          {session.foto ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-sky-500/40 flex-shrink-0">
              <Image
                src={session.foto} alt={session.nama} fill className="object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-sky-500/15 border-2 border-sky-500/30 flex items-center justify-center flex-shrink-0 text-xl">
              🎓
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">{session.nama}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">NIM: <span className="font-mono">{session.nim}</span></p>
            <p className="text-slate-500 text-xs">Kelas {session.kelas}</p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${statusConfig.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </div>
      </div>

      {/* ── Timer ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex-shrink-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">⏱ Waktu Ujian</p>
        {session.startedAt ? (
          <>
            <div className={`flex items-center justify-between px-3 py-2.5 border rounded-xl mb-2 ${timerColor} ${timerDanger ? 'timer-pulse' : ''}`}>
              <span className="text-base">{timerDanger ? '🔴' : timerWarning ? '🟡' : '🟢'}</span>
              <span className="font-mono text-2xl font-black tracking-wider">{timerFormatted}</span>
              <span className="text-xs opacity-60">{durationMinutes}m</span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timerDanger ? 'bg-red-500' : timerWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(0, timerPct * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center px-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-700/30 mb-3">
              <span className="font-mono text-2xl font-black text-slate-500 tracking-wider">
                {String(Math.floor(durationMinutes / 60)).padStart(2,'0')}:{String(durationMinutes % 60).padStart(2,'0')}
              </span>
            </div>
            <button
              onClick={onStartExam}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              ▶ Mulai Kerjakan
            </button>
            <p className="text-slate-500 dark:text-slate-600 text-[10px] text-center mt-2">Timer mulai saat tombol diklik</p>
          </>
        )}
      </div>

      {/* ── Website OpenCart ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex-shrink-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">🌐 Website Praktek</p>
        {session.website_ujian ? (
          <>
            <p className="text-sky-600 dark:text-sky-400 text-xs font-mono break-all mb-3 leading-relaxed">{session.website_ujian}</p>
            <a
              href={session.website_ujian}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 border border-sky-200 dark:border-sky-500/30 text-sky-600 dark:text-sky-400 text-sm font-semibold rounded-xl transition w-full"
            >
              Buka OpenCart ↗
            </a>
          </>
        ) : (
          <div className="flex items-start gap-2 py-2.5 px-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
            <span className="flex-shrink-0">⚠️</span>
            <p className="text-amber-600 dark:text-amber-400 text-xs">URL belum diisi. Hubungi dosen pengawas.</p>
          </div>
        )}
      </div>

      {/* ── Progress ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">📋 Progress</p>
          <span className="text-xs font-bold text-sky-500 dark:text-sky-400">{completed}/{total}</span>
        </div>

        {/* Overall bar */}
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3 flex-shrink-0">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pctDone}%` }}
          />
        </div>

        {/* Per-CP list */}
        <div className="space-y-1 overflow-y-auto scrollbar-thin flex-1">
          {CP_ORDER.map((cp) => {
            const meta    = CHECKPOINT_META[cp]
            const cpState = session.checkpoints[cp]
            const isDone  = cpState.status === 'done'
            const isAct   = cpState.status === 'active'
            const isLock  = cpState.status === 'locked'

            return (
              <div key={cp} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all ${
                isDone ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' :
                isAct  ? 'bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 ring-1 ring-sky-200 dark:ring-sky-500/20' :
                         'border border-transparent'
              }`}>
                <span className={`text-base flex-shrink-0 ${isLock ? 'opacity-25' : ''}`}>
                  {isDone ? '✅' : isAct ? '⚡' : '🔒'}
                </span>
                <span className={`flex-1 truncate font-medium leading-tight ${
                  isDone ? 'text-emerald-600 dark:text-emerald-400' : isAct ? 'text-sky-600 dark:text-sky-300' : 'text-slate-500 dark:text-slate-600'
                }`}>
                  {meta.label}
                </span>
                <span className={`flex-shrink-0 text-xs font-bold ${
                  isDone ? 'text-emerald-500' : isAct ? 'text-sky-500' : 'text-slate-400 dark:text-slate-700'
                }`}>
                  {meta.bobot}pt
                </span>
              </div>
            )
          })}
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 mt-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Total bobot</span>
            <span className="font-bold text-sky-500 dark:text-sky-400">100 poin</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
