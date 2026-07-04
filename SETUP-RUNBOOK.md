# Setup Runbook

Panduan ini fokus pada langkah minimum supaya aplikasi bisa berjalan lokal dan backend Google-nya aktif.

## 1. Persiapan Lokal

Jalankan:

```bash
npm install
npm run build
```

Status saat ini:

- `npm install` sudah berhasil diuji
- `npm run build` sudah berhasil diuji

Untuk development:

```bash
npm run dev
```

Lalu buka `http://localhost:3000`.

## 2. Isi Environment

File `.env.local` sudah disiapkan. Ganti semua placeholder berikut:

```env
APPS_SCRIPT_URL=https://script.google.com/macros/s/PASTE_WEB_APP_URL_HERE/exec
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/PASTE_WEB_APP_URL_HERE/exec
NEXT_PUBLIC_DOSEN_CODE=DOSEN2026!
SPREADSHEET_ID=PASTE_SPREADSHEET_ID_HERE
```

Keterangan:

- `APPS_SCRIPT_URL`: URL Web App dari Google Apps Script
- `NEXT_PUBLIC_APPS_SCRIPT_URL`: URL yang sama, tetapi dipakai request dari browser
- `NEXT_PUBLIC_DOSEN_CODE`: kode login halaman `/dosen`
- `SPREADSHEET_ID`: ID spreadsheet Google Sheets

## 3. Setup Google Spreadsheet

1. Buat spreadsheet baru.
2. Buka `Extensions > Apps Script`.
3. Paste seluruh isi file `gs/Code.gs`.
4. Simpan project Apps Script.
5. Jalankan fungsi `setupSheets()` sekali.
6. Beri semua izin yang diminta Google.

Sesudah `setupSheets()` berjalan, spreadsheet akan memiliki sheet:

- `Mahasiswa`
- `Toko`
- `Produk`
- `Hasil_Ujian`
- `Config`

## 4. Lengkapi Sheet Config

Di sheet `Config`, pastikan nilai berikut terisi benar:

- `durasi_ujian_menit`
- `produk_per_mahasiswa`
- `mode_ujian`
- `kode_dosen`
- `drive_folder_root_id`

Yang wajib agar upload screenshot jalan adalah:

- `drive_folder_root_id`

## 5. Siapkan Folder Google Drive

1. Buat folder root baru di Google Drive, misalnya `UAS E-Commerce Screenshots`.
2. Ambil ID folder dari URL browser.
3. Simpan ID itu ke `drive_folder_root_id` pada sheet `Config`.

Tanpa ini, upload screenshot akan gagal.

## 6. Lengkapi Data Mahasiswa

Sheet `Mahasiswa` sudah dibuat otomatis oleh `setupSheets()`.

Yang masih harus Anda isi:

- kolom `website_ujian` untuk tiap mahasiswa

Nilai ini dipakai frontend untuk tombol buka OpenCart.

## 7. Import Data Toko dan Produk

Sumber data ada di:

- `gs/stores-products.json`

Yang perlu dipindahkan ke spreadsheet:

- array `toko` ke sheet `Toko`
- array `produk` ke sheet `Produk`

Perhatikan format:

- `event_promo`: string dipisah titik koma atau JSON yang masih konsisten
- `kategori`: bisa dipisah titik koma
- `attributes`: JSON string
- `options`: JSON string

## 8. Deploy Apps Script

1. Klik `Deploy > New deployment`.
2. Pilih tipe `Web app`.
3. Set:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone`
4. Deploy.
5. Copy URL Web App.
6. Masukkan ke `APPS_SCRIPT_URL` di `.env.local`.

## 9. Samakan Kode Dosen

Nilai berikut harus sama:

- `NEXT_PUBLIC_DOSEN_CODE` di `.env.local`
- `kode_dosen` di sheet `Config`

Kalau beda, halaman `/dosen` tidak akan bisa login.

## 10. Tes Minimum

Setelah semua selesai:

1. Jalankan `npm run dev`
2. Buka `/login`
3. Login dengan satu NIM yang ada di sheet `Mahasiswa`
4. Klik mulai ujian
5. Pastikan soal tampil
6. Upload satu screenshot pada checkpoint
7. Cek sheet `Hasil_Ujian`
8. Buka `/dosen`
9. Login dengan kode dosen
10. Pastikan data mahasiswa tampil

## 11. Jika Ada Masalah

Masalah umum dan penyebabnya:

- `NIM tidak terdaftar`
  - data mahasiswa belum ada atau salah di sheet `Mahasiswa`
- `APPS_SCRIPT_URL belum dikonfigurasi`
  - `.env.local` belum diisi atau server dev belum direstart
- upload gagal
  - `drive_folder_root_id` kosong atau Apps Script belum punya izin Drive
- halaman dosen tidak bisa login
  - `NEXT_PUBLIC_DOSEN_CODE` tidak sama dengan `kode_dosen`
- soal tidak muncul
  - sheet `Toko` atau `Produk` kosong atau format datanya rusak
