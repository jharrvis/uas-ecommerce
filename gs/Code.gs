/**
 * ============================================================
 * UAS E-COMMERCE STIEAMA — Google Apps Script
 * Mata Kuliah : Praktikum E-Commerce (AK8IC115)
 * Program Studi: S1 Akuntansi
 * Versi        : 1.0.0 | Juni 2026
 * ============================================================
 *
 * CARA DEPLOY:
 * 1. Buka spreadsheet "UAS E-Commerce 2026"
 * 2. Extensions → Apps Script
 * 3. Paste semua kode ini, klik Save
 * 4. Jalankan setupSheets() SEKALI untuk membuat semua sheet
 * 5. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy URL Web App → paste ke .env.local di project Next.js
 *
 * FILE STRUKTUR:
 *   Code.gs      → Router utama doGet / doPost
 *   Setup.gs     → setupSheets() — jalankan sekali
 *   Mahasiswa.gs → Handler data mahasiswa
 *   Soal.gs      → Handler pool toko & produk
 *   Hasil.gs     → Handler log event & hasil ujian
 *   Upload.gs    → Handler upload screenshot ke Drive
 *   Nilai.gs     → Handler input & ekspor nilai dosen
 *
 * Karena Apps Script hanya punya 1 file by default, semua
 * fungsi digabung di sini. Pisahkan ke file berbeda jika
 * project sudah besar.
 * ============================================================
 */

// ─────────────────────────────────────────────
// KONSTANTA — sesuaikan sebelum deploy
// ─────────────────────────────────────────────
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

const SHEET = {
  MAHASISWA : 'Mahasiswa',
  TOKO      : 'Toko',
  PRODUK    : 'Produk',
  HASIL     : 'Hasil_Ujian',
  CONFIG    : 'Config',
};

// Kolom Mahasiswa (A=1, B=2, ...)
const COL_MHS = {
  NIM          : 1,
  NAMA         : 2,
  KELAS        : 3,
  FOTO         : 4,
  WEBSITE_UJIAN: 5,
  AKTIF        : 6,
};

// Kolom Hasil_Ujian
const COL_HASIL = {
  NIM             : 1,
  NAMA            : 2,
  KELAS           : 3,
  ID_TOKO         : 4,
  ID_PRODUK       : 5,   // JSON array string
  WAKTU_LOGIN     : 6,
  WAKTU_MULAI     : 7,
  WAKTU_SUBMIT    : 8,
  DURASI_MENIT    : 9,
  STATUS          : 10,
  DRIVE_FOLDER_URL: 11,
  // CP-01 s/d CP-09 screenshot URL
  SS_CP01: 12,
  SS_CP02: 13,
  SS_CP03: 14,
  SS_CP04: 15,
  SS_CP05: 16,
  SS_CP06: 17,
  SS_CP07: 18,
  SS_CP08: 19,
  SS_CP09: 20,
  // Nilai per CP (diisi dosen)
  NILAI_CP01: 21,
  NILAI_CP02: 22,
  NILAI_CP03: 23,
  NILAI_CP04: 24,
  NILAI_CP05: 25,
  NILAI_CP06: 26,
  NILAI_CP07: 27,
  NILAI_CP08: 28,
  NILAI_CP09: 29,
  NILAI_TOTAL : 30,
  GRADE       : 31,
  CATATAN     : 32,
  RETAKE_REQUESTED    : 33,
  RETAKE_REQUESTED_AT : 34,
  RETAKE_APPROVED_AT  : 35,
  RETAKE_COUNT        : 36,
  TAMBAHAN_WAKTU_MENIT: 37,
};

const HASIL_HEADERS = [
  'nim', 'nama', 'kelas',
  'id_toko', 'id_produk',
  'waktu_login', 'waktu_mulai', 'waktu_submit', 'durasi_menit',
  'status', 'drive_folder_url',
  'ss_cp01', 'ss_cp02', 'ss_cp03', 'ss_cp04', 'ss_cp05',
  'ss_cp06', 'ss_cp07', 'ss_cp08', 'ss_cp09',
  'nilai_cp01', 'nilai_cp02', 'nilai_cp03', 'nilai_cp04', 'nilai_cp05',
  'nilai_cp06', 'nilai_cp07', 'nilai_cp08', 'nilai_cp09',
  'nilai_total', 'grade', 'catatan',
  'retake_requested', 'retake_requested_at', 'retake_approved_at', 'retake_count',
  'tambahan_waktu_menit'
];

// Bobot nilai per checkpoint (total = 100)
const BOBOT_CP = {
  cp01: 10,  // Data Toko
  cp02: 10,  // Manufacturer & Logo
  cp03: 5,   // Kategori
  cp04: 15,  // Produk General & Data
  cp05: 15,  // Links, Attribute, Option
  cp06: 10,  // Discount
  cp07: 10,  // Special
  cp08: 10,  // Image & SEO
  cp09: 15,  // Banner Slideshow
};

const TOKO_HEADERS = [
  'id', 'nama_toko', 'alamat', 'email', 'telepon',
  'deskripsi_bisnis', 'logo_url',
  'brand_1_name', 'brand_1_logo',
  'brand_2_name', 'brand_2_logo',
  'brand_3_name', 'brand_3_logo',
  'brand_4_name', 'brand_4_logo',
  'slideshow_1', 'slideshow_2',
  'event_promo', 'aktif'
];

const PRODUK_HEADERS = [
  'id', 'id_toko', 'nama_produk', 'manufacturer', 'logo_manufacturer',
  'harga', 'stok', 'berat_kg', 'dimensi', 'sku', 'seo_keyword',
  'kategori', 'attributes', 'options',
  'discount_min_qty', 'discount_harga', 'discount_mulai', 'discount_selesai',
  'special_harga', 'special_mulai', 'special_selesai',
  'deskripsi_diskon', 'deskripsi_special',
  'gambar_produk', 'gambar_1', 'gambar_2', 'gambar_3',
  'aktif'
];

// ─────────────────────────────────────────────
// ROUTER UTAMA
// ─────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action || '';
  let result;

  try {
    switch (action) {
      case 'getMahasiswa': result = getMahasiswa(e.parameter.nim);       break;
      case 'getMahasiswaList': result = getMahasiswaList(e.parameter.kelas); break;
      case 'getPool'     : result = getPool();                           break;
      case 'getTokoList' : result = getTokoList();                       break;
      case 'getHasil'    : result = getHasil(e.parameter.kelas);         break;
      case 'getConfig'   : result = getConfig();                         break;
      case 'getExamControl': result = getExamControl(e.parameter.nim);   break;
      case 'getSummary'  : result = getSummary();                        break;
      case 'logEvent'    : result = logEvent(normalizeLogEventParams(e.parameter)); break;
      default:
        result = { success: false, message: 'Action tidak dikenal: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.message, stack: err.stack };
  }

  return output(result);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return output({ success: false, message: 'Body bukan JSON valid' });
  }

  const action = body.action || '';
  let result;

  try {
    switch (action) {
      case 'logEvent'        : result = logEvent(body);         break;
      case 'uploadScreenshot': result = uploadScreenshot(body); break;
      case 'updateNilai'     : result = updateNilai(body);      break;
      case 'exportNilai'     : result = exportNilai(body);      break;
      case 'requestRetake'   : result = requestRetake(body);    break;
      case 'approveRetake'   : result = approveRetake(body);    break;
      case 'resetExamTimer'  : result = resetExamTimer(body);   break;
      case 'extendExamTime'  : result = extendExamTime(body);   break;
      case 'updateConfig'    : result = updateConfig(body);     break;
      case 'upsertMahasiswa' : result = upsertMahasiswa(body);  break;
      case 'importMahasiswa' : result = importMahasiswa(body);  break;
      case 'upsertToko'      : result = upsertToko(body);       break;
      case 'deleteToko'      : result = deleteToko(body);       break;
      case 'upsertProduk'    : result = upsertProduk(body);     break;
      case 'importProduk'    : result = importProduk(body);     break;
      case 'deleteProduk'    : result = deleteProduk(body);     break;
      default:
        result = { success: false, message: 'Action tidak dikenal: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.message };
  }

  return output(result);
}

function output(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeLogEventParams(params) {
  const normalized = Object.assign({}, params);
  if (typeof normalized.id_produk === 'string') {
    try {
      normalized.id_produk = JSON.parse(normalized.id_produk);
    } catch (err) {
      normalized.id_produk = normalized.id_produk
        .split(',')
        .map(function (item) { return item.trim(); })
        .filter(Boolean);
    }
  }
  return normalized;
}

// ─────────────────────────────────────────────
// MAHASISWA
// ─────────────────────────────────────────────

/**
 * Validasi login mahasiswa berdasarkan NIM.
 * Return: data mahasiswa + config ujian.
 */
function getMahasiswa(nim) {
  if (!nim) return { success: false, message: 'NIM tidak boleh kosong' };

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.MAHASISWA);
  const data  = sheet.getDataRange().getValues();

  // Row 0 = header, mulai dari row 1
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[COL_MHS.NIM - 1]).trim() === String(nim).trim()) {
      const aktif = String(row[COL_MHS.AKTIF - 1]).toUpperCase();
      if (aktif === 'FALSE' || aktif === '0' || aktif === 'TIDAK') {
        return { success: false, message: 'Akun mahasiswa tidak aktif. Hubungi dosen.' };
      }

      const mahasiswa = {
        nim         : String(row[COL_MHS.NIM - 1]).trim(),
        nama        : String(row[COL_MHS.NAMA - 1]).trim(),
        kelas       : String(row[COL_MHS.KELAS - 1]).trim(),
        foto        : String(row[COL_MHS.FOTO - 1]).trim(),
        website_ujian: String(row[COL_MHS.WEBSITE_UJIAN - 1]).trim(),
        aktif       : true,
      };

      // Ambil config ujian
      const config = getConfigObject();

      return {
        success   : true,
        mahasiswa,
        config,
        timestamp : new Date().toISOString(),
      };
    }
  }

  return { success: false, message: 'NIM ' + nim + ' tidak terdaftar. Periksa kembali NIM Anda.' };
}

function getMahasiswaList(kelas) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.MAHASISWA);
  const data = sheet.getDataRange().getValues();
  const mahasiswa = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL_MHS.NIM - 1]) continue;

    const aktif = String(row[COL_MHS.AKTIF - 1]).toUpperCase();
    if (aktif === 'FALSE' || aktif === '0' || aktif === 'TIDAK') continue;

    const kelasValue = String(row[COL_MHS.KELAS - 1]).trim().toUpperCase();
    if (kelas && kelasValue !== String(kelas).trim().toUpperCase()) continue;

    mahasiswa.push({
      nim: String(row[COL_MHS.NIM - 1]).trim(),
      nama: String(row[COL_MHS.NAMA - 1]).trim(),
      kelas: String(row[COL_MHS.KELAS - 1]).trim(),
      foto: String(row[COL_MHS.FOTO - 1]).trim(),
      website_ujian: String(row[COL_MHS.WEBSITE_UJIAN - 1]).trim(),
      aktif: true,
    });
  }

  return { success: true, mahasiswa, total: mahasiswa.length };
}

/**
 * Tambah/Edit Mahasiswa (Upsert)
 * body: { nim, nama, kelas, foto, website_ujian, aktif }
 */
function upsertMahasiswa(body) {
  const { nim, nama, kelas, foto, website_ujian, aktif } = body;
  if (!nim) return { success: false, message: 'NIM wajib diisi' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.MAHASISWA);
  const data = sheet.getDataRange().getValues();
  
  let rowIdx = -1;
  // Cari NIM
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_MHS.NIM - 1]).trim() === String(nim).trim()) {
      rowIdx = i + 1;
      break;
    }
  }

  const rowData = [
    nim,
    nama || '',
    kelas || '',
    foto || '',
    website_ujian || '',
    aktif !== undefined ? aktif : true
  ];

  if (rowIdx > -1) {
    // Update
    sheet.getRange(rowIdx, 1, 1, 6).setValues([rowData]);
  } else {
    // Insert
    sheet.appendRow(rowData);
  }

  SpreadsheetApp.flush();
  return { success: true, message: `Mahasiswa ${nim} berhasil disimpan.` };
}

/**
 * Import banyak mahasiswa sekaligus (Batch Upsert)
 * body: { data: [{nim, nama, kelas, foto, website_ujian, aktif}, ...] }
 */
function importMahasiswa(body) {
  const list = body.data;
  if (!list || !Array.isArray(list) || list.length === 0) {
    return { success: false, message: 'Data mahasiswa tidak valid atau kosong' };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.MAHASISWA);
  const data = sheet.getDataRange().getValues();
  
  // Buat map existing data
  const existingMap = {};
  for (let i = 1; i < data.length; i++) {
    const nim = String(data[i][COL_MHS.NIM - 1]).trim();
    if (nim) existingMap[nim] = i + 1; // row index
  }

  let added = 0;
  let updated = 0;

  list.forEach(mhs => {
    if (!mhs.nim) return;
    const nim = String(mhs.nim).trim();
    
    const rowData = [
      nim,
      mhs.nama || '',
      mhs.kelas || '',
      mhs.foto || '',
      mhs.website_ujian || '',
      mhs.aktif !== undefined ? mhs.aktif : true
    ];

    if (existingMap[nim]) {
      // Update existing
      sheet.getRange(existingMap[nim], 1, 1, 6).setValues([rowData]);
      updated++;
    } else {
      // Add new
      sheet.appendRow(rowData);
      added++;
    }
  });

  SpreadsheetApp.flush();
  return { success: true, message: `Import selesai: ${added} ditambahkan, ${updated} diperbarui.` };
}

// ─────────────────────────────────────────────
// POOL SOAL (TOKO & PRODUK)
// ─────────────────────────────────────────────

/**
 * Ambil semua toko aktif dan produk aktif.
 * Next.js akan melakukan seeded shuffle di client.
 */
function getPool() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Toko
  const sheetToko = ss.getSheetByName(SHEET.TOKO);
  ensureSheetHeaders(sheetToko, TOKO_HEADERS);
  const dataToko  = sheetToko.getDataRange().getValues();
  const headerToko = dataToko[0];
  const toko = [];

  for (let i = 1; i < dataToko.length; i++) {
    const row = dataToko[i];
    if (!row[0]) continue; // skip baris kosong
    const aktif = String(row[headerToko.indexOf('aktif')]).toUpperCase();
    if (aktif === 'FALSE' || aktif === '0' || aktif === 'TIDAK') continue;

    const obj = rowToObj(headerToko, row);
    ['event_promo'].forEach(field => {
      if (obj[field] && typeof obj[field] === 'string') {
        try { obj[field] = JSON.parse(obj[field]); }
        catch (_) {
          if (obj[field].includes(';')) obj[field] = obj[field].split(';').map(s => s.trim());
        }
      }
    });
    toko.push(obj);
  }

  // Produk
  const sheetProduk = ss.getSheetByName(SHEET.PRODUK);
  ensureSheetHeaders(sheetProduk, PRODUK_HEADERS);
  const dataProduk  = sheetProduk.getDataRange().getValues();
  const headerProduk = dataProduk[0];
  const produk = [];

  for (let i = 1; i < dataProduk.length; i++) {
    const row = dataProduk[i];
    if (!row[0]) continue;
    const aktif = String(row[headerProduk.indexOf('aktif')]).toUpperCase();
    if (aktif === 'FALSE' || aktif === '0' || aktif === 'TIDAK') continue;

    const obj = rowToObj(headerProduk, row);

    // Parse field JSON yang disimpan sebagai string
    ['kategori', 'event_promo', 'options', 'attributes', 'gambar_produk'].forEach(field => {
      if (obj[field] && typeof obj[field] === 'string') {
        try { obj[field] = JSON.parse(obj[field]); }
        catch (_) {
          // Jika bukan JSON, coba pisah dengan titik koma
          if (obj[field].includes(';')) obj[field] = obj[field].split(';').map(s => s.trim());
        }
      }
    });

    if (!Array.isArray(obj.gambar_produk)) {
      obj.gambar_produk = [obj.gambar_1, obj.gambar_2, obj.gambar_3].filter(Boolean);
    }

    produk.push(obj);
  }

  return {
    success: true,
    toko,
    produk,
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// LOG EVENT & HASIL UJIAN
// ─────────────────────────────────────────────

/**
 * Catat event dari mahasiswa.
 * body.event: 'login' | 'start' | 'cp_done' | 'submit' | 'timeout'
 */
function logEvent(body) {
  const { nim, event } = body;
  if (!nim || !event) return { success: false, message: 'nim dan event wajib diisi' };

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.HASIL);
  ensureSheetHeaders(sheet, HASIL_HEADERS);
  const data  = sheet.getDataRange().getValues();
  const now   = new Date().toISOString();

  // Cari baris NIM
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_HASIL.NIM - 1]).trim() === String(nim).trim()) {
      rowIdx = i + 1; // 1-indexed untuk sheet
      break;
    }
  }

  // Jika belum ada, buat baris baru
  if (rowIdx === -1) {
    const mhs = getMahasiswaObj(nim);
    const newRow = new Array(COL_HASIL.TAMBAHAN_WAKTU_MENIT).fill('');
    newRow[COL_HASIL.NIM - 1]   = nim;
    newRow[COL_HASIL.NAMA - 1]  = mhs ? mhs.nama : '';
    newRow[COL_HASIL.KELAS - 1] = mhs ? mhs.kelas : '';
    newRow[COL_HASIL.STATUS - 1] = 'registered';
    newRow[COL_HASIL.RETAKE_REQUESTED - 1] = 'FALSE';
    newRow[COL_HASIL.RETAKE_COUNT - 1] = 0;
    newRow[COL_HASIL.TAMBAHAN_WAKTU_MENIT - 1] = 0;
    sheet.appendRow(newRow);
    rowIdx = sheet.getLastRow();
  }

  // Update kolom sesuai event
  switch (event) {

    case 'login':
      sheet.getRange(rowIdx, COL_HASIL.WAKTU_LOGIN).setValue(now);
      if (body.id_toko)   sheet.getRange(rowIdx, COL_HASIL.ID_TOKO).setValue(body.id_toko);
      if (body.id_produk) sheet.getRange(rowIdx, COL_HASIL.ID_PRODUK).setValue(JSON.stringify(body.id_produk));
      if (body.status !== undefined) sheet.getRange(rowIdx, COL_HASIL.STATUS).setValue('registered');
      sheet.getRange(rowIdx, COL_HASIL.RETAKE_REQUESTED).setValue('FALSE');
      break;

    case 'start':
      sheet.getRange(rowIdx, COL_HASIL.WAKTU_MULAI).setValue(now);
      sheet.getRange(rowIdx, COL_HASIL.STATUS).setValue('started');
      break;

    case 'cp_done':
      // body.cp = 'cp01' s/d 'cp09', body.screenshot_url
      if (body.cp) {
        const cpNum = parseInt(body.cp.replace('cp', ''), 10);
        const ssCol = COL_HASIL.SS_CP01 + cpNum - 1;
        sheet.getRange(rowIdx, ssCol).setValue(body.screenshot_url || 'done');
      }
      break;

    case 'submit':
      sheet.getRange(rowIdx, COL_HASIL.WAKTU_SUBMIT).setValue(now);
      sheet.getRange(rowIdx, COL_HASIL.STATUS).setValue('submitted');
      // Hitung durasi
      const mulaiStr = sheet.getRange(rowIdx, COL_HASIL.WAKTU_MULAI).getValue();
      if (mulaiStr) {
        const durasi = Math.round((new Date() - new Date(mulaiStr)) / 60000);
        sheet.getRange(rowIdx, COL_HASIL.DURASI_MENIT).setValue(durasi);
      }
      break;

    case 'timeout':
      const config = getConfigObject();
      const baseDuration = Number(config.durasi_ujian_menit) || 90;
      const extraDuration = Number(
        sheet.getRange(rowIdx, COL_HASIL.TAMBAHAN_WAKTU_MENIT).getValue()
      ) || 0;
      const timeoutStart = sheet.getRange(rowIdx, COL_HASIL.WAKTU_MULAI).getValue();
      if (timeoutStart) {
        const deadline = new Date(timeoutStart).getTime()
          + (baseDuration + extraDuration) * 60000;
        if (Date.now() < deadline) {
          return {
            success: true,
            event,
            nim,
            ignored: true,
            message: 'Timeout diabaikan karena mahasiswa masih memiliki waktu.',
          };
        }
      }
      sheet.getRange(rowIdx, COL_HASIL.STATUS).setValue('timeout');
      const mulaiTout = sheet.getRange(rowIdx, COL_HASIL.WAKTU_MULAI).getValue();
      if (mulaiTout) {
        const dur = Math.round((new Date() - new Date(mulaiTout)) / 60000);
        sheet.getRange(rowIdx, COL_HASIL.DURASI_MENIT).setValue(dur);
      }
      break;

    default:
      return { success: false, message: 'Event tidak dikenal: ' + event };
  }

  SpreadsheetApp.flush();
  return { success: true, event, nim, timestamp: now };
}

/**
 * Ambil semua data hasil ujian (untuk dashboard dosen).
 * Optional: filter berdasarkan kelas.
 */
function getHasil(kelas) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.HASIL);
  const mahasiswaSheet = ss.getSheetByName(SHEET.MAHASISWA);
  ensureSheetHeaders(sheet, HASIL_HEADERS);
  const data  = sheet.getDataRange().getValues();
  const header = data[0];
  const mahasiswaData = mahasiswaSheet.getDataRange().getValues();
  const mahasiswaHeader = mahasiswaData[0];
  const nimIndex = mahasiswaHeader.indexOf('nim');
  const websiteIndex = mahasiswaHeader.indexOf('website_ujian');
  const websitesByNim = {};
  const hasil = [];

  for (let i = 1; i < mahasiswaData.length; i++) {
    const nim = String(mahasiswaData[i][nimIndex] || '').trim();
    if (nim) websitesByNim[nim] = String(mahasiswaData[i][websiteIndex] || '').trim();
  }

  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const obj = rowToObj(header, data[i]);
    if (kelas && obj.kelas && obj.kelas.toUpperCase() !== kelas.toUpperCase()) continue;
    obj.website_ujian = websitesByNim[String(obj.nim || '').trim()] || '';
    hasil.push(obj);
  }

  return { success: true, hasil, total: hasil.length };
}

function getExamControl(nim) {
  const normalizedNim = nim ? String(nim).trim() : '';
  if (!normalizedNim) return { success: false, message: 'nim wajib diisi' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.HASIL);
  ensureSheetHeaders(sheet, HASIL_HEADERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_HASIL.NIM - 1]).trim() !== normalizedNim) continue;
    return {
      success: true,
      config: getConfigObject(),
      control: {
        nim: normalizedNim,
        status: String(data[i][COL_HASIL.STATUS - 1] || 'registered'),
        waktu_mulai: data[i][COL_HASIL.WAKTU_MULAI - 1] || '',
        waktu_submit: data[i][COL_HASIL.WAKTU_SUBMIT - 1] || '',
        tambahan_waktu_menit:
          Number(data[i][COL_HASIL.TAMBAHAN_WAKTU_MENIT - 1]) || 0,
      },
    };
  }

  return { success: false, message: 'Data hasil ujian untuk NIM tidak ditemukan.' };
}

function resetExamTimer(body) {
  const nim = body && body.nim ? String(body.nim).trim() : '';
  if (!nim) return { success: false, message: 'nim wajib diisi' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET.HASIL);
    ensureSheetHeaders(sheet, HASIL_HEADERS);
    const data = sheet.getDataRange().getValues();
    const now = new Date().toISOString();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][COL_HASIL.NIM - 1]).trim() !== nim) continue;
      const status = String(data[i][COL_HASIL.STATUS - 1] || '').toLowerCase();
      if (status === 'submitted' || status === 'scored') {
        return { success: false, message: 'Timer ujian yang sudah selesai tidak dapat direset.' };
      }

      const rowIdx = i + 1;
      sheet.getRange(rowIdx, COL_HASIL.WAKTU_MULAI).setValue(now);
      sheet.getRange(rowIdx, COL_HASIL.WAKTU_SUBMIT).setValue('');
      sheet.getRange(rowIdx, COL_HASIL.DURASI_MENIT).setValue(0);
      sheet.getRange(rowIdx, COL_HASIL.STATUS).setValue('started');
      sheet.getRange(rowIdx, COL_HASIL.TAMBAHAN_WAKTU_MENIT).setValue(0);
      sheet.getRange(rowIdx, COL_HASIL.RETAKE_REQUESTED).setValue('FALSE');
      SpreadsheetApp.flush();
      return { success: true, nim, started_at: now };
    }

    return { success: false, message: 'Data hasil ujian untuk NIM tidak ditemukan.' };
  } finally {
    lock.releaseLock();
  }
}

function extendExamTime(body) {
  const nim = body && body.nim ? String(body.nim).trim() : '';
  const minutes = Number(body && body.minutes);
  if (!nim) return { success: false, message: 'nim wajib diisi' };
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 300) {
    return { success: false, message: 'Tambahan waktu harus antara 1 sampai 300 menit.' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET.HASIL);
    ensureSheetHeaders(sheet, HASIL_HEADERS);
    const data = sheet.getDataRange().getValues();
    const config = getConfigObject();
    const baseDuration = Number(config.durasi_ujian_menit) || 90;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][COL_HASIL.NIM - 1]).trim() !== nim) continue;
      const status = String(data[i][COL_HASIL.STATUS - 1] || '').toLowerCase();
      if (status !== 'started' && status !== 'timeout') {
        return {
          success: false,
          message: 'Perpanjangan hanya dapat diberikan pada ujian berjalan atau timeout.',
        };
      }

      const startedAt = data[i][COL_HASIL.WAKTU_MULAI - 1];
      if (!startedAt) return { success: false, message: 'Waktu mulai mahasiswa belum tercatat.' };

      const currentExtra = Number(data[i][COL_HASIL.TAMBAHAN_WAKTU_MENIT - 1]) || 0;
      const elapsed = Math.max(0, (Date.now() - new Date(startedAt).getTime()) / 60000);
      const expiredBy = Math.max(0, Math.ceil(elapsed - baseDuration));
      const nextExtra = status === 'timeout'
        ? Math.max(currentExtra + minutes, expiredBy + minutes)
        : currentExtra + minutes;
      const rowIdx = i + 1;

      sheet.getRange(rowIdx, COL_HASIL.TAMBAHAN_WAKTU_MENIT).setValue(nextExtra);
      sheet.getRange(rowIdx, COL_HASIL.STATUS).setValue('started');
      sheet.getRange(rowIdx, COL_HASIL.WAKTU_SUBMIT).setValue('');
      sheet.getRange(rowIdx, COL_HASIL.RETAKE_REQUESTED).setValue('FALSE');
      SpreadsheetApp.flush();
      return { success: true, nim, extra_minutes: nextExtra };
    }

    return { success: false, message: 'Data hasil ujian untuk NIM tidak ditemukan.' };
  } finally {
    lock.releaseLock();
  }
}

function requestRetake(body) {
  const nim = body && body.nim ? String(body.nim).trim() : '';
  if (!nim) return { success: false, message: 'nim wajib diisi' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.HASIL);
  ensureSheetHeaders(sheet, HASIL_HEADERS);
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_HASIL.NIM - 1]).trim() !== nim) continue;
    const status = String(data[i][COL_HASIL.STATUS - 1]).trim().toLowerCase();
    if (status !== 'timeout') {
      return { success: false, message: 'Retake hanya dapat diajukan setelah timeout.' };
    }

    const rowIdx = i + 1;
    sheet.getRange(rowIdx, COL_HASIL.RETAKE_REQUESTED).setValue('TRUE');
    sheet.getRange(rowIdx, COL_HASIL.RETAKE_REQUESTED_AT).setValue(now);
    SpreadsheetApp.flush();
    return { success: true, nim, requested_at: now };
  }

  return { success: false, message: 'Data hasil ujian untuk NIM tidak ditemukan.' };
}

function approveRetake(body) {
  const nim = body && body.nim ? String(body.nim).trim() : '';
  if (!nim) return { success: false, message: 'nim wajib diisi' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.HASIL);
  ensureSheetHeaders(sheet, HASIL_HEADERS);
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_HASIL.NIM - 1]).trim() !== nim) continue;

    const rowIdx = i + 1;
    const currentCount = Number(data[i][COL_HASIL.RETAKE_COUNT - 1]) || 0;

    sheet.getRange(rowIdx, COL_HASIL.WAKTU_MULAI).setValue('');
    sheet.getRange(rowIdx, COL_HASIL.WAKTU_SUBMIT).setValue('');
    sheet.getRange(rowIdx, COL_HASIL.DURASI_MENIT).setValue('');
    sheet.getRange(rowIdx, COL_HASIL.STATUS).setValue('registered');
    sheet.getRange(rowIdx, COL_HASIL.DRIVE_FOLDER_URL).setValue('');
    sheet.getRange(rowIdx, COL_HASIL.RETAKE_REQUESTED).setValue('FALSE');
    sheet.getRange(rowIdx, COL_HASIL.RETAKE_REQUESTED_AT).setValue('');
    sheet.getRange(rowIdx, COL_HASIL.RETAKE_APPROVED_AT).setValue(now);
    sheet.getRange(rowIdx, COL_HASIL.RETAKE_COUNT).setValue(currentCount + 1);
    sheet.getRange(rowIdx, COL_HASIL.TAMBAHAN_WAKTU_MENIT).setValue(0);
    sheet.getRange(rowIdx, COL_HASIL.CATATAN).setValue('');

    for (var cpCol = COL_HASIL.SS_CP01; cpCol <= COL_HASIL.SS_CP09; cpCol++) {
      sheet.getRange(rowIdx, cpCol).setValue('');
    }
    for (var nilaiCol = COL_HASIL.NILAI_CP01; nilaiCol <= COL_HASIL.NILAI_CP09; nilaiCol++) {
      sheet.getRange(rowIdx, nilaiCol).setValue('');
    }
    sheet.getRange(rowIdx, COL_HASIL.NILAI_TOTAL).setValue('');
    sheet.getRange(rowIdx, COL_HASIL.GRADE).setValue('');

    SpreadsheetApp.flush();
    return { success: true, nim, approved_at: now };
  }

  return { success: false, message: 'Data hasil ujian untuk NIM tidak ditemukan.' };
}

// ─────────────────────────────────────────────
// UPLOAD SCREENSHOT KE GOOGLE DRIVE
// ─────────────────────────────────────────────

/**
 * Upload screenshot dari mahasiswa ke Google Drive.
 * body: { nim, cp, fileName, mimeType, base64Data }
 */
function uploadScreenshot(body) {
  const { nim, cp, fileName, mimeType, base64Data, isProductAsset } = body;
  if (!base64Data) {
    return { success: false, message: 'base64Data wajib diisi' };
  }

  const config      = getConfigObject();
  const rootFolderId = config.drive_folder_root_id;
  if (!rootFolderId) {
    return { success: false, message: 'drive_folder_root_id belum diisi di Sheet Config' };
  }

  const rootFolder = DriveApp.getFolderById(rootFolderId);
  let targetFolder;

  if (isProductAsset) {
    // Mode Upload Gambar Produk Dosen
    const folderName = 'Assets_Produk_UAS';
    const existing = rootFolder.getFoldersByName(folderName);
    if (existing.hasNext()) {
      targetFolder = existing.next();
    } else {
      targetFolder = rootFolder.createFolder(folderName);
      targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  } else {
    // Mode Upload Screenshot Ujian Mahasiswa
    if (!nim || !cp) return { success: false, message: 'nim dan cp wajib diisi untuk screenshot mahasiswa' };
    const folderName = nim + '_' + getNamaMhs(nim);
    const existing = rootFolder.getFoldersByName(folderName);
    if (existing.hasNext()) {
      targetFolder = existing.next();
    } else {
      targetFolder = rootFolder.createFolder(folderName);
      targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  }

  // Decode base64 dan buat file
  const ts       = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss');
  let safeName;
  if (isProductAsset) {
    safeName = (fileName || ('product_' + ts + '.jpg')).replace(/[^a-zA-Z0-9._-]/g, '_');
  } else {
    safeName = (fileName || (cp + '_' + ts + '.jpg')).replace(/[^a-zA-Z0-9._-]/g, '_');
  }
  
  const blob     = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType || 'image/jpeg',
    safeName
  );
  
  const file = targetFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const file_url   = file.getUrl();
  const folder_url = targetFolder.getUrl();

  // Jika ini screenshot mahasiswa, simpan log di sheet Hasil_Ujian
  if (!isProductAsset && nim && cp) {
    logEvent({
      action: 'logEvent',
      event: 'cp_done',
      nim,
      cp,
      screenshot_url: file_url
    });
  }

  return { success: true, file_url, folder_url };
}


// ─────────────────────────────────────────────
// NILAI DOSEN
// ─────────────────────────────────────────────

/**
 * Update nilai per checkpoint untuk satu mahasiswa.
 * body: { nim, nilai: { cp01: 85, cp02: 90, ... }, catatan: "..." }
 */
function updateNilai(body) {
  const { nim, nilai, catatan } = body;
  if (!nim || !nilai) return { success: false, message: 'nim dan nilai wajib diisi' };

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.HASIL);
  ensureSheetHeaders(sheet, HASIL_HEADERS);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_HASIL.NIM - 1]).trim() !== String(nim).trim()) continue;

    const rowIdx = i + 1;
    let total = 0;

    // Tulis nilai per CP
    Object.keys(BOBOT_CP).forEach(cp => {
      const cpNum = parseInt(cp.replace('cp', ''), 10);
      const nilaiCol = COL_HASIL.NILAI_CP01 + cpNum - 1;
      const nilaiVal = nilai[cp] !== undefined ? Number(nilai[cp]) : (data[i][nilaiCol - 1] || 0);
      sheet.getRange(rowIdx, nilaiCol).setValue(nilaiVal);
      total += (nilaiVal / 100) * BOBOT_CP[cp];
    });

    total = Math.round(total);
    sheet.getRange(rowIdx, COL_HASIL.NILAI_TOTAL).setValue(total);
    sheet.getRange(rowIdx, COL_HASIL.GRADE).setValue(hitungGrade(total));
    sheet.getRange(rowIdx, COL_HASIL.STATUS).setValue('scored');

    if (catatan !== undefined) {
      sheet.getRange(rowIdx, COL_HASIL.CATATAN).setValue(catatan);
    }

    SpreadsheetApp.flush();
    return { success: true, nim, total, grade: hitungGrade(total) };
  }

  return { success: false, message: 'NIM tidak ditemukan di Hasil Ujian' };
}

/**
 * Generate sheet Rekap_Nilai baru berisi ringkasan semua mahasiswa.
 */
function exportNilai(body) {
  const ss        = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetHasil = ss.getSheetByName(SHEET.HASIL);
  ensureSheetHeaders(sheetHasil, HASIL_HEADERS);
  const data      = sheetHasil.getDataRange().getValues();
  const header    = data[0];

  // Hapus sheet rekap lama jika ada
  const existing = ss.getSheetByName('Rekap_Nilai');
  if (existing) ss.deleteSheet(existing);

  const rekap = ss.insertSheet('Rekap_Nilai');
  const kelas = body && body.kelas ? body.kelas.toUpperCase() : null;

  // Header rekap
  const rekapHeader = [
    'No', 'NIM', 'Nama', 'Kelas',
    'Status', 'Durasi (menit)',
    'CP-01 (10)', 'CP-02 (10)', 'CP-03 (5)',
    'CP-04 (15)', 'CP-05 (15)', 'CP-06 (10)',
    'CP-07 (10)', 'CP-08 (10)', 'CP-09 (15)',
    'Total (100)', 'Grade', 'Catatan',
  ];
  rekap.appendRow(rekapHeader);

  // Style header
  rekap.getRange(1, 1, 1, rekapHeader.length)
    .setBackground('#1E3A5F')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  let no = 1;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    const kelasRow = String(row[COL_HASIL.KELAS - 1]).toUpperCase();
    if (kelas && kelasRow !== kelas) continue;

    const nilaiArr = [];
    for (let c = 0; c < 9; c++) {
      nilaiArr.push(row[COL_HASIL.NILAI_CP01 - 1 + c] || 0);
    }

    rekap.appendRow([
      no++,
      row[COL_HASIL.NIM - 1],
      row[COL_HASIL.NAMA - 1],
      row[COL_HASIL.KELAS - 1],
      row[COL_HASIL.STATUS - 1],
      row[COL_HASIL.DURASI_MENIT - 1] || '',
      ...nilaiArr,
      row[COL_HASIL.NILAI_TOTAL - 1] || 0,
      row[COL_HASIL.GRADE - 1] || '',
      row[COL_HASIL.CATATAN - 1] || '',
    ]);
  }

  // Auto-resize
  rekap.autoResizeColumns(1, rekapHeader.length);

  // Alternating row colors
  for (let r = 2; r <= no; r++) {
    const bg = r % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
    rekap.getRange(r, 1, 1, rekapHeader.length).setBackground(bg);
  }

  SpreadsheetApp.flush();
  return {
    success     : true,
    sheet_name  : 'Rekap_Nilai',
    total_rows  : no - 1,
    spreadsheet_url: ss.getUrl(),
  };
}

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

function getConfig() {
  return { success: true, config: getConfigObject() };
}

function updateConfig(body) {
  const config = body.config;
  if (!config || typeof config !== 'object') {
    return { success: false, message: 'config wajib diisi' };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.CONFIG);
  const data = sheet.getDataRange().getValues();
  const rowsByKey = {};

  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0] || '').trim();
    if (key) rowsByKey[key] = i + 1;
  }

  Object.keys(config).forEach(function (key) {
    if (rowsByKey[key]) {
      sheet.getRange(rowsByKey[key], 2).setValue(config[key]);
    } else {
      sheet.appendRow([key, config[key], 'Updated from dashboard dosen']);
    }
  });

  SpreadsheetApp.flush();
  const finalizedCount = String(config.mode_ujian || '').toLowerCase() === 'selesai'
    ? finalizeOpenExams()
    : 0;
  return {
    success: true,
    config: getConfigObject(),
    finalized_count: finalizedCount,
  };
}

function finalizeOpenExams() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET.HASIL);
    ensureSheetHeaders(sheet, HASIL_HEADERS);
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    const nowIso = now.toISOString();
    let finalized = 0;

    for (let i = 1; i < data.length; i++) {
      const status = String(data[i][COL_HASIL.STATUS - 1] || '').toLowerCase();
      if (status !== 'started' && status !== 'timeout') continue;

      const rowIdx = i + 1;
      const startedAt = data[i][COL_HASIL.WAKTU_MULAI - 1];
      sheet.getRange(rowIdx, COL_HASIL.WAKTU_SUBMIT).setValue(nowIso);
      sheet.getRange(rowIdx, COL_HASIL.STATUS).setValue('submitted');
      if (startedAt) {
        const duration = Math.max(
          0,
          Math.round((now.getTime() - new Date(startedAt).getTime()) / 60000)
        );
        sheet.getRange(rowIdx, COL_HASIL.DURASI_MENIT).setValue(duration);
      }
      finalized++;
    }

    SpreadsheetApp.flush();
    return finalized;
  } finally {
    lock.releaseLock();
  }
}

function getConfigObject() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.CONFIG);
  if (!sheet) return {};
  const data  = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    config[String(data[i][0]).trim()] = data[i][1];
  }
  return config;
}

// ─────────────────────────────────────────────
// SUMMARY (dashboard overview)
// ─────────────────────────────────────────────

function getSummary() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.HASIL);
  ensureSheetHeaders(sheet, HASIL_HEADERS);
  const data  = sheet.getDataRange().getValues();

  const summary = {
    total      : 0,
    registered : 0,
    started    : 0,
    submitted  : 0,
    timeout    : 0,
    scored     : 0,
    per_kelas  : {},
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    summary.total++;
    const status = String(row[COL_HASIL.STATUS - 1]).toLowerCase();
    if (summary[status] !== undefined) summary[status]++;

    const kelas = String(row[COL_HASIL.KELAS - 1]).toUpperCase();
    if (!summary.per_kelas[kelas]) summary.per_kelas[kelas] = { total: 0, submitted: 0, scored: 0 };
    summary.per_kelas[kelas].total++;
    if (status === 'submitted' || status === 'scored') summary.per_kelas[kelas].submitted++;
    if (status === 'scored') summary.per_kelas[kelas].scored++;
  }

  return { success: true, summary };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function rowToObj(header, row) {
  const obj = {};
  header.forEach((key, i) => {
    if (key) obj[String(key).trim()] = row[i];
  });
  return obj;
}

function ensureSheetHeaders(sheet, requiredHeaders) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    .map(function(header) { return String(header || '').trim(); });

  const missing = requiredHeaders.filter(function(header) {
    return existingHeaders.indexOf(header) === -1;
  });

  if (missing.length === 0) return existingHeaders;

  sheet.getRange(1, existingHeaders.length + 1, 1, missing.length).setValues([missing]);
  sheet.getRange(1, 1, 1, existingHeaders.length + missing.length)
    .setBackground('#1E3A5F')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11);
  SpreadsheetApp.flush();

  return existingHeaders.concat(missing);
}

function getMahasiswaObj(nim) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.MAHASISWA);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_MHS.NIM - 1]).trim() === String(nim).trim()) {
      return {
        nim  : data[i][COL_MHS.NIM - 1],
        nama : data[i][COL_MHS.NAMA - 1],
        kelas: data[i][COL_MHS.KELAS - 1],
      };
    }
  }
  return null;
}

function getNamaMhs(nim) {
  const mhs = getMahasiswaObj(nim);
  return mhs ? mhs.nama.replace(/\s+/g, '_').substring(0, 20) : nim;
}

function hitungGrade(total) {
  if (total >= 85) return 'A';
  if (total >= 75) return 'B';
  if (total >= 65) return 'C';
  if (total >= 55) return 'D';
  return 'E';
}

// ─────────────────────────────────────────────
// SETUP — jalankan sekali via Run → setupSheets()
// ─────────────────────────────────────────────

/**
 * Buat semua sheet dengan header yang benar.
 * PERINGATAN: Tidak akan menghapus sheet yang sudah ada.
 * Jalankan hanya sekali saat pertama kali setup.
 */
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ui = SpreadsheetApp.getUi();

  _createSheetIfNotExist(ss, SHEET.MAHASISWA, [
    'nim', 'nama', 'kelas', 'foto', 'website_ujian', 'aktif'
  ]);

  _createSheetIfNotExist(ss, SHEET.TOKO, TOKO_HEADERS);

  _createSheetIfNotExist(ss, SHEET.PRODUK, PRODUK_HEADERS);

  _createSheetIfNotExist(ss, SHEET.HASIL, HASIL_HEADERS);

  _createSheetIfNotExist(ss, SHEET.CONFIG, ['key', 'value', 'keterangan']);

  // Isi Config default
  _fillConfigDefaults(ss);

  // Import data mahasiswa dari JSON
  _importMahasiswa(ss);

  ui.alert(
    '✅ Setup Berhasil!',
    'Semua sheet sudah dibuat:\n' +
    '• Mahasiswa (34 mahasiswa dari Kelas A & B)\n' +
    '• Toko (kosong — isi manual atau import)\n' +
    '• Produk (kosong — isi manual atau import)\n' +
    '• Hasil_Ujian (kosong — terisi otomatis saat ujian)\n' +
    '• Config (terisi default)\n\n' +
    'Langkah berikutnya:\n' +
    '1. Isi kolom website_ujian di sheet Mahasiswa\n' +
    '2. Isi data Toko dan Produk\n' +
    '3. Isi drive_folder_root_id di sheet Config\n' +
    '4. Deploy sebagai Web App\n' +
    '5. Copy URL ke .env.local Next.js',
    ui.ButtonSet.OK
  );
}

// ─────────────────────────────────────────────
// PRODUK (MANAJEMEN OLEH DOSEN)
// ─────────────────────────────────────────────

function upsertToko(body) {
  const { id } = body;
  if (!id) return { success: false, message: 'ID Toko wajib diisi' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.TOKO);
  ensureSheetHeaders(sheet, TOKO_HEADERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = headers.map(header => {
    const key = String(header).toLowerCase();

    if (key === 'event_promo' && Array.isArray(body[key])) {
      return JSON.stringify(body[key]);
    }

    if (body[key] !== undefined) return body[key];
    if (rowIndex > -1) return data[rowIndex - 1][headers.indexOf(header)];
    if (key === 'aktif') return true;
    return '';
  });

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { success: true, message: `Toko ${id} berhasil diupdate` };
  }

  sheet.appendRow(rowData);
  return { success: true, message: `Toko ${id} berhasil ditambahkan` };
}

function deleteToko(body) {
  const { id } = body;
  if (!id) return { success: false, message: 'ID Toko wajib diisi' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.TOKO);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: `Toko ${id} berhasil dihapus` };
    }
  }

  return { success: false, message: `Toko ${id} tidak ditemukan` };
}

function upsertProduk(body) {
  const { id } = body;
  if (!id) return { success: false, message: 'ID Produk wajib diisi' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.PRODUK);
  ensureSheetHeaders(sheet, PRODUK_HEADERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = headers.map(header => {
    const key = header.toLowerCase();
    
    // Khusus untuk array, pastikan disave sebagai string JSON jika bentuknya array
    if (['kategori', 'options', 'attributes', 'gambar_produk'].includes(key) && Array.isArray(body[key])) {
      return JSON.stringify(body[key]);
    }

    if (body[key] !== undefined) return body[key];
    
    // Jika update tapi field tidak dikirim, pertahankan data lama
    if (rowIndex > -1) {
      const oldVal = data[rowIndex - 1][headers.indexOf(header)];
      return oldVal;
    }
    
    return '';
  });

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { success: true, message: `Produk ${id} berhasil diupdate` };
  } else {
    sheet.appendRow(rowData);
    return { success: true, message: `Produk ${id} berhasil ditambahkan` };
  }
}

function importProduk(body) {
  const { items } = body; // array of objects
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { success: false, message: 'Tidak ada data produk yang diimport' };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.PRODUK);
  ensureSheetHeaders(sheet, PRODUK_HEADERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let added = 0;
  let updated = 0;

  items.forEach(item => {
    if (!item.id) return;
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(item.id).trim()) {
        rowIndex = i + 1;
        break;
      }
    }

    const rowData = headers.map(header => {
      const key = header.toLowerCase();
      // Khusus field array di-stringify jika perlu
      if (['kategori', 'options', 'attributes', 'gambar_produk'].includes(key) && Array.isArray(item[key])) {
        return JSON.stringify(item[key]);
      }
      if (item[key] !== undefined) return item[key];
      if (rowIndex > -1) return data[rowIndex - 1][headers.indexOf(header)];
      return '';
    });

    if (rowIndex > -1) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      updated++;
    } else {
      sheet.appendRow(rowData);
      added++;
      data.push(rowData); // update local array for next iterations checking
    }
  });

  return { success: true, message: `Berhasil import: ${added} ditambahkan, ${updated} diupdate` };
}

function deleteProduk(body) {
  const { id } = body;
  if (!id) return { success: false, message: 'ID Produk wajib diisi' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.PRODUK);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: `Produk ${id} berhasil dihapus` };
    }
  }

  return { success: false, message: `Produk ${id} tidak ditemukan` };
}

function _createSheetIfNotExist(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  // Hanya isi header jika sheet kosong
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#1E3A5F')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontSize(11);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }

  return sheet;
}

function _fillConfigDefaults(ss) {
  const sheet = ss.getSheetByName(SHEET.CONFIG);
  if (sheet.getLastRow() > 1) return; // Sudah ada data

  const defaults = [
    ['durasi_ujian_menit',    90,              'Durasi timer ujian dalam menit'],
    ['produk_per_mahasiswa',  2,               'Jumlah produk yang diacak per mahasiswa'],
    ['mode_ujian',            'aktif',         'aktif | jeda | selesai'],
    ['anti_cheat_enabled',    'OFF',           'ON | OFF untuk deteksi pelanggaran browser'],
    ['kode_dosen',            'DOSEN2026!',    'Kode akses halaman dosen — GANTI sebelum ujian!'],
    ['drive_folder_root_id',  '',              'ID folder Google Drive untuk screenshots — wajib diisi'],
    ['max_upload_mb',         10,              'Batas ukuran file screenshot (MB)'],
    ['mata_kuliah',           'Praktikum E-Commerce', 'Nama mata kuliah'],
    ['kode_mk',               'AK8IC115',      'Kode mata kuliah'],
    ['semester',              'Genap 2025/2026','Semester aktif'],
    ['versi_sistem',          '1.0.0',         'Versi sistem UAS'],
  ];

  defaults.forEach(row => sheet.appendRow(row));
  sheet.autoResizeColumns(1, 3);
}

function _importMahasiswa(ss) {
  const sheet = ss.getSheetByName(SHEET.MAHASISWA);
  if (sheet.getLastRow() > 1) return; // Sudah ada data mahasiswa

  // Data mahasiswa kelas A & B (AK8IC115 — Genap 2025/2026)
  const mahasiswa = [
    // Kelas A — Reguler Pagi
    ['2022105020', 'RAY ALHA LATAZA SAKTI JO',         'A', '', '', true],
    ['2022105025', 'NILA IRSADA',                       'A', '', '', true],
    ['2022105033', 'YULITA RATNA KOBA',                 'A', 'https://elearning.stieama.ac.id/client/stieama/mahasiswa/2022105033/foto/2022105033.jpg', '', true],
    ['2022105015', 'ELEN KRISNIANDA',                   'A', '', '', true],
    ['2022105007', 'DWI NURRAHMAWATI',                  'A', '', '', true],
    ['2022105018', 'FAJAR HIDAYAT',                     'A', '', '', true],
    ['2022105026', 'RINDU AJENG WIGATININGTYAS',        'A', '', '', true],
    ['2022105017', 'FAIZA ANNISA SALSABILA',            'A', '', '', true],
    ['2022105021', 'KHOIROTUN NADHIROH',                'A', '', '', true],
    ['2022105030', 'SANIA CAMILIA PUTRI',               'A', '', '', true],
    ['2022105001', 'MARIA RUTVERRA AGNESTIANA',         'A', '', '', true],
    ['2022105002', 'AULIA NURMALA SANDY',               'A', '', '', true],
    ['2022105003', 'RINI NOVITASARI',                   'A', '', '', true],
    ['2022105032', 'TEA MARTINA LAORES',                'A', '', '', true],
    ['2022105012', 'CITRA FAHMI NUGRAHANI',             'A', '', '', true],
    ['2022105005', 'MUKHAROMAH NUR ACHIROH',            'A', '', '', true],
    ['2022105013', 'DIANA WULANDARI',                   'A', '', '', true],
    ['2022105009', 'ANGGUN MAULINDA SUYATNO',           'A', '', '', true],
    // Kelas B — Reguler Sore
    ['2022105027', 'NADIA ANANDA PUTRI IKHTIARNI',      'B', 'https://elearning.stieama.ac.id/client/stieama/mahasiswa/2022105027/foto/2022105027.jpeg', '', true],
    ['2022105016', 'EVA KURNILA',                       'B', '', '', true],
    ['2022105024', 'MUHAMMAD SIRAJ',                    'B', 'https://elearning.stieama.ac.id/client/stieama/mahasiswa/2022105024/foto/2022105024.jpg', '', true],
    ['2022105004', 'AINIYA ANIS SAFITRI',               'B', 'https://elearning.stieama.ac.id/client/stieama/mahasiswa/2022105004/foto/2022105004.jpg', '', true],
    ['2022105014', 'DWIKI WIRAWAN',                     'B', 'https://elearning.stieama.ac.id/client/stieama/mahasiswa/2022105014/foto/2022105014.jpg', '', true],
    ['2022105019', 'GALEH PANGESTU',                    'B', '', '', true],
    ['2022105034', 'TITIK ANGGRAENI',                   'B', '', '', true],
    ['2022105006', 'FAJAR NURUL HIDAYAH',               'B', '', '', true],
    ['2022105028', 'NUR AINIYAH',                       'B', '', '', true],
    ['2022105011', 'ANDY MELANO SUNARYO',               'B', '', '', true],
    ['2024117001', 'AGNES WIDYANTI',                    'B', 'https://elearning.stieama.ac.id/client/stieama/mahasiswa/2024117001/foto/2024117001.jpeg', '', true],
    ['2024117002', 'FITRI DWI JAYANTI',                 'B', 'https://elearning.stieama.ac.id/client/stieama/mahasiswa/2024117002/foto/2024116011.jpg', '', true],
    ['2025117003', 'NUR TRI HASTUTI',                   'B', '', '', true],
    ['2025117006', 'SULISTINAH',                        'B', 'https://elearning.stieama.ac.id/client/stieama/mahasiswa/2025117006/foto/2025117006.jpg', '', true],
    ['2025117007', 'LEENA WIDHIKUSUMASTUTY',            'B', '', '', true],
    ['2025117004', 'AKMAL HIKAM',                       'B', '', '', true],
  ];

  mahasiswa.forEach(row => sheet.appendRow(row));

  // Alternating rows
  for (let r = 2; r <= mahasiswa.length + 1; r++) {
    const bg = r % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
    sheet.getRange(r, 1, 1, 6).setBackground(bg);
  }

  // Highlight kolom website_ujian agar dosen mudah menemukannya
  sheet.getRange(2, COL_MHS.WEBSITE_UJIAN, mahasiswa.length, 1)
    .setBackground('#FEF3C7')
    .setNote('Isi URL OpenCart masing-masing mahasiswa sebelum ujian dimulai');

  sheet.autoResizeColumns(1, 6);
}

/**
 * Fungsi utilitas: reset semua data Hasil_Ujian (untuk testing).
 * JANGAN jalankan saat ujian berlangsung!
 */
function resetHasil() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET.HASIL);
  const ui    = SpreadsheetApp.getUi();

  const confirm = ui.alert(
    '⚠️ KONFIRMASI RESET',
    'Ini akan menghapus SEMUA data hasil ujian. Lanjutkan?',
    ui.ButtonSet.YES_NO
  );

  if (confirm === ui.Button.YES) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    ui.alert('✅ Data Hasil_Ujian telah direset.');
  }
}
function getTokoList() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetToko = ss.getSheetByName(SHEET.TOKO);
  ensureSheetHeaders(sheetToko, TOKO_HEADERS);
  const dataToko = sheetToko.getDataRange().getValues();
  const headerToko = dataToko[0];
  const toko = [];

  for (let i = 1; i < dataToko.length; i++) {
    const row = dataToko[i];
    if (!row[0]) continue;

    const obj = rowToObj(headerToko, row);
    ['event_promo'].forEach(field => {
      if (obj[field] && typeof obj[field] === 'string') {
        try { obj[field] = JSON.parse(obj[field]); }
        catch (_) {
          if (obj[field].includes(';')) obj[field] = obj[field].split(';').map(s => s.trim());
        }
      }
    });

    const aktif = String(obj.aktif).toUpperCase();
    obj.aktif = !(aktif === 'FALSE' || aktif === '0' || aktif === 'TIDAK');
    toko.push(obj);
  }

  return {
    success: true,
    toko,
    total: toko.length,
    timestamp: new Date().toISOString(),
  };
}
