import type { Produk, Toko } from '@/types'

export function getDriveDirectUrl(url: string): string {
  if (!url) return url

  const fileId = getDriveFileId(url)
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
  }

  return url
}

function getDriveFileId(url: string): string {
  // Format: https://drive.google.com/file/d/FILE_ID/view?...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    return fileMatch[1]
  }

  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    return openMatch[1]
  }

  // Format: https://drive.google.com/uc?id=FILE_ID
  const ucMatch = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/)
  if (ucMatch) {
    return ucMatch[1]
  }

  return ''
}

export function getProductImages(produk: Partial<Produk>): string[] {
  const dynamicImages = Array.isArray(produk.gambar_produk)
    ? produk.gambar_produk
    : safeJsonArray(produk.gambar_produk)

  const legacyImages = [produk.gambar_1, produk.gambar_2, produk.gambar_3]
  return [...dynamicImages, ...legacyImages]
    .map((url) => String(url || '').trim())
    .filter((url, index, arr) => url && arr.indexOf(url) === index)
}

export function getTokoBrands(toko: Partial<Toko>): { name: string; logo: string }[] {
  return [
    { name: toko.brand_1_name, logo: toko.brand_1_logo },
    { name: toko.brand_2_name, logo: toko.brand_2_logo },
    { name: toko.brand_3_name, logo: toko.brand_3_logo },
    { name: toko.brand_4_name, logo: toko.brand_4_logo },
  ]
    .map((brand) => ({
      name: String(brand.name || '').trim(),
      logo: String(brand.logo || '').trim(),
    }))
    .filter((brand) => brand.name || brand.logo)
}

export function getTokoSlideshows(toko: Partial<Toko>): string[] {
  return [toko.slideshow_1, toko.slideshow_2]
    .map((url) => String(url || '').trim())
    .filter(Boolean)
}

function safeJsonArray(value: unknown): string[] {
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return value
      .split(/[;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
}
