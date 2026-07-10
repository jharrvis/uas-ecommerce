'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import UploadZone from './UploadZone'
import ImageViewerModal from '@/components/ui/ImageViewerModal'
import { useExamStore } from '@/store/examStore'
import type { CheckpointId, Produk, Toko } from '@/types'
import { CHECKPOINT_META } from '@/types'
import { getDriveDirectUrl, getProductImages, getTokoBrands, getTokoSlideshows } from '@/lib/utils'

function safeArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed } catch {}
  }
  return []
}

function isJsonFragment(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const text = value.trim()
  return text.startsWith('{') ||
    text.startsWith('[') ||
    text.includes('\\"') ||
    text.includes('":') ||
    text.includes('}]')
}

function safeText(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined) return fallback
  const text = String(value).trim()
  if (!text || isJsonFragment(text)) return fallback
  return text
}

function safeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const text = value.trim()
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null
  return Number(text)
}

function safePrice(value: unknown, fmt: (n: number) => string): string {
  const numberValue = safeNumber(value)
  return numberValue === null ? '—' : fmt(numberValue)
}

interface CheckpointProps {
  cp: CheckpointId
  nim: string
  toko: Toko
  produk: Produk[]
  isExamLocked: boolean
}

export default function Checkpoint({ cp, nim, toko, produk, isExamLocked }: CheckpointProps) {
  const session             = useExamStore((s) => s.session)
  const setCheckpointStatus = useExamStore((s) => s.setCheckpointStatus)
  const [showImageModal, setShowImageModal] = useState(false)

  if (!session) return null

  const meta    = CHECKPOINT_META[cp]
  const cpState = session.checkpoints[cp]
  const isDone  = cpState.status === 'done'
  const disabled = isExamLocked

  const handleUploaded = (url: string) => {
    setCheckpointStatus(cp, 'done', url)
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-sky-50 dark:bg-sky-500/20 text-sky-500 dark:text-sky-400 flex-shrink-0">
          {meta.icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-200 text-lg">{meta.label}</h3>
          <p className="text-slate-500 text-sm">{meta.tab} · Bobot: <span className="text-sky-500 dark:text-sky-400 font-bold">{meta.bobot} poin</span></p>
        </div>
      </div>

      {cp === 'cp01' && <CP01Content toko={toko} />}
      {cp === 'cp02' && <CP02Content toko={toko} />}
      {cp === 'cp03' && <CP03Content produk={produk} />}
      {cp === 'cp04' && <CP04Content produk={produk} fmt={fmt} />}
      {cp === 'cp05' && <CP05Content toko={toko} produk={produk} />}
      {cp === 'cp06' && <CP06Content produk={produk} fmt={fmt} />}
      {cp === 'cp07' && <CP07Content produk={produk} fmt={fmt} />}
      {cp === 'cp08' && <CP08Content produk={produk} />}
      {cp === 'cp09' && <CP09Content toko={toko} produk={produk} />}

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          📸 {isDone ? 'Screenshot telah diupload — Anda bisa menggantinya jika perlu' : 'Upload screenshot sebagai bukti penyelesaian'}
        </p>
        <UploadZone
          nim={nim}
          cp={cp}
          disabled={disabled}
          existingUrl={cpState.screenshotUrl}
          onUploaded={handleUploaded}
        />
      </div>

      {isDone && cpState.screenshotUrl && (
        <div className="mt-4 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <span className="text-xl">✅</span>
          <div className="flex-1">
            <p className="text-emerald-400 text-sm font-bold">Checkpoint Selesai</p>
            <p className="text-emerald-500/70 text-xs">Bukti sudah tersimpan dengan aman.</p>
          </div>
          <button
            onClick={() => setShowImageModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-lg transition"
          >
            Lihat Bukti
          </button>
        </div>
      )}

      {showImageModal && cpState.screenshotUrl && (
        <ImageViewerModal
          url={cpState.screenshotUrl}
          title={`${meta.label} — Screenshot`}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  )
}

/* ── Checkpoint Content Components ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 mt-5">{children}</h4>
}

function InfoTable({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
      {rows.map(([label, value], i) => (
        <div key={i} className={`flex ${i % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/80' : 'bg-white dark:bg-slate-800/30'}`}>
          <div className="w-2/5 px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-sm border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
            {label}
          </div>
          <div className="flex-1 px-4 py-3 text-slate-800 dark:text-slate-200 text-sm font-mono break-all font-medium">{value}</div>
        </div>
      ))}
    </div>
  )
}

function Callout({ type, children }: { type: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const styles = {
    info:    'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300',
    warning: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300',
    tip:     'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
  }
  const icons = { info: 'ℹ️', warning: '⚠️', tip: '💡' }
  return (
    <div className={`flex gap-3 p-4 border rounded-xl text-sm leading-relaxed ${styles[type]}`}>
      <span className="flex-shrink-0 text-lg">{icons[type]}</span>
      <div className="font-medium">{children}</div>
    </div>
  )
}

/* CP-01: Data Toko */
function CP01Content({ toko }: { toko: Toko }) {
  const t = {
    nama_toko: toko.nama_toko || '—',
    alamat: toko.alamat || '—',
    email: toko.email || '—',
    telepon: toko.telepon || '—',
    deskripsi_bisnis: toko.deskripsi_bisnis || '',
    logo_url: toko.logo_url || ''
  }

  return (
    <div className="space-y-4">
      <Callout type="info">
        Buka <strong>System → Settings → Stores</strong>. Edit toko default atau buat baru, isi semua field berikut.
      </Callout>
      <SectionTitle>Data yang Harus Diisi</SectionTitle>
      <InfoTable rows={[
        ['Store Name',  t.nama_toko],
        ['Store Owner', t.nama_toko],
        ['Address',     t.alamat],
        ['Email',       t.email],
        ['Telephone',   t.telepon],
        ['Meta Title',  t.nama_toko],
      ]} />
      {t.logo_url && (
        <Callout type="tip">
          Upload logo toko ke OpenCart via <strong>Admin → System → Settings → Store Logo</strong>.
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getDriveDirectUrl(t.logo_url)} alt="logo toko" className="h-16 object-contain rounded bg-white p-1 border border-slate-200" />
          </div>
        </Callout>
      )}
    </div>
  )
}

/* CP-02: Manufacturer & Carousel */
/* CP-02: Manufacturer & Carousel */
function CP02Content({ toko }: { toko: Toko }) {
  const brands = getTokoBrands(toko)

  return (
    <div className="space-y-4">
      <Callout type="info">
        Buka <strong>Catalog ? Manufacturers ? Add New</strong> untuk setiap manufacturer berikut.
        Setelah itu, pasang logo di carousel via <strong>Extensions ? Modules ? Manufacturer Carousel</strong>.
      </Callout>
      {brands.map((brand, i) => (
        <div key={`${brand.name}-${i}`} className="space-y-2">
          <SectionTitle>Manufacturer {i + 1}</SectionTitle>
          <InfoTable rows={[
            ["Manufacturer Name", brand.name],
            ["SEO Keyword", brand.name.toLowerCase().replace(/\s+/g, "-")],
            ["Logo", brand.logo ? (
              <div className="mt-1 mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getDriveDirectUrl(brand.logo)} alt="logo" className="h-12 object-contain rounded bg-white p-1 border border-slate-200" />
              </div>
            ) : "(upload logo yang sesuai)"],
          ]} />
        </div>
      ))}
      {brands.length === 0 && (
        <Callout type="warning">
          Data brand toko belum diisi dosen. Hubungi dosen jika daftar manufacturer tidak tampil.
        </Callout>
      )}
      <Callout type="warning">
        Logo yang dipasang di carousel <strong>harus bisa diklik</strong> dan mengarah ke halaman
        produk berdasarkan manufacturer tersebut (bukan halaman eksternal).
      </Callout>
    </div>
  )
}

/* CP-03: Kategori */
function CP03Content({ produk }: { produk: Produk[] }) {
  // Fungsi untuk mengekstrak kategori dari format data baru
  const extractCategories = (produk: Produk[]): { parent: string; sub: string }[] => {
    const categories: { parent: string; sub: string }[] = []
    
    produk.forEach(item => {
      // Cek jika ada field kategori dengan format array of objects
      if (item.kategori && Array.isArray(item.kategori)) {
        item.kategori.forEach(categoryStr => {
          try {
            // Parse JSON string jika perlu
            let categoryData
            if (typeof categoryStr === 'string') {
              categoryData = JSON.parse(categoryStr)
            } else {
              categoryData = categoryStr
            }
            
            // Jika format adalah array of objects dengan parent dan sub
            if (Array.isArray(categoryData)) {
              categoryData.forEach(cat => {
                if (cat.parent && cat.sub) {
                  categories.push({ parent: cat.parent, sub: cat.sub })
                }
              })
            }
            // Jika format adalah object dengan parent dan sub
            else if (categoryData.parent && categoryData.sub) {
              categories.push({ parent: categoryData.parent, sub: categoryData.sub })
            }
          } catch (e) {
            // Jika gagal parse, abaikan
            console.warn('Failed to parse category:', categoryStr)
          }
        })
      }
    })
    
    return categories
  }

  const categories = extractCategories(produk)
  
  // Kelompokkan kategori berdasarkan parent
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.parent]) {
      acc[cat.parent] = []
    }
    acc[cat.parent].push(cat.sub)
    return acc
  }, {} as Record<string, string[]>)

  // Fungsi untuk mengelompokkan subkategori yang sama
  const groupSubCategories = (subs: string[]): string[] => {
    const grouped: string[] = []
    const seen = new Set<string>()
    
    subs.forEach(sub => {
      if (!seen.has(sub)) {
        seen.add(sub)
        // Hitung berapa kali subkategori muncul
        const count = subs.filter(s => s === sub).length
        if (count > 1) {
          grouped.push(`${sub} (${count} produk)`)
        } else {
          grouped.push(sub)
        }
      }
    })
    
    return grouped
  }

  return (
    <div className="space-y-6">
      <SectionTitle>Kategori yang Dibutuhkan</SectionTitle>
      <div className="space-y-4">
        {Object.entries(groupedCategories).map(([parent, subs]) => (
          <div key={parent} className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-sky-500/15 border border-sky-500/30 text-sky-400 rounded-lg">
              <span className="text-lg">📁</span>
              <span className="font-bold text-base">{parent}</span>
              <span className="text-xs bg-sky-500/20 px-2 py-1 rounded-full">
                {subs.length} subkategori
              </span>
            </div>
            <div className="ml-6 space-y-2">
              {groupSubCategories(subs).map((sub, index) => (
                <div key={`${parent}-${sub}-${index}`} className="flex items-center gap-3 px-4 py-2.5 bg-sky-100/50 border border-sky-200/50 text-sky-600 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-400 rounded-lg">
                  <span className="text-sm">📄</span>
                  <span className="font-medium">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* CP-04: General & Data */
function CP04Content({ produk, fmt }: { produk: Produk[]; fmt: (n: number) => string }) {
  const [expandedProducts, setExpandedProducts] = useState<{[key: string]: boolean}>({})

  const toggleProduct = (productId: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle>Produk: General & Data</SectionTitle>
      <div className="space-y-4">
        {produk.map((p, i) => (
          <div key={p.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
            {/* Header Produk */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              onClick={() => toggleProduct(p.id)}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-sm font-black flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{p.nama_produk}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{p.manufacturer} • {fmt(p.harga)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {expandedProducts[p.id] ? '🔼' : '🔽'}
                </span>
              </div>
            </div>

            {/* Accordion Content */}
            {expandedProducts[p.id] && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-6 space-y-6">
                {/* Gambar Produk */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Gambar Produk</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {p.gambar_1 && (
                      <div className="space-y-2">
                        <div className="relative group">
                          <Image 
                            src={getDriveDirectUrl(p.gambar_1)} 
                            alt={`${p.nama_produk} - Gambar 1`}
                            width={200}
                            height={200}
                            className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                            unoptimized
                          />
                          <button
                            onClick={() => downloadImage(getDriveDirectUrl(p.gambar_1), `${p.nama_produk}_gambar1.jpg`)}
                            className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Unduh Gambar"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Gambar 1</p>
                      </div>
                    )}
                    {p.gambar_2 && (
                      <div className="space-y-2">
                        <div className="relative group">
                          <Image 
                            src={getDriveDirectUrl(p.gambar_2)} 
                            alt={`${p.nama_produk} - Gambar 2`}
                            width={200}
                            height={200}
                            className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                            unoptimized
                          />
                          <button
                            onClick={() => downloadImage(getDriveDirectUrl(p.gambar_2), `${p.nama_produk}_gambar2.jpg`)}
                            className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Unduh Gambar"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.0391 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Gambar 2</p>
                      </div>
                    )}
                    {p.gambar_3 && (
                      <div className="space-y-2">
                        <div className="relative group">
                          <Image 
                            src={getDriveDirectUrl(p.gambar_3)} 
                            alt={`${p.nama_produk} - Gambar 3`}
                            width={200}
                            height={200}
                            className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                            unoptimized
                          />
                          <button
                            onClick={() => downloadImage(getDriveDirectUrl(p.gambar_3), `${p.nama_produk}_gambar3.jpg`)}
                            className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Unduh Gambar"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.0391 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Gambar 3</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informasi Produk */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Informasi Produk</h4>
                  <InfoTable rows={[
                    ['Product Name', p.nama_produk],
                    ['Meta Tag Title', p.nama_produk],
                    ['Model', p.sku.split('-').slice(0,2).join('-')],
                    ['SKU', p.sku],
                    ['Price', fmt(p.harga)],
                    ['Quantity', String(p.stok)],
                    ['Minimum Quantity', '1'],
                    ['Weight', p.berat_kg + ' kg'],
                    ['Length × Width × Height', p.dimensi],
                    ['Status', 'Enabled'],
                  ]} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* CP-05: Links, Attribute, Option */
function CP05Content({ toko, produk }: { produk: Produk[]; toko: Toko }) {
  return (
    <div className="space-y-6">
      {produk.map((p, i) => (
        <div key={p.id} className="space-y-4">
          <SectionTitle>Produk {i + 1}: Links</SectionTitle>
          <InfoTable rows={[
            ['Manufacturer', p.manufacturer],
            ['Categories', safeArray<string>(p.kategori).join(', ')],
          ]} />

          {safeArray<{group:string;name:string;value:string}>(p.attributes).length > 0 && (
            <>
              <SectionTitle>Attributes</SectionTitle>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                {safeArray<{group:string;name:string;value:string}>(p.attributes).map((a, j) => (
                  <div key={j} className={`flex text-sm ${j % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/80' : 'bg-white dark:bg-slate-800/30'}`}>
                    <div className="w-1/4 px-4 py-3 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 font-medium">{a.group}</div>
                    <div className="w-1/3 px-4 py-3 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{a.name}</div>
                    <div className="flex-1 px-4 py-3 text-sky-600 dark:text-sky-400 font-bold">{a.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {safeArray<{name:string;type:string;values:{label:string;price_modifier:number;qty:number}[]}>(p.options).length > 0 && (
            <>
              <SectionTitle>Options (Varian)</SectionTitle>
              {safeArray<{name:string;type:string;values:{label:string;price_modifier:number;qty:number}[]}>(p.options).map((opt, j) => (
                <div key={j} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 mb-3">
                  <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-3 flex items-center gap-3">
                    <span className="text-slate-900 dark:text-slate-100 text-sm font-bold">{opt.name}</span>
                    <span className="text-xs px-2 py-1 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-full font-mono">{opt.type}</span>
                  </div>
                  {opt.values.map((v, k) => (
                    <div key={k} className={`flex text-sm ${k % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/80' : 'bg-white dark:bg-slate-800/30'}`}>
                      <div className="flex-1 px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{v.label}</div>
                      <div className="w-32 px-4 py-3 text-amber-600 dark:text-amber-400 text-right font-mono">
                        {v.price_modifier > 0 ? '+Rp ' + v.price_modifier.toLocaleString('id-ID') :
                         v.price_modifier < 0 ? '-Rp ' + Math.abs(v.price_modifier).toLocaleString('id-ID') : '—'}
                      </div>
                      <div className="w-20 px-4 py-3 text-slate-500 dark:text-slate-400 text-right">{v.qty} pcs</div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

/* CP-06: Discount */
function CP06Content({ produk, fmt }: { produk: Produk[]; fmt: (n: number) => string }) {
  return (
    <div className="space-y-6">
      <Callout type="info">
        Tab <strong>Discount</strong> di form produk. Discount berlaku saat pembelian memenuhi minimum quantity.
      </Callout>
      {produk.map((p, i) => (
        <div key={p.id}>
          <SectionTitle>Produk {i + 1}: {p.nama_produk}</SectionTitle>
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-3 text-sm text-amber-500 font-medium italic">
            &quot;{safeText(p.deskripsi_diskon, 'Gunakan strategi diskon yang sesuai untuk produk ini.')}&quot;
          </div>
          <InfoTable rows={[
            ['Customer Group', 'Default'],
            ['Quantity (min.)', safeText(p.discount_min_qty)],
            ['Priority', '0'],
            ['Price', safePrice(p.discount_harga, fmt)],
            ['Date Start', safeText(p.discount_mulai)],
            ['Date End', safeText(p.discount_selesai)],
          ]} />
        </div>
      ))}
      <Callout type="tip">
        Klik <strong>Add Discount</strong> di tabel Discount, isi semua field, lalu Save.
      </Callout>
    </div>
  )
}

/* CP-07: Special */
function CP07Content({ produk, fmt }: { produk: Produk[]; fmt: (n: number) => string }) {
  return (
    <div className="space-y-6">
      <Callout type="info">
        Tab <strong>Special</strong> di form produk. Harga spesial berlaku tanpa syarat minimum qty.
      </Callout>
      {produk.map((p, i) => (
        <div key={p.id}>
          <SectionTitle>Produk {i + 1}: {p.nama_produk}</SectionTitle>
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-3 text-sm text-emerald-500 font-medium italic">
            &quot;{safeText(p.deskripsi_special, 'Gunakan harga spesial yang sesuai untuk event promosi produk ini.')}&quot;
          </div>
          <InfoTable rows={[
            ['Customer Group', 'Default'],
            ['Priority', '0'],
            ['Price', safePrice(p.special_harga, fmt)],
            ['Date Start', safeText(p.special_mulai)],
            ['Date End', safeText(p.special_selesai)],
          ]} />
        </div>
      ))}
    </div>
  )
}

/* CP-08: Image & SEO */
function CP08Content({ produk }: { produk: Produk[] }) {
  return (
    <div className="space-y-6">
      <Callout type="info">
        Tab <strong>Image</strong>: upload gambar produk. Tab <strong>SEO</strong>: isi keyword.
      </Callout>
      {produk.map((p, i) => {
        const images = getProductImages(p)
        return (
          <div key={p.id}>
            <SectionTitle>Produk {i + 1}: {p.nama_produk}</SectionTitle>
            <InfoTable rows={[
              ["SEO Keyword", <code key="seo" className="text-sky-400 font-bold">{p.seo_keyword}</code>],
            ]} />
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((url, j) => (
                <a key={`${url}-${j}`} href={url} target="_blank" rel="noopener noreferrer"
                  className="group block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition hover:border-sky-400">
                  <div className="aspect-square w-full relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getDriveDirectUrl(url)} alt={`g${j + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    Gambar {j + 1} ?
                  </div>
                </a>
              ))}
              {images.length === 0 && (
                <p className="text-slate-500 text-sm italic">Gunakan gambar produk yang sesuai (cari sendiri atau minta dosen).</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* CP-09: Banner Slideshow */
/* CP-09: Banner Slideshow */
function CP09Content({ toko, produk }: { produk: Produk[]; toko: Toko }) {
  const slideshows = getTokoSlideshows(toko)

  return (
    <div className="space-y-4">
      <Callout type="info">
        Buka <strong>Extensions ? Modules ? Slideshow</strong> (atau Banners). Tambahkan banner slideshow toko berikut.
      </Callout>
      <SectionTitle>Banner Slideshow Toko</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {slideshows.map((url, index) => (
          <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer"
            className="group block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition hover:border-sky-400">
            <div className="aspect-[16/7] w-full relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getDriveDirectUrl(url)} alt={`slideshow ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
              Slideshow {index + 1} ?
            </div>
          </a>
        ))}
      </div>
      {slideshows.length === 0 && (
        <p className="text-slate-500 text-sm italic">Gambar slideshow toko belum diisi dosen.</p>
      )}
      <SectionTitle>Produk yang Dihubungkan</SectionTitle>
      {produk.map((p) => (
        <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-sm font-black flex items-center justify-center flex-shrink-0">
            {getProductImages(p).length}
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 dark:text-slate-200 text-base font-bold">{p.nama_produk}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Pastikan banner/link mengarah ke halaman produk ini</p>
          </div>
        </div>
      ))}
      <Callout type="warning">
        Setiap banner harus memiliki <strong>link</strong> yang mengarah ke halaman produk tersebut.
        Pastikan slideshow tampil di halaman depan toko.
      </Callout>
    </div>
  )
}
