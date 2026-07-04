'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiGetHasil, apiGetSummary, apiUpdateNilai, apiExportNilai } from '@/lib/sheets'
import type { HasilMahasiswa } from '@/types'
import { CP_ORDER, CHECKPOINT_META } from '@/types'
import DataMahasiswa from '@/components/dosen/DataMahasiswa'
import ImageViewerModal from '@/components/ui/ImageViewerModal'

const DOSEN_CODE = process.env.NEXT_PUBLIC_DOSEN_CODE || 'DOSEN2026!'

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    registered: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    started:    'bg-sky-500/20 text-sky-400 border-sky-500/30',
    submitted:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    timeout:    'bg-red-500/20 text-red-400 border-red-500/30',
    scored:     'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }
  const label: Record<string, string> = {
    registered:'Belum Mulai', started:'Sedang', submitted:'Selesai', timeout:'Timeout', scored:'Dinilai'
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[status] || map.registered}`}>
      {label[status] || status}
    </span>
  )
}

/* ── Score Drawer ── */
function ScoreDrawer({ mhs, onClose, onSaved }: {
  mhs: HasilMahasiswa
  onClose: () => void
  onSaved: () => void
}) {
  const mhsRecord = mhs as unknown as Record<string, unknown>
  const [nilai, setNilai]   = useState<Record<string, number>>({})
  const [catatan, setCatatan] = useState(mhs.catatan || '')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const init: Record<string, number> = {}
    CP_ORDER.forEach((cp) => {
      const key = `nilai_${cp}` as keyof HasilMahasiswa
      init[cp] = Number(mhsRecord[key]) || 0
    })
    setNilai(init)
  }, [mhs, mhsRecord])

  const total = CP_ORDER.reduce((sum, cp) => {
    const meta = CHECKPOINT_META[cp]
    return sum + (nilai[cp] || 0) / 100 * meta.bobot
  }, 0)

  const grade = total >= 85 ? 'A' : total >= 75 ? 'B' : total >= 65 ? 'C' : total >= 55 ? 'D' : 'E'

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiUpdateNilai(mhs.nim, nilai, catatan)
      setSaved(true)
      setTimeout(() => { setSaved(false); onSaved() }, 1500)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">

        <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <div>
            <p className="font-bold text-white">{mhs.nama}</p>
            <p className="text-slate-400 text-xs">NIM: {mhs.nim} · Kelas {mhs.kelas}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          <div className="bg-slate-800 rounded-xl p-3 text-xs space-y-1">
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-2">Soal yang Diterima</p>
            <p className="text-slate-300"><span className="text-slate-500">Toko:</span> {mhs.id_toko}</p>
            <p className="text-slate-300"><span className="text-slate-500">Produk:</span> {mhs.id_produk}</p>
            <p className="text-slate-300"><span className="text-slate-500">Durasi:</span> {mhs.durasi_menit ? `${mhs.durasi_menit} menit` : '—'}</p>
            {mhs.drive_folder_url && (
              <a href={mhs.drive_folder_url} target="_blank" rel="noopener noreferrer"
                className="text-sky-400 underline hover:text-sky-300 block">
                📁 Buka folder screenshot ↗
              </a>
            )}
          </div>

          <div>
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-2">Screenshot per Checkpoint</p>
            <div className="grid grid-cols-3 gap-2">
              {CP_ORDER.map((cp) => {
                const ssKey = `ss_${cp}` as keyof HasilMahasiswa
                const url = mhsRecord[ssKey] as string
                const meta = CHECKPOINT_META[cp]
                return (
                  <div key={cp} className="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700 relative">
                    {url ? (
                      <button
                        onClick={() => setPreviewUrl(url)}
                        className="w-full h-full flex flex-col items-center justify-center text-emerald-400 text-xs font-bold hover:bg-slate-700 transition gap-1"
                      >
                        <span>{meta.icon}</span>
                        <span>✅ {cp.toUpperCase()}</span>
                      </button>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                        — {cp.toUpperCase()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-3">Input Nilai per Checkpoint</p>
            <div className="space-y-2">
              {CP_ORDER.map((cp) => {
                const meta = CHECKPOINT_META[cp]
                return (
                  <div key={cp} className="flex items-center gap-3">
                    <span className="text-base w-6 flex-shrink-0">{meta.icon}</span>
                    <span className="flex-1 text-slate-300 text-xs truncate">{meta.label}</span>
                    <span className="text-slate-600 text-xs w-10 text-right flex-shrink-0">/{meta.bobot}pt</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={nilai[cp] ?? 0}
                      onChange={(e) => setNilai((prev) => ({ ...prev, [cp]: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                      className="w-16 px-2 py-1 bg-slate-800 border border-slate-600 text-white text-sm rounded-lg text-center focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-800 rounded-xl p-3">
            <span className="text-slate-300 font-bold">Nilai Total</span>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-sky-400">{Math.round(total)}</span>
              <span className="text-slate-400 text-sm ml-1">/ 100</span>
              <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-sm font-bold rounded-full">{grade}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Catatan Dosen (opsional)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl focus:outline-none focus:border-sky-500 resize-none"
              placeholder="Catatan untuk mahasiswa..."
            />
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-slate-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            {saved ? '✅ Tersimpan!' : saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
            ) : '💾 Simpan Nilai'}
          </button>
        </div>
      </div>

      {previewUrl && (
        <ImageViewerModal
          url={previewUrl}
          title={`Screenshot — ${mhs.nama}`}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </div>
  )
}

/* ── Main Dashboard ── */
export default function DosenPage() {
  const [authed, setAuthed]   = useState(false)
  const [code, setCode]       = useState('')
  const [codeErr, setCodeErr] = useState('')
  const [hasil, setHasil]     = useState<HasilMahasiswa[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [filterKelas, setFilterKelas] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [selected, setSelected] = useState<HasilMahasiswa | null>(null)
  const [exporting, setExporting] = useState(false)
  const [activeTab, setActiveTab] = useState<'hasil' | 'mahasiswa'>('hasil')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const h = await apiGetHasil()
      setHasil(h.hasil)
    } catch (e) {
      setError('Gagal memuat data hasil ujian: ' + (e instanceof Error ? e.message : 'unknown'))
    }
    try {
      const s = await apiGetSummary()
      setSummary(s.summary as unknown as Record<string, number>)
    } catch (e) {
      console.error('Gagal memuat summary:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authed) {
      fetchData()
      const interval = setInterval(fetchData, 10000)
      return () => clearInterval(interval)
    }
  }, [authed, fetchData])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim() === DOSEN_CODE) {
      setAuthed(true)
      sessionStorage.setItem('dosen_auth', '1')
    } else {
      setCodeErr('Kode akses salah.')
    }
  }

  useEffect(() => {
    if (sessionStorage.getItem('dosen_auth') === '1') setAuthed(true)
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await apiExportNilai(filterKelas !== 'ALL' ? filterKelas : undefined)
      const r = res as { spreadsheet_url?: string }
      if (r.spreadsheet_url) window.open(r.spreadsheet_url, '_blank')
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  const filtered = hasil.filter((h) => {
    if (filterKelas !== 'ALL' && h.kelas?.trim().toUpperCase() !== filterKelas) return false
    if (filterStatus !== 'ALL' && h.status !== filterStatus) return false
    return true
  })

  const classOptions: string[] = Array.from(
    new Set(
      hasil
        .map((item) => item.kelas?.trim().toUpperCase())
        .filter((k): k is string => !!k)
    )
  ).sort()

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm fade-in">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-3xl mx-auto mb-3">👩‍🏫</div>
            <h1 className="text-xl font-bold text-white">Dashboard Dosen</h1>
            <p className="text-slate-400 text-sm mt-1">UAS E-Commerce — STIEAMA</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Kode Akses Dosen</label>
                <input
                  type="password"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setCodeErr('') }}
                  placeholder="Masukkan kode akses"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-purple-500 transition"
                />
                {codeErr && <p className="text-red-400 text-xs mt-1">{codeErr}</p>}
              </div>
              <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition">
                Masuk →
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const sumData = summary as { total?: number; registered?: number; started?: number; submitted?: number; timeout?: number; scored?: number }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px] shadow-purple-400" />
          <span className="font-bold text-white">Dashboard Dosen — UAS E-Commerce</span>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'hasil' && (
            <>
              <button onClick={fetchData} disabled={loading}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 transition flex items-center gap-1.5">
                {loading ? <div className="w-3 h-3 border border-slate-400/30 border-t-slate-300 rounded-full animate-spin" /> : '🔄'} Refresh
              </button>
              <button onClick={handleExport} disabled={exporting}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5">
                {exporting ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : '📥'} Ekspor Nilai
              </button>
            </>
          )}
          <button onClick={() => { sessionStorage.removeItem('dosen_auth'); setAuthed(false) }}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-lg hover:bg-slate-700 transition">
            Keluar
          </button>
        </div>
      </header>

      <div className="p-6 space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: sumData.total || 0,      color: 'text-slate-300' },
            { label: 'Belum Mulai', value: sumData.registered || 0, color: 'text-slate-400' },
            { label: 'Sedang',  value: sumData.started || 0,   color: 'text-sky-400' },
            { label: 'Selesai', value: sumData.submitted || 0, color: 'text-emerald-400' },
            { label: 'Timeout', value: sumData.timeout || 0,   color: 'text-red-400' },
            { label: 'Dinilai', value: sumData.scored || 0,    color: 'text-purple-400' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
              <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800">
          {([
            { key: 'hasil', label: '📊 Hasil Ujian' },
            { key: 'mahasiswa', label: '👥 Data Mahasiswa' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
                activeTab === tab.key
                  ? 'bg-slate-800 text-white border border-b-slate-800 border-slate-700 -mb-px'
                  : 'text-slate-500 hover:text-slate-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Hasil Ujian */}
        {activeTab === 'hasil' && (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-semibold">Filter:</span>
              {['ALL', ...classOptions].map((k) => (
                <button key={k} onClick={() => setFilterKelas(k)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    filterKelas === k ? 'bg-sky-500 border-sky-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}>
                  {k === 'ALL' ? 'Semua Kelas' : `Kelas ${k}`}
                </button>
              ))}
              <span className="w-px h-4 bg-slate-700 mx-1" />
              {['ALL', 'registered', 'started', 'submitted', 'timeout', 'scored'].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    filterStatus === s ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}>
                  {s === 'ALL' ? 'Semua Status' : s}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-500">{filtered.length} mahasiswa</span>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 text-xs">
                      {['NIM','Nama','Kelas','Status','Mulai','Durasi','CP Done','Nilai','Aksi'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">
                        {loading ? 'Memuat data...' : 'Belum ada data ujian'}
                      </td></tr>
                    ) : filtered.map((h, i) => {
                      const hasilRecord = h as unknown as Record<string, unknown>
                      const cpDone = CP_ORDER.filter((cp) => {
                        const key = `ss_${cp}` as keyof HasilMahasiswa
                        return !!hasilRecord[key]
                      }).length
                      return (
                        <tr key={h.nim} className={`border-t border-slate-700/50 hover:bg-slate-700/30 transition cursor-pointer ${i%2===1?'bg-slate-800/50':''}`}
                          onClick={() => setSelected(h)}>
                          <td className="px-4 py-3 font-mono text-xs text-slate-300">{h.nim}</td>
                          <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">{h.nama}</td>
                          <td className="px-4 py-3 text-center text-slate-400">{h.kelas}</td>
                          <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                            {h.waktu_mulai ? new Date(h.waktu_mulai).toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'}) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 text-center">{h.durasi_menit ? `${h.durasi_menit}m` : '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-bold ${cpDone === 9 ? 'text-emerald-400' : cpDone > 0 ? 'text-sky-400' : 'text-slate-600'}`}>
                              {cpDone}/9
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-sky-400">
                            {h.nilai_total || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-lg transition"
                              onClick={(e) => { e.stopPropagation(); setSelected(h) }}>
                              Nilai
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tab: Data Mahasiswa */}
        {activeTab === 'mahasiswa' && <DataMahasiswa />}
      </div>

      {/* Score Drawer */}
      {selected && (
        <ScoreDrawer
          mhs={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); fetchData() }}
        />
      )}
    </div>
  )
}
