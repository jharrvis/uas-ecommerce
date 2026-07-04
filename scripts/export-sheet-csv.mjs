import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const sourcePath = path.join(rootDir, 'gs', 'stores-products.json')
const outputDir = path.join(rootDir, 'gs', 'import-ready')

const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))

const tokoHeaders = [
  'id',
  'nama_toko',
  'alamat',
  'email',
  'telepon',
  'deskripsi_bisnis',
  'logo_url',
  'event_promo',
  'aktif',
]

const produkHeaders = [
  'id',
  'id_toko',
  'nama_produk',
  'manufacturer',
  'logo_manufacturer',
  'harga',
  'stok',
  'berat_kg',
  'dimensi',
  'sku',
  'seo_keyword',
  'kategori',
  'attributes',
  'options',
  'discount_min_qty',
  'discount_harga',
  'discount_mulai',
  'discount_selesai',
  'special_harga',
  'special_mulai',
  'special_selesai',
  'deskripsi_diskon',
  'deskripsi_special',
  'gambar_1',
  'gambar_2',
  'gambar_3',
  'aktif',
]

function normalizeValue(value) {
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (value === null || value === undefined) return ''
  return String(value)
}

function toCsv(headers, rows) {
  const lines = [headers.join(',')]

  for (const row of rows) {
    const line = headers.map((header) => JSON.stringify(normalizeValue(row[header]))).join(',')
    lines.push(line)
  }

  return lines.join('\n') + '\n'
}

fs.mkdirSync(outputDir, { recursive: true })

fs.writeFileSync(path.join(outputDir, 'toko.csv'), toCsv(tokoHeaders, data.toko))
fs.writeFileSync(path.join(outputDir, 'produk.csv'), toCsv(produkHeaders, data.produk))

console.log(`Generated CSV files in: ${outputDir}`)
