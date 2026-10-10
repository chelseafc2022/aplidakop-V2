# ATURAN & PANDUAN KERJA AGENT (APLI DAKOP v2)

## 🚫 HAL-HAL YANG DILARANG / TIDAK PERLU DILAKUKAN
1. **DILARANG MENGGUNAKAN SCRATCHPAD**:
   - Dilarang membuat file scratchpad, draft, catatan sementara, atau checklist file ke dalam repository.
   - Langsung lakukan analisa dan eksekusi perubahan file target secara bersih dan presisi.

2. **DILARANG BUILD & GIT PUSH TANPA PERINTAH EKSPLISIT**:
   - Dilarang menjalankan proses build (`npm run build`) kecuali diperintahkan secara eksplisit oleh user.
   - Dilarang melakukan `git push` kecuali diminta secara eksplisit.
   - Dev server (`npm run dev`) sudah berjalan; perubahan kode akan ter-hot-reload otomatis.

3. **MUTLAK AMANKAN DATABASE & INTEGRASI EKSTERNAL**:
   - Database eksternal (misal MySQL Konawe Selatan / e-Gov / API Master) bersifat READ-ONLY kecuali diperintahkan sebaliknya.
   - Dilarang melakukan migrasi destruktif (`DROP`, `TRUNCATE`, `ALTER`) pada tabel data riil tanpa instruksi khusus.

4. **FOKUS DAN TEPAT SASARAN**:
   - Jangan menambahkan file atau dependency yang tidak diperlukan.
   - Pertahankan estetika premium, konsistensi token Tailwind/shadcn, dan kerapian arsitektur yang sudah ada.
