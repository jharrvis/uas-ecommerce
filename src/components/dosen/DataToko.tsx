'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { apiDeleteToko, apiGetPool, apiUploadProductAsset, apiUpsertToko } from '@/lib/sheets'
import { getDriveDirectUrl, getTokoBrands, getTokoSlideshows } from '@/lib/utils'
import type { Toko } from '@/types'
import TableControls, { getPageCount, getPageItems } from './TableControls'

type TokoForm = Partial<Toko> & { id: string }

const emptyToko: TokoForm = {
  id: '',
  nama_toko: '',
  alamat: '',
  email: '',
  telepon: '',
  deskripsi_bisnis: '',
  logo_url: '',
  brand_1_name: '',
  brand_1_logo: '',
  brand_2_name: '',
  brand_2_logo: '',
  brand_3_name: '',
  brand_3_logo: '',
  brand_4_name: '',
  brand_4_logo: '',
  slideshow_1: '',
  slideshow_2: '',
  event_promo: [],
  aktif: true,
}

export default function DataToko() {
  const [toko, setToko] = useState<Toko[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [formData, setFormData] = useState<TokoForm>(emptyToko)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiGetPool()
      setToko(res.toko)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data toko')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return toko
    return toko.filter((item) => [
      item.id,
      item.nama_toko,
      item.alamat,
      item.email,
      item.telepon,
      ...getTokoBrands(item).map((brand) => brand.name),
    ].join(' ').toLowerCase().includes(q))
  }, [search, toko])

  const pageCount = getPageCount(filtered.length, pageSize)
  const pageItems = getPageItems(filtered, Math.min(page, pageCount), pageSize)

  const updatePageSize = (value: number) => {
    setPageSize(value)
    setPage(1)
  }

  const updateSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleAdd = () => {
    setFormData({ ...emptyToko, id: `T${Date.now()}` })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleEdit = (item: Toko) => {
    setFormData({
      ...emptyToko,
      ...item,
      event_promo: Array.isArray(item.event_promo) ? item.event_promo : [],
    })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus toko ini? Produk terkait tidak otomatis terhapus.')) return
    setError('')
    try {
      await apiDeleteToko(id)
      setSuccess(`Toko ${id} berhasil dihapus`)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus toko')
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof TokoForm) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 300 * 1024) {
      setError(`Ukuran file ${file.name} terlalu besar. Maksimal 300KB. Ukuran saat ini: ${(file.size / 1024).toFixed(1)}KB`)
      return
    }

    setUploadingField(String(field))
    setError('')
    try {
      const res = await apiUploadProductAsset(`toko_${field}`, file)
      setFormData((prev) => ({ ...prev, [field]: res.file_url }))
      setSuccess(`Berhasil mengupload ${String(field)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupload gambar')
    } finally {
      setUploadingField(null)
      e.target.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id || !formData.nama_toko) {
      setError('ID dan nama toko wajib diisi')
      return
    }

    setSaving(true)
    setError('')
    try {
      await apiUpsertToko({
        ...formData,
        event_promo: Array.isArray(formData.event_promo) ? formData.event_promo : [],
      })
      setSuccess(`Toko ${formData.nama_toko} berhasil disimpan`)
      setShowForm(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan toko')
    } finally {
      setSaving(false)
    }
  }

  const imageField = (label: string, field: keyof TokoForm) => {
    const value = String(formData[field] || '')
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
        <label className="text-xs font-bold text-slate-500">{label}</label>
        <div className="flex gap-2">
          {value && (
            <div className="w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden shrink-0 bg-white shadow-sm">
              <Image src={getDriveDirectUrl(value)} alt={label} width={48} height={48} className="w-full h-full object-contain" unoptimized />
            </div>
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
            className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono focus:border-sky-500 outline-none"
            placeholder="https://..."
          />
          <label className="px-3 py-2 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 text-xs font-bold rounded-lg cursor-pointer transition flex items-center justify-center shrink-0">
            {uploadingField === field ? <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /> : 'Upload'}
            <input type="file" accept="image/*" className="hidden" disabled={!!uploadingField} onChange={(e) => handleUpload(e, field)} />
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <button onClick={handleAdd} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold rounded-lg transition">
          + Tambah Toko
        </button>
        <span className="text-xs text-slate-500">{toko.length} toko terdaftar</span>
      </div>

      {error && <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg font-medium">{error}</div>}
      {success && <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg font-medium">{success}</div>}

      <TableControls
        search={search}
        onSearchChange={updateSearch}
        pageSize={pageSize}
        onPageSizeChange={updatePageSize}
        page={Math.min(page, pageCount)}
        pageCount={pageCount}
        total={toko.length}
        filteredTotal={filtered.length}
        onPageChange={setPage}
      />

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs text-left border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 font-bold">ID / Toko</th>
                <th className="px-4 py-3 font-bold">Kontak</th>
                <th className="px-4 py-3 font-bold">Brand</th>
                <th className="px-4 py-3 font-bold text-center">Slideshow</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-4 py-3 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Memuat data toko...</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Tidak ada data toko</td></tr>
              ) : pageItems.map((item) => {
                const brands = getTokoBrands(item)
                const slides = getTokoSlideshows(item)
                return (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 min-w-[220px]">
                      <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{item.id}</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.nama_toko}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.alamat}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 min-w-[180px]">
                      <p>{item.email || '—'}</p>
                      <p>{item.telepon || '—'}</p>
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="flex flex-wrap gap-1.5">
                        {brands.length === 0 ? <span className="text-xs text-slate-400">Belum ada brand</span> : brands.map((brand, index) => (
                          <span key={`${brand.name}-${index}`} className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs text-slate-700 dark:text-slate-200">
                            {brand.logo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={getDriveDirectUrl(brand.logo)} alt={brand.name || `Brand ${index + 1}`} className="w-4 h-4 rounded-full object-cover bg-white" />
                            )}
                            {brand.name || `Brand ${index + 1}`}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold ${slides.length === 2 ? 'text-emerald-500' : slides.length > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {slides.length}/2
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.aktif !== false
                        ? <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">Aktif</span>
                        : <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-500/20">Nonaktif</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleEdit(item)} className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded transition">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 text-xs font-bold rounded transition">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden fade-in">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-white">{toko.find((item) => item.id === formData.id) ? 'Edit Toko' : 'Tambah Toko'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl">×</button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">
              <form id="tokoForm" onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">ID Toko</label>
                    <input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      disabled={!!toko.find((item) => item.id === formData.id)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none disabled:opacity-50 font-mono" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Toko</label>
                    <input type="text" value={formData.nama_toko || ''} onChange={(e) => setFormData({ ...formData, nama_toko: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Email</label>
                    <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Telepon</label>
                    <input type="text" value={formData.telepon || ''} onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Alamat</label>
                    <input type="text" value={formData.alamat || ''} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Deskripsi Bisnis</label>
                    <textarea rows={3} value={formData.deskripsi_bisnis || ''} onChange={(e) => setFormData({ ...formData, deskripsi_bisnis: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Status</label>
                    <select value={formData.aktif === false ? 'false' : 'true'} onChange={(e) => setFormData({ ...formData, aktif: e.target.value === 'true' })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none">
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Logo Toko & Slideshow</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {imageField('Logo Toko', 'logo_url')}
                    {imageField('Slideshow 1', 'slideshow_1')}
                    {imageField('Slideshow 2', 'slideshow_2')}
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Brand Toko (4 Brand)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((index) => {
                      const nameKey = `brand_${index}_name` as keyof TokoForm
                      const logoKey = `brand_${index}_logo` as keyof TokoForm
                      return (
                        <div key={index} className="space-y-2 p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                          <label className="block text-xs font-bold text-slate-500">Brand {index}</label>
                          <input
                            type="text"
                            value={String(formData[nameKey] || '')}
                            onChange={(e) => setFormData((prev) => ({ ...prev, [nameKey]: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:border-sky-500 outline-none"
                            placeholder="Nama brand"
                          />
                          {imageField(`Logo Brand ${index}`, logoKey)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-shrink-0">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg transition">
                Batal
              </button>
              <button type="submit" form="tokoForm" disabled={saving}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Simpan Toko'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
