'use client'

import { useState, useEffect, useRef } from 'react'
import { apiGetPool, apiUpsertProduk, apiImportProduk, apiDeleteProduk } from '@/lib/sheets'
import type { Produk } from '@/types'

export default function DataProduk() {
  const [produk, setProduk] = useState<Produk[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [filterToko, setFilterToko] = useState('ALL')
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Produk>>({
    id: '', id_toko: '', sku: '', nama_produk: '', kategori: [],
    harga: 0, stok: 0, berat_kg: 0, dimensi: '',
    manufacturer: '', logo_manufacturer: '',
    deskripsi_diskon: '', discount_min_qty: 0, discount_harga: 0, discount_mulai: '', discount_selesai: '',
    deskripsi_special: '', special_harga: 0, special_mulai: '', special_selesai: '',
    seo_keyword: '', gambar_1: '', gambar_2: '', gambar_3: '',
    attributes: [], options: []
  })

  // CSV State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiGetPool()
      setProduk(res.produk)
    } catch (e) {
      setError('Gagal memuat data produk')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = produk.filter(p => 
    filterToko === 'ALL' || String(p.id_toko) === filterToko
  )

  const handleEdit = (p: Produk) => {
    setFormData({
      ...p,
      // Konversi array ke string untuk edit form yang simple
      kategori: p.kategori || [],
      attributes: p.attributes || [],
      options: p.options || []
    })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleAdd = () => {
    setFormData({
      id: `P${Date.now()}`, id_toko: '', sku: '', nama_produk: '',
      kategori: [], attributes: [], options: [], harga: 0, stok: 10
    })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return
    
    setError('')
    try {
      await apiDeleteProduk(id)
      setSuccess(`Produk ${id} berhasil dihapus`)
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus produk')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id || !formData.nama_produk) {
      setError('ID dan Nama Produk wajib diisi')
      return
    }
    
    setSaving(true)
    setError('')
    try {
      // Pastikan kategori berupa array jika dimasukkan via koma (untuk form manual simple)
      let parsedKategori = formData.kategori
      if (typeof parsedKategori === 'string') {
        parsedKategori = (parsedKategori as string).split(',').map(s => s.trim()).filter(Boolean)
      }

      await apiUpsertProduk({
        ...formData,
        kategori: parsedKategori,
      } as Produk)
      
      setSuccess(`Produk ${formData.nama_produk} berhasil disimpan`)
      setShowForm(false)
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan produk')
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
      
      if (!headers.includes('id') || !headers.includes('id_toko') || !headers.includes('nama_produk')) {
        throw new Error('CSV harus minimal memiliki kolom: id, id_toko, nama_produk')
      }

      const dataToImport = rows.slice(1).map(row => {
        // Split dengan regex yang mengabaikan koma di dalam tanda kutip
        const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
        const obj: Record<string, any> = {}
        
        headers.forEach((h, i) => {
          let val = values[i] ? values[i].replace(/^"|"$/g, '').trim() : ''
          
          if (['harga', 'stok', 'berat_kg', 'discount_min_qty', 'discount_harga', 'special_harga'].includes(h)) {
            obj[h] = Number(val) || 0
          } else if (h === 'kategori') {
            obj[h] = val ? val.split(';').map(v => v.trim()) : []
          } else {
            obj[h] = val
          }
        })
        return obj
      }).filter(item => item.id && item.nama_produk)

      if (dataToImport.length === 0) throw new Error('Tidak ada data valid yang bisa diimport')

      const res = await apiImportProduk(dataToImport as Produk[])
      const resData = res as { message?: string }
      setSuccess(resData.message || `Berhasil import ${dataToImport.length} produk`)
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses file CSV')
    }
    
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadTemplate = () => {
    const headers = "id,id_toko,sku,nama_produk,kategori,harga,stok,berat_kg,dimensi,manufacturer,seo_keyword,gambar_1,gambar_2,gambar_3"
    const sample = "P001,T01,SKU-01,Meja Kayu,Furniture;Living Room,500000,10,15,100x50x75,IKEA,meja-kayu-ikea,https://gambar1.jpg,,"
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${sample}\n`
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "template_produk.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const tokoOptions = Array.from(new Set(produk.map(p => String(p.id_toko)))).sort()

  const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleAdd} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold rounded-lg transition">
            + Tambah Produk
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-sm font-bold rounded-lg transition flex items-center gap-2">
            {importing ? <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"/> : '📁'} Import CSV
          </button>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
          
          <button onClick={downloadTemplate} className="px-3 py-2 text-sky-600 dark:text-sky-400 hover:underline text-xs font-semibold">
            Template CSV
          </button>
        </div>
        
        <div className="flex gap-2 items-center">
          <span className="text-xs font-bold text-slate-500">Toko:</span>
          <select 
            value={filterToko} 
            onChange={e => setFilterToko(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">Semua Toko</option>
            {tokoOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg font-medium">⚠️ {error}</div>}
      {success && <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg font-medium">✅ {success}</div>}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs text-left border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 font-bold">ID / Toko</th>
                <th className="px-4 py-3 font-bold">SKU / Nama</th>
                <th className="px-4 py-3 font-bold">Kategori & Brand</th>
                <th className="px-4 py-3 font-bold text-right">Harga & Stok</th>
                <th className="px-4 py-3 font-bold text-center">Gambar</th>
                <th className="px-4 py-3 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Memuat data produk...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Tidak ada data produk</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30`}>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{p.id}</p>
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold">{p.id_toko}</p>
                  </td>
                  <td className="px-4 py-3 min-w-[200px]">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{p.nama_produk}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-700 dark:text-slate-300">{p.manufacturer}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 max-w-[150px] truncate" title={Array.isArray(p.kategori) ? p.kategori.join(', ') : p.kategori}>
                      {Array.isArray(p.kategori) ? p.kategori.join(' • ') : p.kategori}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{fmt(p.harga)}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{p.stok} stok</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      {p.gambar_1 ? <span title="Ada Gbr 1" className="text-emerald-500">🖼️</span> : <span className="opacity-20">🖼️</span>}
                      {p.gambar_2 ? <span title="Ada Gbr 2" className="text-emerald-500">🖼️</span> : <span className="opacity-20">🖼️</span>}
                      {p.logo_manufacturer ? <span title="Ada Logo" className="text-sky-500">👑</span> : <span className="opacity-20">👑</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(p)} className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 text-xs font-bold rounded transition">
                        Hapus
                      </button>
                    </div>
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
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden fade-in">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {produk.find(p => p.id === formData.id) ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl">×</button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">
              <form id="produkForm" onSubmit={handleSave} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">ID Produk (Wajib)</label>
                    <input type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})}
                      disabled={!!produk.find(p => p.id === formData.id)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none disabled:opacity-50 font-mono" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">ID Toko (Wajib)</label>
                    <input type="text" value={formData.id_toko} onChange={e => setFormData({...formData, id_toko: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none" required placeholder="Contoh: T01" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Produk</label>
                    <input type="text" value={formData.nama_produk} onChange={e => setFormData({...formData, nama_produk: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none" required />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">SKU</label>
                    <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:border-sky-500 outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Kategori (pisahkan dengan koma)</label>
                    <input type="text" 
                      value={Array.isArray(formData.kategori) ? formData.kategori.join(', ') : formData.kategori} 
                      onChange={e => setFormData({...formData, kategori: e.target.value as any})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none" 
                      placeholder="Elektronik, Smartphone" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Harga Dasar (Rp)</label>
                    <input type="number" value={formData.harga} onChange={e => setFormData({...formData, harga: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold focus:border-sky-500 outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Stok</label>
                      <input type="number" value={formData.stok} onChange={e => setFormData({...formData, stok: Number(e.target.value)})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Berat (Kg)</label>
                      <input type="number" value={formData.berat_kg} step="0.1" onChange={e => setFormData({...formData, berat_kg: Number(e.target.value)})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">URL Gambar (Drive/Web)</h4>
                  <p className="text-xs text-slate-500">Anda dapat memodifikasi JSON secara advance via Sheets. Form ini mempermudah URL gambar dasar.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Gambar 1</label>
                      <input type="text" value={formData.gambar_1} onChange={e => setFormData({...formData, gambar_1: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:border-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Gambar 2</label>
                      <input type="text" value={formData.gambar_2} onChange={e => setFormData({...formData, gambar_2: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:border-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Logo Manufacturer</label>
                      <input type="text" value={formData.logo_manufacturer} onChange={e => setFormData({...formData, logo_manufacturer: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:border-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Brand / Manufacturer</label>
                      <input type="text" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none" />
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-shrink-0">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg transition">
                Batal
              </button>
              <button type="submit" form="produkForm" disabled={saving}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}