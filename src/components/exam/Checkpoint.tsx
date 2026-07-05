'use client'

import { useState } from 'react'
import { useExamStore } from '@/store/examStore'
import UploadZone from './UploadZone'
import ImageViewerModal from '@/components/ui/ImageViewerModal'
import type { CheckpointId, Produk, Toko } from '@/types'
import { CHECKPOINT_META } from '@/types'

function safeArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed } catch {}
  }
  return []
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
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-sky-500/20 text-sky-400 flex-shrink-0">
          {meta.icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-200 text-lg">{meta.label}</h3>
          <p className="text-slate-500 text-sm">{meta.tab} · Bobot: <span className="text-sky-400 font-bold">{meta.bobot} poin</span></p>
        </div>
      </div>

      {cp === 'cp01' && <CP01Content toko={toko} />}
      {cp === 'cp02' && <CP02Content produk={produk} />}
      {cp === 'cp03' && <CP03Content produk={produk} />}
      {cp === 'cp04' && <CP04Content produk={produk} fmt={fmt} />}
      {cp === 'cp05' && <CP05Content toko={toko} produk={produk} />}
      {cp === 'cp06' && <CP06Content produk={produk} fmt={fmt} />}
      {cp === 'cp07' && <CP07Content produk={produk} fmt={fmt} />}
      {cp === 'cp08' && <CP08Content produk={produk} />}
      {cp === 'cp09' && <CP09Content toko={toko} produk={produk} />}

      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
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
  return <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2.5 mt-5">{children}</h4>
}

function InfoTable({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800">
      {rows.map(([label, value], i) => (
        <div key={i} className={`flex ${i % 2 === 1 ? 'bg-slate-800/80' : 'bg-slate-800/30'}`}>
          <div className="w-2/5 px-4 py-3 text-slate-400 font-semibold text-sm border-r border-slate-700 flex-shrink-0">
            {label}
          </div>
          <div className="flex-1 px-4 py-3 text-slate-200 text-sm font-mono break-all font-medium">{value}</div>
        </div>
      ))}
    </div>
  )
}

function Callout({ type, children }: { type: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const styles = {
    info:    'bg-sky-500/10 border-sky-500/30 text-sky-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    tip:     'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
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
  return (
    <div className="space-y-4">
      <Callout type="info">
        Buka <strong>System → Settings → Stores</strong>. Edit toko default atau buat baru, isi semua field berikut.
      </Callout>
      <SectionTitle>Data yang Harus Diisi</SectionTitle>
      <InfoTable rows={[
        ['Store Name',  toko.nama_toko],
        ['Store Owner', toko.nama_toko],
        ['Address',     toko.alamat],
        ['Email',       toko.email],
        ['Telephone',   toko.telepon],
        ['Meta Title',  toko.nama_toko],
      ]} />
      {toko.logo_url && (
        <Callout type="tip">
          Upload logo toko ke OpenCart via <strong>Admin → System → Settings → Store Logo</strong>.
          <br />URL logo: <span className="font-mono break-all">{toko.logo_url}</span>
        </Callout>
      )}
    </div>
  )
}

/* CP-02: Manufacturer & Carousel */
function CP02Content({ produk }: { produk: Produk[] }) {
  const manufacturers = produk.reduce<Produk[]>((acc, item) => {
    if (!acc.some((existing) => existing.manufacturer === item.manufacturer)) {
      acc.push(item)
    }
    return acc
  }, [])
  return (
    <div className="space-y-4">
      <Callout type="info">
        Buka <strong>Catalog → Manufacturers → Add New</strong> untuk setiap manufacturer berikut.
        Setelah itu, pasang logo di carousel via <strong>Extensions → Modules → Manufacturer Carousel</strong>.
      </Callout>
      {manufacturers.map((p, i) => (
        <div key={i} className="space-y-2">
          <SectionTitle>Manufacturer {i + 1}</SectionTitle>
          <InfoTable rows={[
            ['Manufacturer Name', p.manufacturer],
            ['SEO Keyword', p.manufacturer.toLowerCase().replace(/\s+/g, '-')],
            ['Logo', p.logo_manufacturer || '(upload logo yang sesuai)'],
          ]} />
        </div>
      ))}
      <Callout type="warning">
        Logo yang dipasang di carousel <strong>harus bisa diklik</strong> dan mengarah ke halaman
        produk berdasarkan manufacturer tersebut (bukan halaman eksternal).
      </Callout>
    </div>
  )
}

/* CP-03: Kategori */
function CP03Content({ produk }: { produk: Produk[] }) {
  const allCats = produk.reduce<string[]>((acc, item) => {
    safeArray<string>(item.kategori).forEach((category) => {
      if (!acc.includes(category)) acc.push(category)
    })
    return acc
  }, [])
  return (
    <div className="space-y-4">
      <Callout type="info">
        Buka <strong>Catalog → Categories → Add New</strong>. Buat kategori berikut jika belum tersedia.
        Jika sudah ada, cukup gunakan yang lama.
      </Callout>
      <SectionTitle>Kategori yang Dibutuhkan</SectionTitle>
      <div className="flex flex-wrap gap-2.5">
        {allCats.map((cat) => (
          <span key={cat} className="px-4 py-2 bg-sky-500/15 border border-sky-500/30 text-sky-400 text-sm font-bold rounded-full">
            {cat}
          </span>
        ))}
      </div>
      <Callout type="tip">
        Kategori induk dibuat terlebih dahulu, kemudian subkategori menggunakan field <strong>Parent</strong>.
      </Callout>
    </div>
  )
}

/* CP-04: General & Data */
function CP04Content({ produk, fmt }: { produk: Produk[]; fmt: (n: number) => string }) {
  return (
    <div className="space-y-6">
      <Callout type="info">
        Buka <strong>Catalog → Products → Add New</strong>. Isi tab <strong>General</strong> dan <strong>Data</strong> untuk setiap produk berikut.
      </Callout>
      {produk.map((p, i) => (
        <div key={p.id}>
          <SectionTitle>Produk {i + 1}: {p.nama_produk}</SectionTitle>
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
      ))}
    </div>
  )
}

/* CP-05: Links, Attribute, Option */
function CP05Content({ toko, produk }: { produk: Produk[]; toko: Toko }) {
  return (
    <div className="space-y-6">
      <Callout type="info">
        Masih di form produk. Isi tab <strong>Links</strong>, <strong>Attribute</strong>, dan <strong>Option</strong>.
      </Callout>
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
              <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800">
                {safeArray<{group:string;name:string;value:string}>(p.attributes).map((a, j) => (
                  <div key={j} className={`flex text-sm ${j % 2 === 1 ? 'bg-slate-800/80' : 'bg-slate-800/30'}`}>
                    <div className="w-1/4 px-4 py-3 text-slate-400 border-r border-slate-700 font-medium">{a.group}</div>
                    <div className="w-1/3 px-4 py-3 text-slate-300 border-r border-slate-700">{a.name}</div>
                    <div className="flex-1 px-4 py-3 text-sky-400 font-bold">{a.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {safeArray<{name:string;type:string;values:{label:string;price_modifier:number;qty:number}[]}>(p.options).length > 0 && (
            <>
              <SectionTitle>Options (Varian)</SectionTitle>
              {safeArray<{name:string;type:string;values:{label:string;price_modifier:number;qty:number}[]}>(p.options).map((opt, j) => (
                <div key={j} className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800 mb-3">
                  <div className="bg-slate-700/50 px-4 py-3 flex items-center gap-3">
                    <span className="text-slate-100 text-sm font-bold">{opt.name}</span>
                    <span className="text-xs px-2 py-1 bg-sky-500/20 text-sky-400 rounded-full font-mono">{opt.type}</span>
                  </div>
                  {opt.values.map((v, k) => (
                    <div key={k} className={`flex text-sm ${k % 2 === 1 ? 'bg-slate-800/80' : 'bg-slate-800/30'}`}>
                      <div className="flex-1 px-4 py-3 text-slate-300 font-medium">{v.label}</div>
                      <div className="w-32 px-4 py-3 text-amber-400 text-right font-mono">
                        {v.price_modifier > 0 ? '+Rp ' + v.price_modifier.toLocaleString('id-ID') :
                         v.price_modifier < 0 ? '-Rp ' + Math.abs(v.price_modifier).toLocaleString('id-ID') : '—'}
                      </div>
                      <div className="w-20 px-4 py-3 text-slate-400 text-right">{v.qty} pcs</div>
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
            &quot;{p.deskripsi_diskon}&quot;
          </div>
          <InfoTable rows={[
            ['Customer Group', 'Default'],
            ['Quantity (min.)', String(p.discount_min_qty)],
            ['Priority', '0'],
            ['Price', fmt(p.discount_harga)],
            ['Date Start', p.discount_mulai],
            ['Date End', p.discount_selesai],
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
            &quot;{p.deskripsi_special}&quot;
          </div>
          <InfoTable rows={[
            ['Customer Group', 'Default'],
            ['Priority', '0'],
            ['Price', fmt(p.special_harga)],
            ['Date Start', p.special_mulai],
            ['Date End', p.special_selesai],
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
      {produk.map((p, i) => (
        <div key={p.id}>
          <SectionTitle>Produk {i + 1}: {p.nama_produk}</SectionTitle>
          <InfoTable rows={[
            ['SEO Keyword', <code key="seo" className="text-sky-400 font-bold">{p.seo_keyword}</code>],
          ]} />
          <div className="mt-3 flex flex-wrap gap-2.5">
            {[p.gambar_1, p.gambar_2, p.gambar_3].filter(Boolean).map((url, j) => (
              <a key={j} href={url} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-lg border border-slate-600 transition">
                📥 Gambar {j + 1}
              </a>
            ))}
            {![p.gambar_1, p.gambar_2, p.gambar_3].some(Boolean) && (
              <p className="text-slate-500 text-sm italic">Gunakan gambar produk yang sesuai (cari sendiri atau minta dosen).</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* CP-09: Banner Slideshow */
function CP09Content({ toko, produk }: { produk: Produk[]; toko: Toko }) {
  return (
    <div className="space-y-4">
      <Callout type="info">
        Buka <strong>Extensions → Modules → Slideshow</strong> (atau Banners). Tambahkan banner untuk setiap produk Anda.
      </Callout>
      <SectionTitle>Banner yang Dipasang</SectionTitle>
      {produk.map((p, i) => (
        <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-xl">
          <span className="text-3xl">🖼️</span>
          <div className="min-w-0">
            <p className="text-slate-200 text-base font-bold">{p.nama_produk}</p>
            <p className="text-slate-400 text-sm">Gunakan gambar produk sebagai banner</p>
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
