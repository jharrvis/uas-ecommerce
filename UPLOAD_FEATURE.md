# Fitur Upload Logo Toko - Dashboard Dosen

## ✅ Fitur yang Tersedia

### 1. Upload Logo Toko di Dashboard Dosen
- **Lokasi**: Tab "Data Toko" → Klik "Edit" pada toko → Bagian "Logo Toko & Slideshow"
- **Pembatasan File**: Maksimal 300KB
- **Format File**: JPG, PNG, GIF (image/*)
- **Preview**: Langsung muncul setelah upload berhasil

### 2. Tampilan Logo di Halaman Ujian Mahasiswa
- **Lokasi**: Tab "Data Toko" (CP01) → Logo toko muncul di instruksi
- **Format**: Thumbnail dengan background putih dan border
- **Optimasi**: Menggunakan `getDriveDirectUrl` untuk URL Google Drive

### 3. Validasi Upload
- **Ukuran File**: Maksimal 300KB (sebelumnya 10MB)
- **Error Message**: Menampilkan nama file dan ukuran aktual jika melebihi batas
- **Loading State**: Spinner saat proses upload
- **Auto Reset**: Input file otomatis reset setelah upload

### 4. Fallback Manual
- **Input Text**: Bisa langsung input URL gambar manual
- **Preview**: Tetap muncul meski input manual (jika URL valid)

## 🛠️ Teknis

### Komponen yang Digunakan
- `DataToko.tsx` - Form edit toko dengan upload logo
- `Checkpoint.tsx` - Tampilan logo di halaman ujian
- `getDriveDirectUrl()` - Konversi Google Drive URL ke thumbnail

### API Integration
- `apiUploadProductAsset()` - Upload gambar ke Google Drive
- Validasi ukuran file di frontend sebelum upload

### Image Optimization
- Next.js Image component untuk preview di dashboard
- Unoptimized mode untuk Google Drive URLs

## 📱 Cara Penggunaan

### Untuk Dosen:
1. Buka dashboard dosen
2. Pilih tab "Data Toko"
3. Klik "Edit" pada toko yang ingin diubah
4. Di bagian "Logo Toko & Slideshow", klik tombol "Upload"
5. Pilih file gambar (maks 300KB)
6. Logo akan terpreview otomatis
7. Klik "Simpan" untuk menyimpan perubahan

### Untuk Mahasiswa:
1. Di halaman ujian, buka tab "Data Toko" (CP01)
2. Logo toko akan muncul di instruksi dengan gambar preview
3. Mahasiswa bisa melihat logo yang harus diupload ke OpenCart

## 🔧 Troubleshooting

### Jika Logo Tidak Muncul:
1. Pastikan file berhasil upload (cek preview di dashboard)
2. Verifikasi URL gambar valid di Google Drive
3. Cek koneksi internet saat proses upload
4. Refresh halaman jika perlu

### Error Upload:
- **Ukuran terlalu besar**: File melebihi 300KB
- **Format tidak valid**: Bukan file gambar
- **Koneksi gagal**: Periksa jaringan internet

### Tips:
- Gunakan file logo dengan format PNG untuk kualitas terbaik
- Ukuran ideal 200x200px dengan ukuran file < 300KB
- Pastikan file tidak blur atau berkualitas rendah