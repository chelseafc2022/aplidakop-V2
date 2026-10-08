# 🚀 APLI DAKOP UMKM v2

Aplikasi Data Koperasi dan Pelaku UMKM Kabupaten Konawe Selatan versi 2.0 yang telah dimigrasikan ke arsitektur modern fullstack.

---

## 🏗️ Tech Stack

### 💻 Frontend (`/frontend`)
- **Framework**: Next.js 16 (React 19, App Router)
- **UI & Styling**: Tailwind CSS, Shadcn UI, Lucide Icons, Sonner Toast
- **State Management & Caching**: TanStack Query (React Query v5) & Zustand (Persist)
- **Search Optimization**: Debounced Search Hook (`useDebounce`)
- **HTTP & Auth Wrapper**: Axios client dengan **Automatic JWT Refresh Token Interceptor & Request Queue**
- **Charts & Visualisasi**: Recharts interaktif (Sebaran per kecamatan, Sektor usaha, dll.)

### ⚙️ Backend Terpadu (`/BackendStatistik`)
- **Framework**: Node.js & Express REST API
- **Port**: `http://localhost:5020` (atau `http://statistik-server.konaweselatankab.go.id`)
- **Database**: MySQL (`db_dinkop`, `egov`, `simpeg`)
- **Autentikasi**: JWT Token (`/aplidakop_auth/login`)
- **Modul**: `dinkop_index`, `master_pelaku`, `master_koperasi`, `stat_pembiayaan_umkm`, `stat_pembiayaan_koperasi`, `stat_data_umkm`, `stat_data_koperasi`, `laporan_aplidakop`

---

## 📁 Struktur Direktori

```
aplidakop_v2/
├── frontend/                     # Next.js 16 Client App
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing Page Publik & Hero
│   │   │   ├── login/            # Halaman Login
│   │   │   └── (dashboard)/
│   │   │       ├── dashboard/    # Ringkasan KPI & Visualisasi Grafik
│   │   │       ├── inovasi/      # Modul Portofolio & Verifikasi Inovasi Smart City
│   │   │       ├── pelaku-umkm/  # CRUD Data Pelaku UMKM
│   │   │       ├── koperasi/     # CRUD Data Koperasi
│   │   │       ├── master/       # Master Jenis Usaha & Jenis Koperasi
│   │   │       ├── pembiayaan/   # Penyaluran KUR, UMi, LPDB
│   │   │       ├── statistik/    # Laporan Agregasi UMKM & Koperasi
│   │   │       └── management/   # Manajemen Pengguna & Hak Akses
│   │   ├── components/           # Shadcn UI & App Components
│   │   ├── hooks/                # Custom React Hooks
│   │   ├── lib/api.ts            # Client Adapter ke BackendStatistik
│   │   ├── providers/            # QueryClientProvider (TanStack)
│   │   └── stores/               # Zustand Auth Store
```

---

## ⚡ Cara Menjalankan Project

### 1. Menjalankan Backend (`BackendStatistik`)
```bash
cd /Users/simplephi/Documents/riswan/BackendStatistik
npm run dev
# Menjalankan Express API di http://localhost:5020
```

### 2. Menjalankan Frontend (`aplidakop_v2`)
```bash
cd /Users/simplephi/Documents/riswan/aplidakop_v2/frontend
npm run dev
# Menjalankan Next.js di http://localhost:3000
```
- Web Application: `http://localhost:3000`
- Portal Inovasi Smart City: `http://localhost:3000/inovasi`
- Halaman Login: `http://localhost:3000/login`

