import { writeFileSync } from 'fs'

const content = `'use client'

import { useState, useRef } from 'react'
import { apiUpsertMahasiswa, apiImportMahasiswa } from '@/lib/sheets'
import type { Mahasiswa } from '@/types'

interface DataMahasiswaProps {
  mahasiswaList: Mahasiswa[]
  onRefresh: () => void
}

export default function DataMahasiswa({ mahasiswaList, onRefresh }: DataMahasiswaProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' as 'success' | 'error' })
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Mahasiswa>>({ aktif: true })
  const [filterKelas, setFilterKelas] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' as unknown as 'success' | 'error' }), 5000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nim) return showMsg('NIM wajib diisi', 'error')
    setLoading(true)
    try {
      await apiUpsertMahasiswa(formData as Mahasiswa)
      showMsg('Mahasiswa ' + formData.nim + ' berhasil disimpan', 'success')
      setShowForm(false)
      setFormData({ aktif: true })
      onRefresh()
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Gagal menyimpan', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (mhs: Mahasiswa) => {
    setFormData({ ...mhs })
    setShowForm(true)
  }

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        let data
        try { data = JSON.parse(text) }
        catch {
          data = text.split('\\n').filter(Boolean).map(line => {
            const c = line.split(',').map(s => s.trim())
            return { nim: c[0], nama: c[1], kelas: c[2], foto: c[3], website_ujian: c[4], aktif: c[5] !== 'false' && c[5] !== '0' }
          }).filter(m => m.nim && m.nim !== 'nim')
        }
        if (!Array.isArray(data) || data.length === 0) throw new Error('Format file tidak dikenali')
        setLoading(true)
        const res = await apiImportMahasiswa(data)
        const msg = typeof res === 'object' && res && 'message' in res
          ? String((res as { message: string }).message)
          : 'Import ' + data.length + ' data berhasil'
        showMsg(msg, 'success')
        onRefresh()
      } catch (err) {
        showMsg(err instanceof Error ? err.message : 'Gagal import data', 'error')
      } finally {
        setLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const classOptions = Array.from(
    new Set(mahasiswaList.map(m => m.kelas?.trim().toUpperCase()).filter(Boolean))
  ).sort()

  const filtered = mahasiswaList.filter(m => {
    if (filterKelas !== 'ALL' && m.kelas?.trim().toUpperCase() !== filterKelas) return false
    if (searchQuery && !m.nama.toLowerCase().includes(searchQuery.toLowerCase()) && !m.nim.includes(searchQuery)) return false
    return true
  })

  return (
`
const jsx = [
  '<div className="space-y-4">',
  '  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">',
  '    <div>',
  '      <h2 className="text-lg font-bold text-white">Data Mahasiswa</h2>',
  '      <p className="text-sm text-slate-400">Total {mahasiswaList.length} mahasiswa terdaftar</p>',
  '    </div>',
  '    <div className="flex gap-2">',
  '      <button onClick={() => { setFormData({ aktif: true }); setShowForm(true) }}',
  '        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition">',
  '        + Tambah',
  '      </button>',
  '      <input type="file" accept=".json,.csv" ref={fileInputRef} onChange={handleImportJSON} className="hidden" />',
  '      <button onClick={() => fileInputRef.current?.click()} disabled={loading}',
  '        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm font-semibold rounded-lg transition">',
  '        {loading ? String.fromCharCode(9203) : String.fromCharCode(128229) + " Import"}',
  '      </button>',
  '    </div>',
  '  </div>',
  '',
  '  {message.text && (',
  '    <div className={message.type === "success" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}>',
  '      {message.type === "success" ? String.fromCharCode(9989) + " " : String.fromCharCode(10060) + " "}{message.text}',
  '    </div>',
  '  )}',
  '',
  '  {showForm && (',
  '    <div className="bg-slate-800 p-5 rounded-xl border border-slate-600">',
  '      <div className="flex justify-between items-center mb-4">',
  '        <h3 className="font-bold text-white">',
  '          {formData.nim && mahasiswaList.find(m => m.nim === formData.nim) ? "Edit Mahasiswa" : "Tambah Mahasiswa"}',
  '        </h3>',
  '        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white text-lg">{String.fromCharCode(10005)}</button>',
  '      </div>',
  '      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">',
  '        <div>',
  '          <label className="block text-xs font-semibold text-slate-400 mb-1">NIM *</label>',
  '          <input required type="text" value={formData.nim || ""}',
  '            onChange={e => setFormData({ ...formData, nim: e.target.value })}',
  '            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"',
  '            placeholder="Contoh: 2022105025" />',
  '        </div>',
  '        <div>',
  '          <label className="block text-xs font-semibold text-slate-400 mb-1">Nama *</label>',
  '          <input required type="text" value={formData.nama || ""}',
  '            onChange={e => setFormData({ ...formData, nama: e.target.value })}',
  '            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"',
  '            placeholder="Nama Lengkap" />',
  '        </div>',
  '        <div>',
  '          <label className="block text-xs font-semibold text-slate-400 mb-1">Kelas</label>',
  '          <input type="text" value={formData.kelas || ""}',
  '            onChange={e => setFormData({ ...formData, kelas: e.target.value })}',
  '            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"',
  '            placeholder="A / B" />',
  '        </div>',
  '        <div>',
  '          <label className="block text-xs font-semibold text-slate-400 mb-1">Website Ujian</label>',
  '          <input type="url" value={formData.website_ujian || ""}',
  '            onChange={e => setFormData({ ...formData, website_ujian: e.target.value })}',
  '            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"',
  '            placeholder="https://..." />',
  '        </div>',
  '        <div className="sm:col-span-2">',
  '          <label className="block text-xs font-semibold text-slate-400 mb-1">URL Foto</label>',
  '          <input type="url" value={formData.foto || ""}',
  '            onChange={e => setFormData({ ...formData, foto: e.target.value })}',
  '            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"',
  '            placeholder="https://..." />',
  '        </div>',
  '        <div className="sm:col-span-2 flex items-center gap-2">',
  '          <input type="checkbox" id="aktif" checked={formData.aktif !== false}',
  '            onChange={e => setFormData({ ...formData, aktif: e.target.checked })}',
  '            className="w-4 h-4 rounded bg-slate-900 border-slate-700" />',
  '          <label htmlFor="aktif" className="text-sm font-semibold text-slate-300">Akun Aktif</label>',
  '        </div>',
  '        <div className="sm:col-span-2 flex justify-end gap-2 mt-2 border-t border-slate-700 pt-4">',
  '          <button type="button" onClick={() => setShowForm(false)}',
  '            className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition">Batal</button>',
  '          <button type="submit" disabled={loading}',
  '            className="px-5 py-2 text-sm bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition">',
  '            {loading ? String.fromCharCode(9203) + " Menyimpan..." : "Simpan"}',
  '          </button>',
  '        </div>',
  '      </form>',
  '    </div>',
  '  )}',
  '',
  '  <div className="flex flex-wrap items-center gap-2">',
  '    <input type="text" placeholder="Cari nama/NIM..." value={searchQuery}',
  '      onChange={e => setSearchQuery(e.target.value)}',
  '      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-48" />',
  '    <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)}',
  '      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">',
  '      <option value="ALL">Semua Kelas</option>',
  '      {classOptions.map(k => <option key={k} value={k}>Kelas {k}</option>)}',
  '    </select>',
  '    <span className="text-xs text-slate-500 ml-auto">{filtered.length} baris</span>',
  '  </div>',
  '',
  '  <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">',
  '    <div className="overflow-x-auto">',
  '      <table className="w-full text-sm">',
  '        <thead>',
  '          <tr className="bg-slate-900 text-slate-400 text-xs text-left">',
  '            <th className="px-4 py-3 font-semibold whitespace-nowrap">NIM</th>',
  '            <th className="px-4 py-3 font-semibold">Nama</th>',
  '            <th className="px-4 py-3 font-semibold text-center w-16">Kelas</th>',
  '            <th className="px-4 py-3 font-semibold">Website</th>',
  '            <th className="px-4 py-3 font-semibold text-center w-20">Status</th>',
  '            <th className="px-4 py-3 font-semibold text-center w-20">Aksi</th>',
  '          </tr>',
  '        </thead>',
  '        <tbody>',
  '          {filtered.length === 0 ? (',
  '            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Data tidak ditemukan</td></tr>',
  '          ) : filtered.map((mhs, i) => (',
  '            <tr key={mhs.nim} className={(i % 2 === 1 ? "bg-slate-800/50 " : "") + "border-t border-slate-700/50 hover:bg-slate-700/30 transition"}>',
  '              <td className="px-4 py-3 font-mono text-xs text-slate-300">{mhs.nim}</td>',
  '              <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">{mhs.nama}</td>',
  '              <td className="px-4 py-3 text-center text-slate-400">{mhs.kelas}</td>',
  '              <td className="px-4 py-3 text-xs max-w-[180px] truncate">',
  '                {mhs.website_ujian ? (',
  '                  <a href={mhs.website_ujian} target="_blank" rel="noopener noreferrer"',
  '                    className="text-sky-400 hover:underline">{mhs.website_ujian}</a>',
  '                ) : <span className="text-slate-600">--</span>}',
  '              </td>',
  '              <td className="px-4 py-3 text-center">',
  '                {mhs.aktif ? (',
  '                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Aktif</span>',
  '                ) : (',
  '                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">Nonaktif</span>',
  '                )}',
  '              </td>',
  '              <td className="px-4 py-3 text-center">',
  '                <button onClick={() => handleEdit(mhs)}',
  '                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition">',
  '                  Edit',
  '                </button>',
  '              </td>',
  '            </tr>',
  '          ))}',
  '        </tbody>',
  '      </table>',
  '    </div>',
  '  </div>',
  '</div>'
]

const fullContent = content + jsx.join('\n') + '\n  )\n}\n'

writeFileSync('src/components/dosen/DataMahasiswa.tsx', fullContent, 'utf-8')
console.log('Written successfully, length:', fullContent.length)
