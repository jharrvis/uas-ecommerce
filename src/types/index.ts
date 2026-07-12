// ─────────────────────────────────────────────
// CORE TYPES — UAS E-Commerce STIEAMA
// ─────────────────────────────────────────────

export interface Mahasiswa {
  nim: string
  nama: string
  kelas: string
  foto: string
  website_ujian: string
  aktif: boolean
}

export interface Toko {
  id: string
  nama_toko: string
  alamat: string
  email: string
  telepon: string
  deskripsi_bisnis: string
  logo_url: string
  brand_1_name: string
  brand_1_logo: string
  brand_2_name: string
  brand_2_logo: string
  brand_3_name: string
  brand_3_logo: string
  brand_4_name: string
  brand_4_logo: string
  slideshow_1: string
  slideshow_2: string
  event_promo: string[]
  aktif: boolean
}

export interface OptionValue {
  label: string
  price_modifier: number
  qty: number
}

export interface ProductOption {
  name: string
  type: 'Select' | 'Radio' | 'Checkbox'
  values: OptionValue[]
}

export interface ProductAttribute {
  group: string
  name: string
  value: string
}

export interface Discount {
  min_quantity: number
  customer_group: string
  price: number
  date_start: string
  date_end: string
}

export interface Special {
  customer_group: string
  price: number
  date_start: string
  date_end: string
}

export interface Category {
  id: string
  name: string
  parent_id?: string | null
  level: number
  slug: string
  description?: string
  aktif: boolean
  children?: Category[]
}

export interface Produk {
  id: string
  id_toko: string
  nama_produk: string
  manufacturer: string
  logo_manufacturer: string
  harga: number
  stok: number
  berat_kg: number
  dimensi: string
  sku: string
  seo_keyword: string
  kategori?: string[]      // Backward compatibility
  category_ids?: string[]  // New field for hirarchical categories
  attributes: ProductAttribute[]
  options: ProductOption[]
  discount_min_qty: number
  discount_harga: number
  discount_mulai: string
  discount_selesai: string
  special_harga: number
  special_mulai: string
  special_selesai: string
  deskripsi_diskon: string
  deskripsi_special: string
  gambar_produk?: string[]
  gambar_1: string
  gambar_2: string
  gambar_3: string
}

export type CheckpointId =
  | 'cp01' | 'cp02' | 'cp03' | 'cp04' | 'cp05'
  | 'cp06' | 'cp07' | 'cp08' | 'cp09'

export type CheckpointStatus = 'locked' | 'active' | 'done'

export interface CheckpointState {
  status: CheckpointStatus
  screenshotUrl?: string
  screenshotUrls?: string[]
  completedAt?: string
}

export type ExamStatus = 'registered' | 'started' | 'submitted' | 'locked'

export interface ExamSession {
  nim: string
  nama: string
  kelas: string
  foto: string
  website_ujian: string
  tokoSoal: Toko
  produkSoal: Produk[]
  status: ExamStatus
  registeredAt: string
  startedAt: string | null
  submittedAt: string | null
  checkpoints: Record<CheckpointId, CheckpointState>
}

export interface Config {
  durasi_ujian_menit: number
  produk_per_mahasiswa: number
  mode_ujian: string
  mata_kuliah: string
  kode_mk: string
  semester: string
}

export interface HasilMahasiswa {
  nim: string
  nama: string
  kelas: string
  id_toko: string
  id_produk: string
  waktu_login: string
  waktu_mulai: string
  waktu_submit: string
  durasi_menit: number
  status: string
  drive_folder_url: string
  ss_cp01: string; ss_cp02: string; ss_cp03: string
  ss_cp04: string; ss_cp05: string; ss_cp06: string
  ss_cp07: string; ss_cp08: string; ss_cp09: string
  nilai_cp01: number; nilai_cp02: number; nilai_cp03: number
  nilai_cp04: number; nilai_cp05: number; nilai_cp06: number
  nilai_cp07: number; nilai_cp08: number; nilai_cp09: number
  nilai_total: number
  grade: string
  catatan: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

// Checkpoint metadata (static config)
export const CHECKPOINT_META: Record<CheckpointId, {
  label: string
  tab: string
  bobot: number
  icon: string
}> = {
  cp01: { label: 'Data Toko',                  tab: 'System → Settings → Store',         bobot: 10, icon: '🏪' },
  cp02: { label: 'Manufacturer & Carousel',    tab: 'Catalog → Manufacturers + CMS',     bobot: 10, icon: '🏭' },
  cp03: { label: 'Kategori Produk',            tab: 'Catalog → Categories',              bobot: 5,  icon: '🗂️' },
  cp04: { label: 'Produk: General & Data',     tab: 'Products → General, Data',          bobot: 15, icon: '📦' },
  cp05: { label: 'Produk: Links, Attr, Option',tab: 'Products → Links, Attribute, Option',bobot: 15, icon: '🔗' },
  cp06: { label: 'Strategi Diskon',            tab: 'Products → Discount',               bobot: 10, icon: '🏷️' },
  cp07: { label: 'Harga Spesial Event',        tab: 'Products → Special',                bobot: 10, icon: '💸' },
  cp08: { label: 'Gambar & SEO Keyword',       tab: 'Products → Image, SEO',             bobot: 10, icon: '🖼️' },
  cp09: { label: 'Banner Slideshow',           tab: 'Extensions → Banners',              bobot: 15, icon: '🎨' },
}

export const CP_ORDER: CheckpointId[] = [
  'cp01','cp02','cp03','cp04','cp05','cp06','cp07','cp08','cp09'
]
