# UAS Praktik E-Commerce — STIEAMA

Sistem ujian akhir semester praktik berbasis web untuk mata kuliah **Praktikum E-Commerce (AK8IC115)** S1 Akuntansi STIEAMA.

## Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS v3 |
| State | Zustand (dengan localStorage persist) |
| Backend / API | Google Apps Script (Web App) |
| Database | Google Sheets |
| File Storage | Google Drive |
| Deployment | Vercel (Free tier, region Singapore) |

## Fitur

- 🔐 **Login NIM** — validasi ke Google Sheets
- 🎲 **Soal unik per mahasiswa** — seeded Fisher-Yates shuffle dari NIM
- 📖 **Soal cerita toko** — narasi bisnis realistis bertema promo Juli-Agustus 2026
- ⏱ **Timer countdown keras** — soal terkunci otomatis saat habis
- 📋 **9 checkpoint terstruktur** — accordion per tab OpenCart dengan bobot nilai
- 📸 **Upload screenshot per CP** — tersimpan ke Google Drive per mahasiswa
- 📶 **Offline queue** — upload antri saat koneksi putus, kirim otomatis saat online
- 🚨 **Anti-cheat** — deteksi tab switch, window blur, keyboard shortcut DevTools
- 👩‍🏫 **Dashboard dosen** — monitoring live, input nilai, ekspor ke Sheets
- 📱 **Responsive** — mobile-friendly dengan drawer navigasi

## Struktur File

```
src/
├── app/
│   ├── login/page.tsx          # Form login NIM
│   ├── ujian/[nim]/page.tsx    # Halaman ujian 2-kolom
│   ├── ujian/[nim]/done/page.tsx
│   ├── dosen/page.tsx          # Dashboard dosen
│   └── api/upload/route.ts     # Proxy upload ke Drive
├── components/
│   ├── exam/                   # LeftPanel, RightPanel, Checkpoint, UploadZone
│   └── ui/                     # Toast, ConfirmDialog, ViolationBadge
├── hooks/
│   ├── useAntiCheat.ts         # Tab switch / blur detection
│   ├── useCountdown.ts         # Timer logic
│   └── useOfflineQueue.ts      # Upload retry queue
├── lib/
│   ├── sheets.ts               # API client ke Apps Script
│   └── shuffle.ts              # Seeded Fisher-Yates
├── store/examStore.ts          # Zustand global state
└── types/index.ts              # TypeScript interfaces + checkpoint config
```

## Setup Cepat

### 1. Clone & Install

```bash
git clone https://github.com/[username]/uas-ecommerce.git
cd uas-ecommerce
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
# Edit .env.local:
# APPS_SCRIPT_URL=https://script.google.com/macros/s/[ID]/exec
# NEXT_PUBLIC_DOSEN_CODE=KodeDosen2026!
# SPREADSHEET_ID=[ID]
```

### 3. Google Sheets Setup

1. Buat spreadsheet baru di Google Sheets
2. Buka Extensions → Apps Script → paste isi `Code.gs`
3. Jalankan `setupSheets()` — semua sheet dibuat otomatis + 34 mahasiswa di-import
4. Isi kolom `website_ujian` per mahasiswa
5. Isi data toko dan produk dari `stores-products.json`
6. Deploy sebagai Web App → copy URL → paste ke `.env.local`

### 4. Jalankan Lokal

```bash
npm run dev
# http://localhost:3000
```

### 5. Deploy ke Vercel

```bash
# Push ke GitHub, lalu:
# - Import repo di vercel.com
# - Set env vars yang sama dengan .env.local
# - Deploy otomatis
```

## URL Penting

| URL | Halaman |
|-----|---------|
| `/login` | Login mahasiswa |
| `/ujian/[nim]` | Halaman soal ujian |
| `/ujian/[nim]/done` | Konfirmasi selesai |
| `/dosen` | Dashboard dosen |

## Checkpoint & Bobot

| CP | Tugas | Bobot |
|----|-------|-------|
| CP-01 | Data Toko | 10 |
| CP-02 | Manufacturer & Carousel Logo | 10 |
| CP-03 | Kategori Produk | 5 |
| CP-04 | Produk General & Data | 15 |
| CP-05 | Produk Links, Attribute, Option | 15 |
| CP-06 | Strategi Diskon | 10 |
| CP-07 | Harga Spesial Event | 10 |
| CP-08 | Gambar & SEO Keyword | 10 |
| CP-09 | Banner Slideshow | 15 |
| **Total** | | **100** |

## Grade

| Nilai | Grade |
|-------|-------|
| ≥ 85 | A |
| 75–84 | B |
| 65–74 | C |
| 55–64 | D |
| < 55 | E |

## Lisensi

Internal use — STIEAMA Salatiga. Dikembangkan oleh Jharvis / WebKu.id.
