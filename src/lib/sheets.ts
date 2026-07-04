import type { Config, HasilMahasiswa, Mahasiswa, Produk, Toko } from '@/types'

const BASE_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  ''

// ─── GET helpers ───────────────────────────────────────────

async function appsGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ action, ...params }).toString()
  const res = await fetch(`${BASE_URL}?${qs}`, {
    method: 'GET',
    cache: 'no-store',
    redirect: 'follow', // Pastikan fetch mengikuti redirect HTTP 302 dari Google Apps Script
  })
  
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Apps Script GET failed: ${res.status}. Response: ${text.substring(0, 50)}`)
  }
  
  if (!res.ok && !json.success) throw new Error(json.message || `Apps Script GET failed: ${res.status}`)
  if (!json.success) throw new Error(json.message || 'API error')
  return json
}

async function appsPost<T>(action: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    mode: 'cors', // Penting untuk Apps script POST
    // Jangan set 'Content-Type': 'application/json' karena menyebabkan preflight CORS (OPTIONS)
    // yang tidak disupport dengan baik oleh GAS POST standar. 
    // Pakai text/plain untuk bypass CORS preflight. Apps script doPost(e) bisa handle dengan e.postData.contents
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...body }),
    cache: 'no-store',
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Apps Script POST failed: ${res.status}. Response: ${text.substring(0, 50)}`)
  }
  
  if (!res.ok && !json.success) throw new Error(json.message || `Apps Script POST failed: ${res.status}`)
  if (!json.success) throw new Error(json.message || 'API error')
  return json
}

// ─── Public API ────────────────────────────────────────────

export async function apiGetMahasiswa(nim: string): Promise<{
  mahasiswa: Mahasiswa
  config: Config
}> {
  return appsGet('getMahasiswa', { nim })
}

export async function apiGetMahasiswaList(kelas?: string): Promise<{
  mahasiswa: Mahasiswa[]
  total: number
}> {
  return appsGet('getMahasiswaList', kelas ? { kelas } : {})
}

export async function apiGetPool(): Promise<{
  toko: Toko[]
  produk: Produk[]
}> {
  return appsGet('getPool')
}

export async function apiGetConfig(): Promise<{ config: Config }> {
  return appsGet('getConfig')
}

export async function apiGetHasil(kelas?: string): Promise<{
  hasil: HasilMahasiswa[]
  total: number
}> {
  return appsGet('getHasil', kelas ? { kelas } : {})
}

export async function apiGetSummary(): Promise<{
  summary: {
    total: number
    registered: number
    started: number
    submitted: number
    timeout: number
    scored: number
    per_kelas: Record<string, { total: number; submitted: number; scored: number }>
  }
}> {
  return appsGet('getSummary')
}

export async function apiLogEvent(
  event: 'login' | 'start' | 'cp_done' | 'submit' | 'timeout',
  nim: string,
  extra: Record<string, unknown> = {}
) {
  const params: Record<string, string> = { event, nim }
  Object.entries(extra).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    params[key] = Array.isArray(value) || typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)
  })
  return appsGet('logEvent', params)
}

export async function apiUploadScreenshot(
  nim: string,
  cp: string,
  file: File
): Promise<{ file_url: string; folder_url: string }> {
  const base64Data = await fileToBase64(file)
  return appsPost('uploadScreenshot', {
    nim,
    cp,
    fileName: `${cp}_${nim}_${Date.now()}.${file.name.split('.').pop()}`,
    mimeType: file.type,
    base64Data,
  })
}

export async function apiUpdateNilai(
  nim: string,
  nilai: Record<string, number>,
  catatan?: string
): Promise<{ total: number; grade: string }> {
  return appsPost('updateNilai', { nim, nilai, catatan })
}

export async function apiExportNilai(kelas?: string) {
  return appsPost('exportNilai', { kelas })
}

// ─── Utils ─────────────────────────────────────────────────

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // strip data:...;base64,
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
