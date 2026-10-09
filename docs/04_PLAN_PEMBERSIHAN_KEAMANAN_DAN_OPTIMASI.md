# Rencana Pembersihan, Pengamanan, dan Optimasi APLI DAKOP v2

## 1. Tujuan

Dokumen ini menjadi rencana kerja bertahap untuk membersihkan dan menyiapkan APLI DAKOP v2 agar aman, stabil, mudah dirawat, dan layak digunakan di lingkungan produksi.

Ruang lingkupnya meliputi:

- Frontend dan BFF Next.js di `aplidakop_v2/frontend`.
- Modul backend APLI DAKOP di `BackendStatistik`.
- Autentikasi, otorisasi/RBAC, akses database, unggah dokumen, laporan, dan import data.
- Dependensi, kualitas kode, pengujian, performa, dokumentasi, dan kesiapan deployment.

Dokumen ini hanya berisi rencana dan checklist. Implementasi dilakukan setelah rencana disetujui.

## 2. Prinsip Pelaksanaan

- Kerjakan berdasarkan tingkat risiko: P0, P1, P2, lalu P3.
- Jangan melakukan refactor besar bersamaan dengan perbaikan keamanan kritis.
- Setiap fase harus memiliki backup, pengujian, dan kriteria selesai.
- Endpoint backend tidak boleh hanya mengandalkan perlindungan dari tampilan frontend.
- Data simulasi tidak boleh bercampur dengan data produksi.
- Perubahan database harus memakai migration dan memiliki rencana rollback.
- Rahasia aplikasi tidak boleh disimpan di source code atau dicetak ke log.

## 3. Urutan Prioritas

| Prioritas | Fokus | Target |
|---|---|---|
| P0 — Kritis | Menutup akses tanpa izin dan celah eksploitasi langsung | Dikerjakan sebelum aplikasi dibuka ke internet |
| P1 — Tinggi | Menjaga integritas data, dependensi, import, dan transaksi | Dikerjakan setelah P0 stabil |
| P2 — Menengah | Optimasi performa dan pembersihan struktur kode | Dikerjakan setelah keamanan dan data benar |
| P3 — Lanjutan | Observability, CI/CD, dokumentasi, dan hardening operasional | Dikerjakan sebelum serah terima produksi final |

---

## 4. Fase 0 — Persiapan dan Pengamanan Sementara

Tujuan fase ini adalah mencegah perubahan atau kehilangan data selama proses perbaikan.

### Checklist

- [ ] Tetapkan satu branch khusus perbaikan, misalnya `security-hardening-v2`.
- [ ] Backup database `db_dinkop`, `egov`, dan bagian `simpeg` yang digunakan APLI DAKOP.
- [ ] Verifikasi backup dapat dipulihkan pada database staging.
- [ ] Inventarisasi semua environment: lokal, staging, dan produksi.
- [ ] Inventarisasi domain, reverse proxy, port, server, dan proses Node.js yang aktif.
- [ ] Batasi sementara akses publik ke endpoint tulis, import, role, dan user management.
- [ ] Izinkan endpoint administrasi hanya dari jaringan/VPN/IP internal sampai P0 selesai.
- [ ] Catat baseline jumlah UMKM, koperasi, pengguna, role, dan dokumen sebelum perubahan.
- [ ] Tentukan akun pemilik sistem dan minimal dua administrator resmi.
- [ ] Siapkan data uji anonim; jangan memakai NIK/KK riil untuk automated test.

### Kriteria selesai

- Backup tervalidasi.
- Akses administrasi produksi sudah dibatasi.
- Tersedia staging yang tidak memakai data pribadi produksi secara utuh.

---

## 5. Fase P0 — Perbaikan Keamanan Kritis

Fase ini wajib selesai sebelum aplikasi dinyatakan aman untuk diakses publik.

### 5.1 Hapus bypass autentikasi dan akun demo

- [ ] Hapus login fallback `admin / password123` dari route login Next.js.
- [ ] Hapus tombol pengisian akun demo dari halaman login produksi.
- [ ] Hapus token demo dan token sesi statis.
- [ ] Hapus password default pada pembuatan pengguna.
- [ ] Ubah `/api/auth/me` agar memverifikasi token dan mengambil profil pengguna sebenarnya.
- [ ] Buat endpoint refresh token yang nyata atau hapus seluruh alur refresh token palsu.
- [ ] Pastikan logout mencabut refresh token/session di server.
- [ ] Rotasi `TOKEN_SECRET` dan seluruh kredensial yang pernah tertulis di kode atau log.
- [ ] Tambahkan validasi startup agar aplikasi gagal berjalan jika secret wajib tidak tersedia.

### 5.2 Tutup system-token fallback

- [ ] Hapus pembuatan otomatis JWT administrator dari `backend-client.ts`.
- [ ] Teruskan Authorization pengguna dari Next.js BFF ke Express.
- [ ] Tolak request tanpa token untuk endpoint privat.
- [ ] Pisahkan service credential internal dari token pengguna jika service-to-service token memang diperlukan.
- [ ] Batasi service token berdasarkan audience, scope, endpoint, dan masa berlaku singkat.
- [ ] Jangan memasukkan identitas administrator hardcode ke token internal.

### 5.3 Terapkan autentikasi pada seluruh lapisan

- [ ] Lindungi route dashboard Next.js pada sisi server/proxy.
- [ ] Buat helper autentikasi bersama untuk semua route handler Next.js.
- [ ] Verifikasi signature, expiry, issuer, dan audience JWT.
- [ ] Pastikan request yang tokennya invalid berhenti dengan HTTP 401 dan tidak melanjutkan middleware.
- [ ] Hindari menjalankan banyak middleware verifikasi JWT untuk satu request.
- [ ] Lindungi `/laporan_aplidakop` sesuai klasifikasi laporan publik/privat.
- [ ] Lindungi atau batasi `/apiStatistikAplidakop` agar tidak membocorkan NIK dan data pribadi.
- [ ] Lindungi akses langsung ke Express dari internet; arahkan akses aplikasi melalui gateway/reverse proxy resmi.

### 5.4 Terapkan RBAC pada server

- [ ] Definisikan role resmi: Super Admin, Admin Dinas, Operator, Verifikator, Pimpinan/Viewer, dan role lain yang disetujui.
- [ ] Buat matriks izin per resource dan aksi: read, create, update, delete, import, export, manage-user, manage-role.
- [ ] Buat middleware `requirePermission(resource, action)` pada backend.
- [ ] Terapkan permission pada setiap endpoint, bukan hanya menyembunyikan menu.
- [ ] Pastikan pengguna tidak dapat mengubah role dirinya sendiri menjadi administrator.
- [ ] Cegah penghapusan atau penurunan akses administrator terakhir.
- [ ] Batasi reset password dan manajemen pengguna hanya untuk role yang berwenang.
- [ ] Buat pengujian negatif untuk setiap role.

### 5.5 Tutup SQL injection

- [ ] Inventarisasi seluruh query yang menggabungkan `req.body`, `req.query`, atau `req.params` ke string SQL.
- [ ] Ganti value dinamis dengan parameter/placeholder.
- [ ] Ganti nama tabel/kolom dinamis dengan allowlist eksplisit.
- [ ] Validasi dan normalisasi semua ID, tahun, page, limit, filter, serta sort.
- [ ] Batasi `limit` maksimal, misalnya 100 untuk endpoint daftar biasa.
- [ ] Terapkan schema validation pada setiap request.
- [ ] Jangan mengirim objek error database mentah kepada client.
- [ ] Tambahkan automated test untuk payload SQL injection pada endpoint penting.

### 5.6 Lindungi password, token, dan log

- [ ] Hapus log yang mencetak `TOKEN_SECRET`.
- [ ] Hapus log request body yang dapat memuat password, NIK, KK, atau token.
- [ ] Terapkan redaction pada logger terstruktur.
- [ ] Tingkatkan kebijakan password dan sediakan mekanisme perubahan password pertama.
- [ ] Tambahkan rate limit untuk login, reset password, import, dan endpoint mahal.
- [ ] Tambahkan lockout/backoff untuk percobaan login gagal berulang.
- [ ] Simpan refresh token secara hashed dan dapat dicabut.
- [ ] Pindahkan sesi browser ke cookie `HttpOnly`, `Secure`, dan `SameSite` yang sesuai.
- [ ] Dokumentasikan masa berlaku access token dan refresh token.

### 5.7 Amankan file dan dokumen

- [ ] Hentikan penyajian seluruh folder `uploads` sebagai static public.
- [ ] Buat endpoint download yang memeriksa autentikasi dan izin.
- [ ] Validasi nama file dengan `basename` dan generated filename.
- [ ] Cegah path traversal saat membaca atau menghapus file.
- [ ] Batasi ukuran file, jumlah file, MIME type, dan ekstensi.
- [ ] Periksa file berdasarkan signature/magic bytes, bukan hanya MIME dari client.
- [ ] Simpan file di luar web root.
- [ ] Hapus dokumen upload dari Git dan tentukan penyimpanan dokumen yang benar.
- [ ] Evaluasi riwayat Git dan rotasi data/secret jika pernah terpublikasi.

### 5.8 Upgrade keamanan minimum

- [ ] Upgrade Next.js dari 16.1.1 ke versi stabil yang sudah menutup advisory terkait.
- [ ] Upgrade Multer dari 1.4.4 ke versi 2.x aman terbaru.
- [ ] Upgrade Express ke rilis aman dengan pengujian kompatibilitas.
- [ ] Jalankan `npm audit` pada frontend dan backend setelah akses registry tersedia.
- [ ] Perbaiki seluruh vulnerability critical dan high sebelum deployment.
- [ ] Dokumentasikan vulnerability moderate/low yang belum diperbaiki beserta alasannya.

### Kriteria selesai P0

- Request tanpa autentikasi tidak dapat membaca PII atau melakukan operasi tulis.
- Setiap operasi admin memerlukan role dan permission yang tepat.
- Tidak ada kredensial demo, password default, atau system admin fallback.
- Tidak ada input request yang langsung disisipkan ke SQL.
- Tidak ada secret/password/token/PII sensitif pada log.
- Dependensi critical/high sudah diperbaiki atau dihapus.

---

## 6. Fase P1 — Integritas Data dan Stabilitas Backend

### 6.1 Hilangkan data simulasi dari alur produksi

- [ ] Hapus fallback data UMKM, koperasi, pengguna, role, dan dashboard dari route produksi.
- [ ] Jika backend gagal, tampilkan status error yang jelas, bukan data simulasi.
- [ ] Pisahkan mock data ke mode development/test.
- [ ] Hapus perhitungan rasio koperasi aktif dan distribusi kecamatan yang hardcode.
- [ ] Pastikan filter tahun dan kecamatan benar-benar diterapkan ke query.
- [ ] Tandai timestamp terakhir pembaruan data pada dashboard.

### 6.2 Perbaiki proteksi baseline

- [ ] Definisikan aturan resmi data baseline 2021–2024.
- [ ] Terapkan proteksi baseline di backend/database, bukan hanya UI.
- [ ] Tentukan siapa yang dapat membuka kunci atau mengoreksi data baseline.
- [ ] Catat alasan, nilai lama, nilai baru, pengguna, dan waktu perubahan.
- [ ] Terapkan soft delete bila rekam jejak harus dipertahankan.
- [ ] Tambahkan workflow persetujuan untuk perubahan sensitif bila dibutuhkan.

### 6.3 Perbaiki import data

- [ ] Tentukan format resmi: CSV saja atau CSV dan XLSX.
- [ ] Gunakan parser CSV/XLSX yang sesuai dan tervalidasi.
- [ ] Buat tahap preview sebelum commit.
- [ ] Cocokkan nama kecamatan, desa, dan jenis usaha menjadi ID master secara eksplisit.
- [ ] Tolak lokasi/jenis usaha yang tidak ditemukan; jangan memakai ID default diam-diam.
- [ ] Validasi format dan panjang NIK/KK/NIB tanpa mengubah angka menjadi floating point.
- [ ] Pastikan omset, tenaga kerja, modal, dan tahun masuk ke kolom yang benar.
- [ ] Gunakan transaksi database.
- [ ] Ubah proses menjadi batch upsert, bukan SELECT dan UPDATE/INSERT per baris.
- [ ] Buat idempotency key atau nomor batch import.
- [ ] Simpan laporan hasil import dan baris yang gagal.
- [ ] Batasi jumlah baris dan ukuran file per batch.

### 6.4 Perbaiki transaksi CRUD

- [ ] Gunakan transaksi untuk penghapusan parent dan data turunannya.
- [ ] Tentukan foreign key dan aturan cascade secara eksplisit.
- [ ] Jangan menghapus file sebelum transaksi database berhasil.
- [ ] Pastikan kegagalan sebagian dapat di-rollback.
- [ ] Gunakan status HTTP dan bentuk response yang konsisten.
- [ ] Tambahkan idempotency untuk operasi yang rawan terkirim ulang.

### 6.5 Rapikan koneksi database

- [ ] Ganti atau perbaiki pemeriksaan koneksi agar connection selalu dilepas kembali.
- [ ] Konsolidasikan konfigurasi pool untuk `db_dinkop`, `egov`, dan `simpeg`.
- [ ] Tentukan timeout koneksi, query timeout, dan batas pool.
- [ ] Gunakan akun database dengan least privilege.
- [ ] Pisahkan akun read-only untuk laporan/dashboard bila memungkinkan.
- [ ] Aktifkan TLS koneksi database jika melewati jaringan.
- [ ] Tambahkan health check yang tidak membocorkan detail koneksi.

### 6.6 Audit dan migrasi dependensi backend

- [ ] Hapus paket yang tidak digunakan.
- [ ] Pindahkan `nodemon`, `mocha`, dan tooling ke `devDependencies`.
- [ ] Ganti `html-pdf`/PhantomJS dengan Playwright atau Puppeteer.
- [ ] Ganti `requestify` dengan built-in `fetch`.
- [ ] Migrasikan `mysql` ke `mysql2` dengan prepared statements/Promise API.
- [ ] Upgrade Joi dan sesuaikan API validasinya.
- [ ] Tambahkan field `engines` untuk versi Node.js yang didukung.
- [ ] Pastikan `npm ci` berhasil dari checkout bersih.

### Kriteria selesai P1

- Dashboard hanya menampilkan data database yang dapat ditelusuri sumbernya.
- Import tidak memasukkan lokasi atau jenis usaha default secara diam-diam.
- Operasi multi-query bersifat transaksional.
- Baseline dilindungi pada backend.
- Backend dapat dipasang ulang dengan `npm ci` tanpa paket tidak perlu.

---

## 7. Fase P2 — Optimasi Performa dan Clean Code

### 7.1 Optimasi query dan indeks

- [ ] Ambil `EXPLAIN` untuk query daftar, dashboard, statistik, dan laporan utama.
- [ ] Tambahkan indeks berdasarkan hasil `EXPLAIN`, bukan asumsi semata.
- [ ] Evaluasi indeks untuk NIK, kecamatan, desa, jenis usaha, tahun, status, dan `createAt`.
- [ ] Gunakan `COUNT(*)` untuk total data, bukan mengambil seluruh baris.
- [ ] Hindari `SELECT *` pada endpoint produksi.
- [ ] Evaluasi Full-Text Search untuk pencarian nama usaha/pemilik.
- [ ] Gunakan pencarian exact/prefix untuk NIK dan nomor legalitas.
- [ ] Tambahkan pagination yang konsisten dan batas maksimal.
- [ ] Pertimbangkan cursor pagination untuk data yang sangat besar.

### 7.2 Optimasi BFF dan dashboard

- [ ] Jalankan request dashboard independen secara paralel.
- [ ] Gabungkan query agregasi dashboard jika lebih efisien dilakukan oleh backend.
- [ ] Terapkan timeout dan `AbortSignal` pada request backend.
- [ ] Tentukan cache policy berbeda untuk master data, dashboard, dan data transaksi.
- [ ] Jangan cache response yang mengandung PII lintas pengguna.
- [ ] Tambahkan skeleton/error/empty state yang benar.
- [ ] Perbaiki warning chart dengan ukuran container minimum.

### 7.3 Pecah komponen frontend besar

- [ ] Pecah halaman UMKM menjadi hooks, schema, form, table, filter, import, export, dan dialog.
- [ ] Pecah halaman koperasi dengan pola yang sama.
- [ ] Pindahkan tipe domain dari `any` ke interface/schema bersama.
- [ ] Gunakan React Hook Form dan schema validation secara konsisten.
- [ ] Kurangi state lokal yang saling bergantung.
- [ ] Memoize transformasi data mahal yang benar-benar diperlukan.
- [ ] Gunakan dynamic import untuk editor, chart, customizer, atau modal besar.
- [ ] Muat React Query Devtools hanya pada development.

### 7.4 Bersihkan template dan aset

- [ ] Hapus route `/landing` template jika tidak digunakan.
- [ ] Hapus branding ShadcnStore dan tombol Upgrade to Pro.
- [ ] Hapus komponen, gambar, JSON demo, dan package yang tidak digunakan.
- [ ] Perbaiki metadata, footer, dan dokumentasi agar menyebut Express/MySQL yang benar.
- [ ] Hapus debug log dan komentar kode mati.
- [ ] Hapus file `.DS_Store`, backup file, dan package manifest sisa.
- [ ] Sinkronkan root `package.json` dengan `package-lock.json`.

### 7.5 Perbaiki export dan laporan

- [ ] Buat export berdasarkan seluruh hasil filter, bukan hanya halaman aktif.
- [ ] Lakukan export besar pada backend secara streaming atau background job.
- [ ] Cegah CSV formula injection.
- [ ] Hapus kode laporan hasil copy-paste BPBD yang tidak relevan.
- [ ] Hilangkan variabel global/implicit pada modul laporan.
- [ ] Ganti generator PDF deprecated.
- [ ] Tambahkan kontrol akses dan audit log untuk download laporan.

### Kriteria selesai P2

- Tidak ada page utama berukuran sangat besar tanpa pemisahan tanggung jawab.
- Query utama memiliki hasil `EXPLAIN` yang terdokumentasi.
- Tidak ada template/demo yang ikut ke bundle produksi.
- Export dan laporan aman serta sesuai filter pengguna.
- Ukuran bundle dan waktu respons memiliki baseline sebelum/sesudah.

---

## 8. Fase P3 — Testing, CI/CD, dan Operasional

### 8.1 Pulihkan lint dan quality gate

- [ ] Ganti script `next lint` dengan ESLint CLI yang kompatibel.
- [ ] Perbaiki konfigurasi ESLint flat config.
- [ ] Aktifkan aturan TypeScript, React Hooks, import, dan no-floating-promises yang relevan.
- [ ] Tambahkan formatter dan pemeriksaan format di CI.
- [ ] Kurangi penggunaan `any` secara bertahap.
- [ ] Terapkan batas kompleksitas/file size sebagai peringatan.

### 8.2 Tambahkan automated test

- [ ] Unit test untuk auth helper dan permission middleware.
- [ ] Unit test untuk request validation dan mapping data.
- [ ] Integration test login, refresh, logout, dan token expired.
- [ ] Integration test CRUD UMKM/koperasi dengan database test.
- [ ] Integration test transaksi delete dan batch import.
- [ ] Test bahwa baseline tidak dapat diubah tanpa izin.
- [ ] Test bahwa role rendah tidak dapat memanggil endpoint admin.
- [ ] Test SQL injection, path traversal, oversized upload, dan invalid JWT.
- [ ] E2E test untuk alur login, dashboard, filter, CRUD, import, dan export.
- [ ] Tambahkan regression test untuk setiap bug yang ditemukan.

### 8.3 CI/CD dan supply-chain security

- [ ] Jalankan `npm ci`, lint, type-check, test, dan build pada setiap pull request.
- [ ] Jalankan dependency audit/SCA otomatis.
- [ ] Aktifkan secret scanning dan larang commit `.env`/dokumen upload.
- [ ] Buat lockfile update terjadwal.
- [ ] Gunakan deployment artifact yang reproducible.
- [ ] Tambahkan Software Bill of Materials bila diperlukan instansi.
- [ ] Pisahkan konfigurasi development, staging, dan production.
- [ ] Terapkan approval sebelum migration database produksi.

### 8.4 Observability dan audit

- [ ] Gunakan structured logging dengan request ID.
- [ ] Redact password, token, NIK, KK, dan data pribadi dari log.
- [ ] Catat audit event untuk login, perubahan data, import, export, role, dan pengguna.
- [ ] Tambahkan metrik latency, error rate, pool database, dan query lambat.
- [ ] Tambahkan alert untuk login gagal berulang, lonjakan 401/403/500, dan import gagal.
- [ ] Tambahkan health/readiness endpoint.
- [ ] Tentukan retensi log dan siapa yang dapat mengaksesnya.

### 8.5 Hardening deployment

- [ ] Tambahkan Helmet/security headers pada Express.
- [ ] Lengkapi CSP, HSTS, Permissions-Policy, dan Referrer-Policy di reverse proxy/Next.js.
- [ ] Batasi CORS ke origin resmi.
- [ ] Jalankan proses Node.js sebagai user non-root.
- [ ] Gunakan HTTPS penuh dari browser sampai gateway.
- [ ] Batasi port database dan Express dengan firewall.
- [ ] Tambahkan graceful shutdown dan drain koneksi.
- [ ] Dokumentasikan backup, restore, incident response, dan rotasi secret.

### Kriteria selesai P3

- Pull request tidak dapat digabung jika lint, test, type-check, audit kritis, atau build gagal.
- Aktivitas sensitif dapat ditelusuri tanpa mencatat data rahasia.
- Deployment staging dan produksi dapat diulang secara konsisten.
- Tersedia prosedur backup, restore, rollback, dan penanganan insiden.

---

## 9. Checklist Rilis Produksi

### Security gate

- [ ] Tidak ada endpoint privat yang dapat diakses tanpa token valid.
- [ ] RBAC telah diuji untuk seluruh role.
- [ ] Tidak ada vulnerability critical/high yang belum ditangani.
- [ ] Tidak ada akun demo, password default, atau secret hardcode.
- [ ] SQL injection dan path traversal test dinyatakan lulus.
- [ ] File PII tidak tersedia melalui URL publik langsung.
- [ ] Rate limit dan security headers aktif.

### Data gate

- [ ] Backup terakhir tervalidasi.
- [ ] Rekonsiliasi jumlah data sebelum dan setelah migrasi berhasil.
- [ ] Import diuji dengan valid, invalid, duplikat, dan file besar.
- [ ] Baseline dan audit trail telah diverifikasi.
- [ ] Dashboard tidak memakai angka simulasi/hardcode.

### Quality gate

- [ ] `npm ci` berhasil pada frontend dan backend.
- [ ] Lint berhasil tanpa error.
- [ ] Type-check berhasil.
- [ ] Unit dan integration test berhasil.
- [ ] E2E alur kritis berhasil.
- [ ] Production build berhasil tanpa warning kritis.

### Operational gate

- [ ] Monitoring dan alert aktif.
- [ ] Health check aktif.
- [ ] Runbook deployment dan rollback tersedia.
- [ ] Pemilik operasional dan kontak insiden ditetapkan.
- [ ] Jadwal patch dependensi ditetapkan.

## 10. Urutan Implementasi Ringkas

Urutan pengerjaan yang disarankan:

1. Backup, staging, dan pembatasan akses sementara.
2. Hapus demo login dan system-token fallback.
3. Implementasikan autentikasi BFF dan backend.
4. Terapkan RBAC server-side.
5. Parameterisasi SQL dan validasi request.
6. Tutup akses PII serta amankan upload/download.
7. Rotasi secret dan bersihkan logging.
8. Upgrade Next.js, Multer, Express, dan dependensi rentan.
9. Hapus fallback data serta perbaiki dashboard dan baseline.
10. Perbaiki transaksi CRUD dan batch import.
11. Optimasi query, indeks, koneksi, dan caching.
12. Pecah file besar dan hapus template/dependensi tidak digunakan.
13. Perbaiki lint dan tambahkan test otomatis.
14. Aktifkan CI/CD, observability, dan production hardening.
15. Jalankan security regression test dan checklist rilis produksi.

## 11. Aturan Kelulusan Akhir

APLI DAKOP v2 baru dapat dinyatakan siap produksi apabila:

- Seluruh checklist P0 selesai.
- Tidak ada temuan critical/high yang terbuka.
- Auth dan RBAC diuji dari sisi API, bukan hanya UI.
- Data simulasi tidak muncul pada mode produksi.
- Backup/restore dan rollback telah diuji.
- Lint, type-check, test, build, dan dependency audit berhasil.
- Pemilik sistem menyetujui hasil User Acceptance Test dan security verification.
