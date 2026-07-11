'use client'

import { useState, useEffect, useRef } from 'react'
import { apiGetMahasiswaList, apiUpsertMahasiswa, apiImportMahasiswa } from '@/lib/sheets'
import type { Mahasiswa } from '@/types'
import TableControls, { getPageCount, getPageItems } from './TableControls'

export default function DataMahasiswa() {
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [filterKelas, setFilterKelas] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Mahasiswa>>({
    nim: '', nama: '', kelas: '', foto: '', website_ujian: '', aktif: true
  })

  // CSV State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiGetMahasiswaList()
      setMahasiswa(res.mahasiswa)
    } catch (e) {
      setError('Gagal memuat data mahasiswa')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = mahasiswa.filter((m) => {
    if (filterKelas !== 'ALL' && m.kelas.toUpperCase() !== filterKelas.toUpperCase()) return false
    const q = search.trim().toLowerCase()
    if (q && ![m.nim, m.nama, m.kelas, m.website_ujian].join(' ').toLowerCase().includes(q)) return false
    return true
  })
  const pageCount = getPageCount(filtered.length, pageSize)
  const pageItems = getPageItems(filtered, Math.min(page, pageCount), pageSize)

  const handleEdit = (m: Mahasiswa) => {
    setFormData(m)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleAdd = () => {
    setFormData({ nim: '', nama: '', kelas: '', foto: '', website_ujian: '', aktif: true })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nim || !formData.nama) {
      setError('NIM dan Nama wajib diisi')
      return
    }
    
    setSaving(true)
    setError('')
    try {
      await apiUpsertMahasiswa(formData as Mahasiswa)
      setSuccess(`Data mahasiswa ${formData.nim} berhasil disimpan`)
      setShowForm(false)
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan data')
    }
    setSaving(false)
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError('')
    setSuccess('')

    try {
      const text = await file.text()
      const rows = text.split('\n').filter(r => r.trim())
      
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase())
      
      // Validasi kolom CSV yang wajib ada
      if (!headers.includes('nim')) {
        throw new Error('CSV harus memiliki kolom "nim"')
      }

      const dataToImport = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim())
        const obj: Record<string, unknown> = {}
        headers.forEach((h, i) => {
          if (h === 'aktif') {
            obj[h] = values[i] ? values[i].toLowerCase() === 'true' || values[i] === '1' : true
          } else {
            obj[h] = values[i] || ''
          }
        })
        return obj
      }).filter(item => item.nim) as (Partial<Mahasiswa> & { nim: string })[]

      if (dataToImport.length === 0) throw new Error('Tidak ada data valid yang bisa diimport')

      const res = await apiImportMahasiswa(dataToImport)
      const resData = res as { message?: string }
      setSuccess(resData.message || `Berhasil import ${dataToImport.length} data`)
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses file CSV')
    }
    
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,nim,nama,kelas,foto,website_ujian,aktif\n2026101001,John Doe,A,,,true\n"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "template_mahasiswa.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const classOptions = Array.from(new Set(mahasiswa.map(m => m.kelas.toUpperCase()))).sort()

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button onClick={handleAdd} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-white text-sm font-bold rounded-lg transition">
            + Tambah Mahasiswa
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-bold rounded-lg transition flex items-center gap-2">
            {importing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '📁'} Import CSV
          </button>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
          
          <button onClick={downloadTemplate} className="px-3 py-2 text-sky-400 hover:text-sky-300 text-xs font-semibold underline">
            Download Template CSV
          </button>
        </div>
        
        <div className="flex gap-2">
          {['ALL', ...classOptions].map(k => (
            <button key={k} onClick={() => { setFilterKelas(k); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                filterKelas === k ? 'bg-sky-500 border-sky-500 text-slate-900 dark:text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-700'
              }`}>
              {k === 'ALL' ? 'Semua' : `Kelas ${k}`}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">⚠️ {error}</div>}
      {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg">✅ {success}</div>}

      <TableControls
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1) }}
        pageSize={pageSize}
        onPageSizeChange={(value) => { setPageSize(value); setPage(1) }}
        page={Math.min(page, pageCount)}
        pageCount={pageCount}
        total={mahasiswa.length}
        filteredTotal={filtered.length}
        onPageChange={setPage}
      />

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs text-left">
                <th className="px-4 py-3 font-semibold">NIM</th>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Kelas</th>
                <th className="px-4 py-3 font-semibold">Website Ujian</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Tidak ada data</td></tr>
              ) : pageItems.map((m, i) => (
                <tr key={m.nim} className={`border-t border-slate-200 dark:border-slate-700/50 hover:bg-slate-700/30 ${i % 2 === 1 ? 'bg-white dark:bg-slate-800/50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{m.nim}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">{m.nama}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{m.kelas}</td>
                  <td className="px-4 py-3 text-xs">
                    {m.website_ujian ? (
                      <a href={m.website_ujian.startsWith('http') ? m.website_ujian : `https://${m.website_ujian}`} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline break-all">
                        {m.website_ujian.startsWith('http') ? m.website_ujian : `https://${m.website_ujian}`}
                      </a>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.aktif ? 
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">Aktif</span> : 
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">Nonaktif</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleEdit(m)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white text-xs font-semibold rounded transition">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden fade-in">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">{formData.nim ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white">×</button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">NIM (Wajib)</label>
                <input type="text" value={formData.nim} onChange={e => setFormData({...formData, nim: e.target.value})}
                  disabled={!!mahasiswa.find(m => m.nim === formData.nim)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none disabled:opacity-50" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nama (Wajib)</label>
                <input type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Kelas</label>
                  <input type="text" value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Status</label>
                  <select value={formData.aktif ? 'true' : 'false'} onChange={e => setFormData({...formData, aktif: e.target.value === 'true'})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none">
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">URL Website Ujian (OpenCart)</label>
                <input type="text" value={formData.website_ujian} onChange={e => setFormData({...formData, website_ujian: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none" placeholder="https://" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">URL Foto (Opsional)</label>
                <input type="text" value={formData.foto} onChange={e => setFormData({...formData, foto: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none" placeholder="https://" />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-semibold rounded-lg transition">Batal</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-slate-900 dark:text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
