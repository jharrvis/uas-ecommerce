'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiGetPool } from '@/lib/sheets'
import { getProductImages, getTokoBrands, getTokoSlideshows } from '@/lib/utils'
import type { Produk, Toko } from '@/types'

type AuditProduct = {
  id: string
  nama: string
  missing: string[]
}

type AuditStore = {
  toko: Toko
  products: Produk[]
  missingStore: string[]
  productAudits: AuditProduct[]
}

function safeArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return value.split(/[;\n,]/).map((item) => item.trim()).filter(Boolean)
    }
  }
  return []
}

function hasText(value: unknown): boolean {
  return String(value || '').trim().length > 0
}

function buildStoreAudit(toko: Toko, allProducts: Produk[]): AuditStore {
  const products = allProducts.filter(
    (item) => String(item.id_toko || '').trim() === String(toko.id || '').trim()
  )

  const brands = getTokoBrands(toko)
  const slides = getTokoSlideshows(toko)
  const storeMissing: string[] = []

  if (!hasText(toko.nama_toko)) storeMissing.push('Nama toko')
  if (!hasText(toko.alamat)) storeMissing.push('Alamat toko')
  if (!hasText(toko.email)) storeMissing.push('Email toko')
  if (!hasText(toko.telepon)) storeMissing.push('Telepon toko')
  if (!hasText(toko.deskripsi_bisnis)) storeMissing.push('Deskripsi bisnis')
  if (!hasText(toko.logo_url)) storeMissing.push('Logo toko')
  if (brands.length === 0) storeMissing.push('Manufacturer / brand')
  if (brands.some((brand) => !hasText(brand.name) || !hasText(brand.logo))) {
    storeMissing.push('Ada brand tanpa nama/logo lengkap')
  }
  if (slides.length === 0) storeMissing.push('Slideshow toko')
  if (!Array.isArray(toko.event_promo) || toko.event_promo.length === 0) {
    storeMissing.push('Event promo')
  }
  if (products.length === 0) storeMissing.push('Belum ada produk terkait')

  const productAudits = products.map((product) => {
    const missing: string[] = []
    const categories = safeArray(product.kategori)
    const attributes = safeArray(product.attributes)
    const options = safeArray(product.options)
    const images = getProductImages(product)

    if (!hasText(product.nama_produk)) missing.push('Nama produk')
    if (!hasText(product.manufacturer)) missing.push('Manufacturer')
    if (!Number(product.harga)) missing.push('Harga')
    if (product.stok === undefined || product.stok === null || product.stok === '' as never) {
      missing.push('Stok')
    }
    if (!Number(product.berat_kg)) missing.push('Berat')
    if (!hasText(product.dimensi)) missing.push('Dimensi')
    if (!hasText(product.sku)) missing.push('SKU')
    if (!hasText(product.seo_keyword)) missing.push('SEO keyword')
    if (categories.length === 0) missing.push('Kategori')
    if (attributes.length === 0) missing.push('Attributes')
    if (options.length === 0) missing.push('Options/varian')
    if (!Number(product.discount_harga) || !hasText(product.discount_mulai) || !hasText(product.discount_selesai)) {
      missing.push('Diskon')
    }
    if (!Number(product.special_harga) || !hasText(product.special_mulai) || !hasText(product.special_selesai)) {
      missing.push('Harga spesial')
    }
    if (images.length === 0) missing.push('Gambar produk')
    if (!hasText(product.deskripsi_diskon)) missing.push('Deskripsi diskon')
    if (!hasText(product.deskripsi_special)) missing.push('Deskripsi special')

    return {
      id: String(product.id),
      nama: product.nama_produk,
      missing,
    }
  })

  return {
    toko,
    products,
    missingStore: storeMissing,
    productAudits,
  }
}

export default function CekSoalPage() {
  const [toko, setToko] = useState<Toko[]>([])
  const [produk, setProduk] = useState<Produk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await apiGetPool()
        setToko(result.toko)
        setProduk(result.produk)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data soal.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const audits = useMemo(
    () => toko.map((item) => buildStoreAudit(item, produk)),
    [produk, toko]
  )

  const filtered = audits.filter((item) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [
      item.toko.id,
      item.toko.nama_toko,
      item.toko.email,
      ...item.products.map((product) => product.nama_produk),
    ].join(' ').toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-black">Audit Soal per Toko</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Route testing untuk memeriksa apakah data soal tiap toko sudah lengkap.
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ID toko / nama toko / produk"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none md:max-w-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Memuat audit soal...
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => {
              const completeProducts = item.productAudits.filter((product) => product.missing.length === 0).length
              const isStoreComplete = item.missingStore.length === 0 && completeProducts === item.productAudits.length

              return (
                <details
                  key={item.toko.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <summary className="cursor-pointer list-none p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            isStoreComplete
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          }`}>
                            {isStoreComplete ? 'Komplet' : 'Perlu Dicek'}
                          </span>
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{item.toko.id}</span>
                        </div>
                        <h2 className="mt-2 text-xl font-bold">{item.toko.nama_toko || '(Tanpa nama toko)'}</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {item.products.length} produk, {completeProducts}/{item.productAudits.length} produk lengkap
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs md:min-w-[260px]">
                        <div className="rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                          Missing toko: <span className="font-bold">{item.missingStore.length}</span>
                        </div>
                        <div className="rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                          Brand: <span className="font-bold">{getTokoBrands(item.toko).length}</span>
                        </div>
                        <div className="rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                          Slideshow: <span className="font-bold">{getTokoSlideshows(item.toko).length}</span>
                        </div>
                        <div className="rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                          Promo: <span className="font-bold">{Array.isArray(item.toko.event_promo) ? item.toko.event_promo.length : 0}</span>
                        </div>
                      </div>
                    </div>
                  </summary>

                  <div className="border-t border-slate-200 p-5 dark:border-slate-800">
                    <div className="mb-5">
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Audit Data Toko
                      </h3>
                      {item.missingStore.length === 0 ? (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Data toko lengkap.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {item.missingStore.map((missing) => (
                            <span
                              key={missing}
                              className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300"
                            >
                              {missing}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Audit Produk
                      </h3>
                      {item.productAudits.length === 0 ? (
                        <p className="text-sm text-red-500">Belum ada produk untuk toko ini.</p>
                      ) : (
                        item.productAudits.map((product) => (
                          <div
                            key={product.id}
                            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-bold">{product.nama || '(Tanpa nama produk)'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{product.id}</p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                                product.missing.length === 0
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                              }`}>
                                {product.missing.length === 0 ? 'Lengkap' : `${product.missing.length} field belum lengkap`}
                              </span>
                            </div>
                            {product.missing.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {product.missing.map((missing) => (
                                  <span
                                    key={missing}
                                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    {missing}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
