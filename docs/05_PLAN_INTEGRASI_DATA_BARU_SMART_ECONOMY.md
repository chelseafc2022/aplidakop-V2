# Rencana Integrasi Data Baru Smart Economy

## APLI DAKOP v2.0 — UMKM, Koperasi, dan Penerima Bantuan

Dokumen ini menjadi rencana kerja sekaligus checklist pelaksanaan untuk membersihkan, merekonsiliasi, dan memasukkan tiga sumber data baru ke APLI DAKOP v2.0 secara aman. Batch UMKM 2025 telah diterapkan sesuai hasil eksekusi pada bagian 2; sumber bantuan, koperasi, dan data UMKM 2026 masih ditahan sampai gate masing-masing selesai.

## 1. Tujuan

1. Menjaga data baseline lama tetap utuh dan dapat diaudit.
2. Memisahkan identitas pelaku, unit usaha, kondisi tahunan, dan riwayat bantuan.
3. Mencegah duplikasi atau penimpaan data akibat penggunaan NIK sebagai satu-satunya identitas usaha.
4. Memastikan baseline yang sudah ada, data UMKM 2025, dan periode berjalan dapat dipertanggungjawabkan.
5. Menjadikan data baru sebagai eviden Smart Economy yang terukur dan dapat diverifikasi.
6. Menyediakan proses import berulang yang aman, idempoten, dan memiliki jejak audit.

## 2. Sumber Data yang Dianalisis

| Sumber | Volume awal | Temuan utama | Status import |
|---|---:|---|---|
| Data UMKM Konsel | 15.125 baris kandidat pada 20 sheet aktif | Batch 2025 diterapkan; data 2026 menunggu sumber terpisah | Diterapkan Sebagian |
| Penerima Bantuan KepBup 2024 — Inflasi | 13 penerima | Hanya 2 NIK cocok dengan workbook UMKM; 1 kecocokan memiliki konflik nama | Ditahan |
| Daftar Koperasi Binaan | 564 koperasi | Kunci NIK koperasi bersih, tetapi sejumlah atribut aplikasi tidak tersedia | Ditahan |

### Keputusan ruang lingkup data UMKM

- Sheet `DATA UMKM KAB. KONAWE SELATAN` yang berlabel tahun 2024, sebanyak 5.449 baris, **tidak dimasukkan** ke staging maupun produksi.
- Sheet tersebut tetap disimpan secara read-only sebagai arsip sumber dan bukti keputusan eksklusi.
- Eksklusi ini tidak menghapus atau mengubah data baseline 2024 yang sudah ada di database APLI DAKOP.
- Ruang lingkup batch baru hanya 20 sheet UMKM berlabel tahun 2025.
- Dua periode disimpan terpisah: sumber berlabel 2025 masuk sebagai tahun 2025; data 2026 kelak masuk sebagai tahun 2026.
- Nilai Rp5.000.000 dikonfirmasi sebagai modal usaha.
- Lima kecamatan yang belum tercakup memang belum menyerahkan data dan harus ditampilkan sebagai `belum tersedia`, bukan nol.

### Catatan keputusan eksklusi

| Metadata keputusan | Nilai |
|---|---|
| Keputusan | Sheet `DATA UMKM KAB. KONAWE SELATAN` berlabel 2024 tidak diimpor |
| Alasan | Di luar ruang lingkup import tahun 2025 dan tidak digunakan sebagai sumber tahun 2026 |
| Pemberi keputusan | Pemilik proyek APLI DAKOP; nama pejabat formal belum dicantumkan |
| Tanggal keputusan | 10 Oktober 2026 |
| Perlakuan sumber | Tetap disimpan sebagai arsip read-only |

### Ringkasan risiko data UMKM dalam ruang lingkup aktif

- Terdapat 15.125 baris kandidat pada 20 sheet berlabel tahun 2025.
- 14.977 baris menghasilkan NIK 16 digit setelah normalisasi.
- 148 baris memiliki NIK tidak valid atau kosong.
- Terdapat sekitar 14.546 NIK unik valid setelah deduplikasi.
- Terdapat 409 kelompok NIK berulang dan 431 baris duplikat tambahan.
- Terdapat konflik nama, jenis usaha, atau lokasi pada sebagian NIK berulang.
- Data berlabel 2025 baru memiliki 20 dari 25 kecamatan.
- Terdapat 3.061 variasi penulisan jenis usaha.
- Seluruh nilai modal tercatat Rp5.000.000 dan telah dikonfirmasi sebagai modal usaha dari sumber pendataan.

### Hasil eksekusi batch tahun 2025

| Hasil | Jumlah |
|---|---:|
| Baris sumber pada 20 sheet aktif | 15.125 |
| Snapshot 2025 untuk pelaku yang sudah ada | 13.954 |
| Pelaku baru dan snapshot 2025 | 26 |
| Baris dari kelompok NIK kembar di tabel karantina | 840 |
| Kelompok NIK kembar | 409 |
| NIK tidak valid di staging | 148 |
| Pelaku baru menunggu pemetaan desa/jenis usaha | 157 |
| Baris sheet 2024 yang masuk staging | 0 |
| Snapshot tahun 2026 | 0 |

- Batch ID: `bu0b368d8854fefce4e240d4e`.
- Status batch: `APPLIED`.
- Total snapshot tahun 2025 yang berhasil dibuat: 13.980.
- Total master pelaku setelah import: 17.697 dengan 17.697 NIK berbeda.
- Data 2026 belum diimpor karena sumber yang tersedia belum memiliki penanda tahun 2026.

## 3. Keputusan Pengaman Sementara

Sampai seluruh gate validasi selesai:

- Jangan mengunggah ketiga file melalui importer produksi yang sekarang.
- Jangan mengubah `tahun_berdiri` menjadi tahun import.
- Jangan menimpa data baseline berdasarkan NIK saja.
- Jangan menganggap seluruh baris sebagai pelaku baru.
- Jangan memasukkan sheet `DATA UMKM KAB. KONAWE SELATAN` berlabel 2024 ke staging atau produksi.
- Jangan menonaktifkan koperasi lama hanya karena tidak terdapat pada daftar koperasi binaan.
- Jangan menautkan penerima bantuan berdasarkan kesamaan nama saja.

## 4. Model Data yang Dituju

### 4.1 Pelaku dan unit usaha

NIK mengidentifikasi orang, bukan selalu satu unit usaha. Satu pemilik dapat memiliki lebih dari satu usaha.

```text
master_pelaku
  └── unit_usaha
        └── snapshot_umkm_tahunan
              └── periode pendataan, modal, legalitas, lokasi, status
```

### 4.2 Riwayat bantuan

```text
master_pelaku
  └── riwayat_bantuan_umkm
        └── program, tahun, jenis bantuan, jumlah, satuan, sumber dokumen
```

Penerima yang belum cocok dengan master ditempatkan pada antrean verifikasi dan tidak dipaksa terhubung ke pelaku lain.

### 4.3 Koperasi

```text
master_koperasi
  └── snapshot_koperasi
        └── tanggal snapshot, status, grade, ODS, KUK, dan atribut kelembagaan
```

NIK koperasi menjadi kunci bisnis utama. Nomor badan hukum tetap disimpan sebagai atribut resmi dan kandidat kunci pencocokan sekunder.

### 4.4 Staging dan audit

Setiap import harus melalui:

```text
file sumber
  → import_batch
  → staging
  → validasi
  → antrean konflik
  → dry-run
  → persetujuan operator
  → tabel produksi
  → rekonsiliasi
```

## 5. Urutan Prioritas

| Prioritas | Fokus | Hasil yang wajib dicapai |
|---|---|---|
| P0 — Kritis | Cegah kerusakan baseline | Sumber diamankan, import langsung ditahan, backup dan rollback siap |
| P1 — Tinggi | Model data dan staging | Periode, pelaku, usaha, bantuan, koperasi, dan snapshot tidak tercampur |
| P2 — Tinggi | Pembersihan dan rekonsiliasi | NIK, wilayah, kategori, duplikasi, serta konflik memiliki keputusan |
| P3 — Menengah | Importer dan dry-run | Import dapat dipreview, diulang, dan dibatalkan tanpa data ganda |
| P4 — Menengah | Import produksi bertahap | Data masuk per batch dengan hasil rekonsiliasi yang sama dengan persetujuan |
| P5 — Lanjutan | KPI Smart Economy | Dashboard dan eviden memakai data yang sudah lolos validasi |

## 6. Fase P0 — Pengamanan Sumber dan Produksi

### Checklist

- [ ] Tetapkan pemilik data dari Dinas Koperasi dan UKM untuk setiap file.
- [ ] Simpan file asli sebagai sumber read-only.
- [ ] Catat nama file, ukuran, checksum, tanggal diterima, dan petugas penerima.
- [ ] Beri ID batch unik untuk ketiga sumber.
- [ ] Batasi akses file karena mengandung NIK dan informasi pribadi.
- [ ] Pastikan NIK tidak muncul dalam log aplikasi atau pesan error.
- [ ] Nonaktifkan sementara jalur import produksi untuk file yang belum divalidasi.
- [ ] Ambil backup database sebelum pekerjaan migrasi atau import.
- [ ] Uji prosedur pemulihan backup pada lingkungan nonproduksi.
- [ ] Pisahkan konfigurasi database staging dari produksi.
- [ ] Dokumentasikan siapa yang boleh menyetujui import produksi.

### Kriteria selesai P0

- [ ] File asli tidak berubah dan dapat diverifikasi dengan checksum.
- [ ] Backup dapat dipulihkan.
- [ ] Tidak ada data baru yang masuk langsung ke tabel produksi.
- [ ] Akses terhadap data ber-NIK dibatasi dan tercatat.

## 7. Fase P1 — Keputusan Periode dan Model Data

### 7.1 Penetapan ruang lingkup dan periode sumber UMKM

- [x] Keluarkan sheet `DATA UMKM KAB. KONAWE SELATAN` berlabel 2024 dari batch import.
- [x] Catat alasan eksklusi, pemberi keputusan, dan tanggal keputusan pada dokumen keputusan batch.
- [ ] Konfigurasikan loader agar hanya membaca 20 sheet sumber yang diizinkan dan selalu melewati sheet 2024.
- [x] Verifikasi ruang lingkup aktif: 5.449 baris dari sheet 2024 tidak termasuk dalam 15.125 baris kandidat aktif.
- [ ] Setelah staging tersedia, tambahkan pengujian otomatis bahwa jumlah baris dari sheet 2024 di staging selalu nol.
- [x] Tetapkan Rp5.000.000 sebagai modal usaha sesuai konfirmasi pemilik data.
- [x] Tetapkan lima kecamatan tanpa sheet 2025 sebagai `belum menyerahkan data`, bukan jumlah nol.
- [x] Tetapkan sumber aktif saat ini sebagai `tahun_pendataan = 2025`.
- [x] Tetapkan bahwa sumber tahun 2026 harus diimpor sebagai batch berbeda dengan `tahun_pendataan = 2026`.
- [ ] Catat `tanggal_diterima` satu kali pada metadata batch saat proses import dibuat.
- [ ] Isi `tanggal_efektif` hanya jika ada tanggal resmi dari Dinas; jangan membuat tanggal perkiraan.
- [x] Tetapkan bahwa `tahun_berdiri`, `periode_pendataan`, dan `tahun_program` adalah tiga informasi berbeda.

### 7.2 Perubahan model data

- [ ] Putuskan pemisahan `master_pelaku` dan `unit_usaha`.
- [ ] Tentukan kunci unik unit usaha yang tidak hanya memakai NIK.
- [ ] Tambahkan tabel snapshot atau riwayat pendataan tahunan.
- [ ] Tambahkan tabel riwayat bantuan UMKM.
- [ ] Tambahkan sumber program dan nomor dokumen bantuan.
- [ ] Tambahkan snapshot koperasi berdasarkan tanggal data.
- [ ] Tambahkan kolom koperasi untuk bentuk, pola pengelolaan, sektor, kelompok, grade, KUK, dan status ODS.
- [ ] Gunakan nilai `NULL` untuk informasi yang tidak tersedia; jangan membuat data default palsu.
- [ ] Tambahkan `source_batch_id`, `source_row`, `created_by`, dan waktu import.
- [ ] Tambahkan audit trail untuk insert, update, merge, reject, dan rollback.
- [ ] Siapkan migration up dan migration down.

### Kriteria selesai P1

- [ ] Satu pelaku dapat memiliki lebih dari satu unit usaha tanpa kehilangan data.
- [x] Baseline yang sudah ada dan snapshot UMKM tahun 2025 hidup berdampingan tanpa menimpa master lama.
- [ ] Bantuan tidak disimpan sebagai atribut permanen master UMKM.
- [ ] Koperasi dapat memiliki kondisi berbeda pada setiap snapshot.
- [ ] Tidak ada kolom tahun yang memakai `tahun_berdiri` sebagai pengganti periode pendataan.

## 8. Fase P2 — Staging dan Pembersihan Data

### 8.1 Staging umum

- [ ] Buat tabel `import_batch`.
- [ ] Buat staging UMKM, koperasi, dan bantuan yang terpisah.
- [ ] Simpan nilai asli dan nilai hasil normalisasi secara berdampingan.
- [ ] Simpan nomor sheet dan nomor baris asal.
- [ ] Simpan status validasi dan alasan penolakan per baris.
- [ ] Pastikan pengulangan file yang sama tidak menghasilkan batch ganda tanpa peringatan.

### 8.2 Normalisasi UMKM

- [ ] Bersihkan apostrof dan karakter nonangka pada NIK tanpa mengubah file asli.
- [ ] Tolak NIK yang setelah pembersihan tidak tepat 16 digit.
- [ ] Tandai NIK berulang dalam sheet yang sama.
- [ ] Tandai NIK berulang lintas sheet.
- [ ] Tandai NIK dengan nama pemilik berbeda.
- [ ] Tandai NIK dengan lebih dari satu jenis usaha.
- [ ] Tandai NIK dengan lokasi berbeda.
- [ ] Bedakan duplikasi data dengan satu pemilik yang memiliki beberapa usaha.
- [ ] Normalisasi nama kecamatan, termasuk `PAL-SEL` dan `PALNGGA SELATAN`.
- [ ] Hilangkan awalan administratif seperti `Desa`, `Kel.`, dan `Kelurahan` hanya pada nilai normalisasi.
- [ ] Cocokkan kecamatan dan desa dengan master wilayah `egov`.
- [ ] Masukkan wilayah yang tidak cocok ke antrean verifikasi.
- [ ] Susun kamus kategori dari 3.061 variasi jenis usaha.
- [ ] Pertahankan teks jenis usaha asli untuk kebutuhan audit.
- [ ] Tandai baris tanpa jenis usaha.
- [ ] Jangan gunakan nomor urut spreadsheet sebagai ID produksi.

### 8.2.1 Menu karantina NIK kembar

- [x] Tambahkan menu `NIK Kembar UMKM` pada kelompok Manajemen & RBAC.
- [x] Tampilkan 409 kelompok yang mencakup 840 baris karantina per NIK dan batch sumber.
- [x] Tampilkan sheet, nomor baris, nama pemilik, jenis usaha, wilayah, modal, dan status pemeriksaan.
- [x] Sediakan pencarian, filter status, filter batch, dan paginasi.
- [x] Sembunyikan menu dari akun non-administrator.
- [x] Terapkan pemeriksaan role administrator pada API Next.js dan endpoint backend; akses non-administrator harus menghasilkan HTTP 403.
- [x] Pastikan halaman hanya membaca tabel `import_umkm_nik_kembar` dan tidak mengubah master/statistik UMKM.
- [ ] Tambahkan aksi penyelesaian konflik setelah aturan keputusan identitas disetujui pemilik data.
- [ ] Catat operator, waktu, alasan, dan hasil setiap keputusan konflik dalam audit trail.

### 8.3 Normalisasi bantuan

- [ ] Validasi seluruh 13 NIK terhadap database baseline, bukan hanya workbook baru.
- [ ] Verifikasi record yang NIK-nya cocok tetapi namanya berbeda.
- [ ] Tempatkan penerima tanpa kecocokan ke antrean verifikasi.
- [ ] Jangan melakukan fuzzy match otomatis sebagai keputusan akhir.
- [ ] Pecah teks bantuan menjadi jumlah, satuan, dan jenis barang.
- [ ] Tetapkan tahun program 2024 tanpa mengubah tahun pendataan UMKM.
- [ ] Simpan sumber `KepBup 2024 — Inflasi` dan referensi dokumennya.
- [ ] Tentukan apakah bantuan ditautkan ke pelaku atau unit usaha tertentu.

### 8.4 Normalisasi koperasi

- [ ] Hilangkan karakter apostrof tampilan dari NIK koperasi.
- [ ] Validasi seluruh NIK koperasi berjumlah 13 digit.
- [ ] Cocokkan 564 NIK koperasi dengan master saat ini.
- [ ] Kelompokkan menjadi data baru, cocok, berubah, dan konflik.
- [ ] Normalisasi kecamatan ke 25 kecamatan master wilayah.
- [ ] Tentukan pemakaian kolom `Kelurahan` dan `Desa` ketika keduanya berisi nilai.
- [ ] Verifikasi 28 record tanpa desa.
- [ ] Verifikasi 7 record tanpa alamat.
- [ ] Perlakukan kode pos kosong atau `0` sebagai belum tersedia.
- [ ] Pertahankan email kosong sebagai `NULL`.
- [ ] Jangan membuat tanggal badan hukum default jika sumber hanya memiliki nomor badan hukum.
- [ ] Jangan membuat nama ketua, anggota, modal, aset, volume usaha, atau SHU secara otomatis.
- [ ] Jangan menonaktifkan koperasi lama yang tidak ditemukan pada daftar binaan.

### Kriteria selesai P2

- [ ] Jumlah raw, valid, duplikat, konflik, dan reject dapat direkonsiliasi.
- [ ] Setiap perubahan normalisasi dapat ditelusuri ke nilai asli.
- [ ] Seluruh wilayah memiliki ID master atau status unresolved.
- [ ] Seluruh konflik memiliki keputusan operator atau tetap berstatus tertahan.

## 9. Fase P3 — Importer Aman dan Dry-Run

### 9.1 Perbaikan importer

- [ ] Gunakan parser XLSX nyata untuk file `.xlsx`.
- [ ] Gunakan parser CSV yang mendukung quoted field, encoding UTF-8, dan delimiter terdeteksi.
- [ ] Validasi ekstensi, MIME type, signature file, dan ukuran maksimum.
- [ ] Tolak workbook terenkripsi atau rusak.
- [ ] Batasi jumlah sheet, baris, dan ukuran hasil ekstraksi untuk mencegah zip bomb.
- [ ] Lindungi export CSV dari formula injection.
- [ ] Sediakan pemetaan kolom berdasarkan header, bukan posisi tetap saja.
- [ ] Sediakan preview sebelum import.
- [ ] Tampilkan jumlah insert, update, unchanged, conflict, dan reject.
- [ ] Sediakan laporan error yang dapat diunduh tanpa membocorkan NIK penuh.
- [ ] Jalankan import dalam transaksi database.
- [ ] Gunakan upsert yang idempoten berdasarkan kunci yang sudah disetujui.
- [ ] Jangan mengubah kolom lama ketika nilai sumber baru kosong.
- [ ] Simpan batch ID pada seluruh record hasil import.
- [ ] Sediakan rollback per batch.
- [ ] Batasi import dan approval dengan RBAC server-side.

### 9.2 Dry-run dan eksekusi UMKM 2025

- [x] Pastikan hanya 20 sheet berlabel 2025 yang diproses.
- [x] Pastikan seluruh snapshot hasil import memakai tahun pendataan 2025.
- [x] Pastikan raw count aktif kembali menjadi 15.125 baris kandidat.
- [x] Pastikan 14.977 baris menghasilkan NIK 16 digit setelah normalisasi.
- [x] Pastikan 148 NIK bermasalah masuk staging pengecualian.
- [x] Pastikan seluruh 840 baris dari 409 kelompok NIK kembar masuk tabel karantina dan tidak masuk master/statistik.
- [x] Pastikan 5.449 baris dari sheet 2024 yang dikecualikan tidak masuk staging.
- [x] Pastikan `tahun_berdiri` master lama tidak diubah karena import.
- [x] Pastikan batch memiliki ID dan jalur rollback.
- [x] Rekonsiliasi tampilan dashboard dan filter periode dengan tabel statistik tahunan: semua periode 17.697 pelaku unik, baseline 2021–2024 sebanyak 17.671, snapshot 2025 sebanyak 13.980, dan snapshot 2026 sebanyak 0.
- [x] Bedakan KPI `pelaku unik` (17.697) dari `catatan pendataan` lintas periode (31.651), serta tampilkan 13.954 pelaku baseline yang didata ulang dan 26 pelaku baru pada 2025.

### 9.3 Dry-run bantuan

- [ ] Pastikan seluruh 13 baris terbaca.
- [ ] Pastikan tidak ada NIK ganda pada batch.
- [ ] Pastikan pencocokan dijalankan terhadap database baseline.
- [ ] Pastikan konflik nama masuk antrean verifikasi.
- [ ] Pastikan bantuan tersimpan sebagai riwayat dan tidak menimpa master.

### 9.4 Dry-run koperasi

- [ ] Pastikan seluruh 564 baris terbaca.
- [ ] Pastikan tidak ada NIK koperasi, nomor badan hukum, atau nama yang terduplikasi dalam batch.
- [ ] Pastikan 25 kecamatan terpetakan.
- [ ] Pastikan atribut yang tidak tersedia tetap `NULL`.
- [ ] Pastikan koperasi lama tidak otomatis dinonaktifkan.

### Kriteria selesai P3

- [ ] Dry-run dapat diulang dengan hasil identik.
- [ ] Seluruh angka dry-run dapat direkonsiliasi dengan sumber.
- [ ] Tidak ada perubahan pada database produksi.
- [ ] Laporan konflik sudah ditandatangani atau disetujui pemilik data.

## 10. Fase P4 — Import Produksi Bertahap

Urutan import yang direkomendasikan:

1. Master dan snapshot koperasi setelah rekonsiliasi NIK koperasi.
2. Identitas pelaku dan unit usaha UMKM yang sudah valid.
3. Snapshot UMKM setelah keputusan periode selesai.
4. Riwayat bantuan setelah penerima cocok dengan master atau disetujui sebagai pelaku baru.

### Checklist sebelum eksekusi

- [ ] Backup produksi baru selesai dibuat dan diverifikasi.
- [ ] Migration database telah diuji di staging.
- [ ] Dry-run terakhir memakai file dan checksum yang sama.
- [ ] Jumlah insert, update, unchanged, conflict, dan reject telah disetujui.
- [ ] Seluruh query import menggunakan parameterized query.
- [ ] Import dijalankan oleh akun khusus dengan hak minimum.
- [ ] Monitoring error dan penggunaan database aktif.
- [ ] Waktu pemeliharaan telah disepakati.

### Checklist saat dan setelah import

- [ ] Jalankan satu jenis data per batch.
- [ ] Catat waktu mulai, selesai, operator, dan batch ID.
- [ ] Hentikan batch jika jumlah hasil berbeda dari dry-run.
- [ ] Rekonsiliasi total tabel produksi dengan hasil persetujuan.
- [ ] Uji sampel lintas kecamatan tanpa menampilkan NIK penuh.
- [ ] Uji filter periode dan pencarian.
- [ ] Uji histori pelaku yang muncul pada lebih dari satu periode.
- [ ] Uji riwayat bantuan penerima.
- [ ] Uji data Koperasi Merah Putih dan atribut ODS/grade.
- [ ] Jalankan rollback jika gate rekonsiliasi gagal.

### Kriteria selesai P4

- [ ] Tidak ada duplikasi akibat pengulangan batch.
- [ ] Tidak ada data baseline yang hilang atau tertimpa tanpa histori.
- [ ] Angka produksi sama dengan hasil import yang disetujui.
- [ ] Seluruh baris reject tetap tersedia untuk perbaikan berikutnya.

## 11. Fase P5 — Dashboard dan Eviden Smart Economy

- [ ] Pisahkan angka baseline yang sudah ada, snapshot UMKM 2025, dan snapshot UMKM 2026.
- [ ] Tampilkan cakupan kecamatan setiap periode.
- [ ] Tampilkan jumlah pelaku, unit usaha, dan snapshot secara terpisah.
- [ ] Tampilkan indikator legalitas hanya jika datanya tersedia.
- [ ] Tampilkan penerima bantuan per program, jenis bantuan, wilayah, dan tahun.
- [ ] Tampilkan penerima bantuan yang sudah dan belum cocok dengan master.
- [ ] Tampilkan koperasi menurut jenis, kecamatan, grade, dan status ODS.
- [ ] Bedakan koperasi aktif dari status keikutsertaan dalam daftar binaan.
- [ ] Gunakan Rp5.000.000 sebagai modal usaha sesuai sumber dan tampilkan sumber/periode datanya.
- [ ] Sertakan tanggal snapshot dan sumber data pada laporan.
- [ ] Perbarui narasi inovasi hanya setelah angka produksi selesai direkonsiliasi.
- [ ] Simpan eviden before/after proses integrasi untuk kebutuhan penilaian Smart Economy.

## 12. Daftar Keputusan yang Memerlukan Konfirmasi Dinas

- [x] Sheet `DATA UMKM KAB. KONAWE SELATAN` berlabel 2024 tidak dimasukkan ke batch import.
- [x] Sumber saat ini ditetapkan sebagai batch tahun 2025.
- [x] Data tahun 2026 wajib memakai batch dan sumber terpisah.
- [x] Nilai Rp5.000.000 ditetapkan sebagai modal usaha.
- [x] Lima kecamatan yang belum memiliki sheet dinyatakan belum menyerahkan data.
- [ ] Aturan satu pemilik dengan beberapa usaha.
- [ ] Kriteria data koperasi binaan dibanding seluruh koperasi daerah.
- [ ] Tanggal efektif daftar koperasi.
- [ ] Penanggung jawab verifikasi konflik NIK dan nama.
- [ ] Nomor dan salinan dokumen program bantuan KepBup 2024.
- [ ] Kebijakan penyimpanan dan masa retensi data pribadi.

## 13. Gate Rilis Akhir

Import dinyatakan layak selesai hanya jika seluruh kondisi berikut terpenuhi:

- [ ] Sumber asli, checksum, batch, dan operator tercatat.
- [ ] Periode data telah disahkan pemilik data.
- [ ] Model pelaku dan unit usaha tidak menghilangkan usaha ganda.
- [ ] Seluruh NIK invalid atau konflik tertahan dari auto-import.
- [ ] Wilayah terpetakan ke master resmi.
- [ ] Bantuan memiliki sumber program dan histori terpisah.
- [ ] Koperasi tidak diberi atribut palsu untuk mengisi kolom kosong.
- [ ] Dry-run, produksi, dan laporan rekonsiliasi menunjukkan angka yang sama.
- [ ] Rollback batch telah diuji.
- [ ] Dashboard tidak mencampur jumlah orang, usaha, snapshot, dan penerima bantuan.
- [ ] KPI Smart Economy hanya menggunakan data yang dapat ditelusuri ke sumber.

## 14. Urutan Implementasi Ringkas

1. Amankan file dan backup database.
2. Klarifikasi periode dan arti nilai modal.
3. Sahkan model pelaku, unit usaha, snapshot, bantuan, dan koperasi.
4. Buat migration dan tabel staging.
5. Bangun normalisasi NIK, wilayah, kategori usaha, dan atribut koperasi.
6. Rekonsiliasi terhadap database baseline.
7. Selesaikan antrean konflik dengan pemilik data.
8. Perbaiki importer XLSX/CSV dan tambahkan preview.
9. Jalankan dry-run hingga hasil stabil.
10. Import koperasi per batch.
11. Import pelaku, unit usaha, dan snapshot UMKM.
12. Import riwayat bantuan.
13. Rekonsiliasi produksi dan uji rollback.
14. Aktifkan filter periode, analitik, dan eviden Smart Economy.
