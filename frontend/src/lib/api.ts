import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isAdministratorRole, maskNik } from '@/lib/auth-role';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_STATISTIK_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://statistik-server.konaweselatankab.go.id';

export function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('aplidakop-token') || '';
}

export function getStoredUser(): any {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('aplidakop-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isCurrentAdmin(): boolean {
  const user = getStoredUser();
  return isAdministratorRole(user?.role?.nama);
}

// Low-level client directed straight to BackendStatistik
export const backendHttp = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45_000,
});

backendHttp.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

backendHttp.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      localStorage.removeItem('aplidakop-token');
      localStorage.removeItem('aplidakop-user');
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

const toDateOnly = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const DAFTAR_KECAMATAN_KONSEL = [
  { id: '7405010', nama: 'Tinanggea' },
  { id: '7405020', nama: 'Angata' },
  { id: '7405030', nama: 'Andoolo' },
  { id: '7405040', nama: 'Palangga' },
  { id: '7405050', nama: 'Landono' },
  { id: '7405060', nama: 'Lainea' },
  { id: '7405070', nama: 'Konda' },
  { id: '7405080', nama: 'Ranomeeto' },
  { id: '7405090', nama: 'Kolono' },
  { id: '7405100', nama: 'Moramo' },
  { id: '7405110', nama: 'Laonti' },
  { id: '7405120', nama: 'Lalembuu' },
  { id: '7405130', nama: 'Benua' },
  { id: '7405140', nama: 'Palangga Selatan' },
  { id: '7405150', nama: 'Mowila' },
  { id: '7405160', nama: 'Moramo Utara' },
  { id: '7405170', nama: 'Buke' },
  { id: '7405180', nama: 'Wolasi' },
  { id: '7405190', nama: 'Laeya' },
  { id: '7405200', nama: 'Baito' },
  { id: '7405210', nama: 'Basala' },
  { id: '7405220', nama: 'Ranomeeto Barat' },
  { id: '7405230', nama: 'Kolono Timur' },
  { id: '7405240', nama: 'Sabulakoa' },
  { id: '7405250', nama: 'Andoolo Barat' },
];

function mapKoperasi(item: any, isAdministrator = false) {
  return {
    id: String(item.id),
    nomorSumber: item.nomor_sumber === null ? null : Number(item.nomor_sumber),
    namaKoperasi: item.nama_koperasi ?? null,
    nomorBadanHukum: item.no_bh ?? null,
    tanggalBadanHukum: toDateOnly(item.tgl_bh),
    nikop: item.nikop ?? null,
    alamat: item.alamat ?? null,
    kecamatanId: item.kecamatan_id ? String(item.kecamatan_id) : null,
    kecamatan: item.kecamatan_id ? { id: String(item.kecamatan_id), nama: item.nama_kecamatan ?? null } : null,
    desaId: item.desa_id ? String(item.desa_id) : null,
    desa: item.desa_id ? { id: String(item.desa_id), nama: item.nama_des_kel ?? null } : null,
    jenisKoperasiId: item.jenis_koperasi ? String(item.jenis_koperasi) : null,
    jenisKoperasi: item.jenis_koperasi ? { id: String(item.jenis_koperasi), uraian: item.jenis_koperasi_nama ?? null } : null,
    statusAktif: String(item.status_koperasi ?? '').trim().toLowerCase() === 'aktif',
    statusKoperasi: item.status_koperasi ?? null,
    ketua: item.nama_ketua ?? null,
    nikKetua: maskNik(item.nik_ketua, isAdministrator),
    telpKoperasi: item.hp_ketua ?? null,
    namaSekretaris: item.nama_sek ?? null,
    nikSekretaris: maskNik(item.nik_sek, isAdministrator),
    hpSekretaris: item.hp_sek ?? null,
    namaBendahara: item.nama_ben ?? null,
    nikBendahara: maskNik(item.nik_ben, isAdministrator),
    hpBendahara: item.hp_ben ?? null,
    namaPengawas: item.nama_pengawas ?? null,
    nikPengawas: maskNik(item.nik_pengawas, isAdministrator),
    hpPengawas: item.hp_pengawas ?? null,
    modalAwal: item.modal_sendiri === null ? null : Number(item.modal_sendiri),
    modalLuar: item.modal_luar === null ? null : Number(item.modal_luar),
    jumlahAnggota: item.jumlah_anggota === null ? null : Number(item.jumlah_anggota),
    asset: item.asset === null ? null : Number(item.asset),
    volumeUsaha: item.volume_usaha === null ? null : Number(item.volume_usaha),
    shu: item.shu === null ? null : Number(item.shu),
    keterangan: item.keterangan ?? null,
    bentukKoperasi: item.bentuk_koperasi ?? null,
    polaPengelolaan: item.pola_pengelolaan ?? null,
    sektorUsaha: item.sektor_usaha ?? null,
    kelompokKoperasi: item.kelompok_koperasi ?? null,
    kabupatenKota: item.kabupaten_kota ?? null,
    kelurahanSumber: item.kelurahan_sumber ?? null,
    desaSumber: item.desa_sumber ?? null,
    kodePos: item.kode_pos ?? null,
    email: item.email ?? null,
    kuk: item.kuk === null ? null : Number(item.kuk),
    grade: item.grade ?? null,
    statusAkunOdsMandiri: item.status_akun_ods_mandiri ?? null,
    wilayahMappingStatus: item.wilayah_mapping_status ?? null,
    tahunPendataan: item.tahun_pendataan === null ? null : Number(item.tahun_pendataan),
    tanggalDiterima: toDateOnly(item.tanggal_diterima),
    sourceBatchId: item.source_batch_id ?? null,
    createdAt: item.createAt ?? null,
    updatedAt: item.editeAt ?? null,
  };
}

function mapPelakuUmkm(item: any, isAdministrator = false) {
  const tb = item.tahun_berdiri ? Number(item.tahun_berdiri) : 0;
  const tahunPendataan = Number(item.tahun_pendataan_aktif || item.tahun_pendataan || 2024);
  const isBaseline = tahunPendataan <= 2024;

  return {
    id: String(item.id || item.nik),
    namaPemilik: item.nama_pemilik || item.nama || '-',
    nik: maskNik(item.nik, isAdministrator),
    namaUsaha: item.nama_usaha || item.uraian || 'Usaha Mikro',
    alamat: item.alamat || `Desa ${item.nama_des_kel || '-'}, Kec. ${item.nama_kecamatan || '-'}`,
    nohp: item.nohp || '-',
    kk: maskNik(item.kk, isAdministrator),
    tahunBerdiri: tb,
    tahunPendataan,
    isBaseline,
    statusData: isBaseline ? 'BASELINE' : 'PEMUTAKHIRAN',
    periodeData: isBaseline ? '2021-2024' : String(tahunPendataan),
    nib: item.nib || '-',
    pirt: item.pirt || '-',
    halal: item.halal || '-',
    haki: item.haki || '-',
    keterangan: item.keterangan || '-',
    kecamatanId: String(item.kecamatan_id || ''),
    desaId: String(item.desa_id || ''),
    jenisUsahaId: String(item.jenisusaha_id || ''),
    kecamatan: {
      id: String(item.kecamatan_id || ''),
      nama: item.nama_kecamatan || 'Kecamatan',
    },
    desa: {
      id: String(item.desa_id || ''),
      nama: item.nama_des_kel || 'Desa',
    },
    jenisUsaha: {
      id: String(item.jenisusaha_id || ''),
      uraian: item.uraian || 'Perdagangan & Jasa',
    },
    modalSendiri: Number(item.modal_sendiri || 0),
    modalLuar: Number(item.modal_luar || 0),
    modalUsaha: Number(item.asset_pendataan ?? item.modal_sendiri ?? item.modal ?? 0),
    omsetTahun: Number(item.omzet_pendataan ?? item.omset ?? item.omset_tahun ?? 0),
    jumlahTenagaKerja: Number(item.tenaga_kerja_pendataan ?? item.naker ?? item.jumlah_tenaga_kerja ?? 0),
  };
}

/**
 * Main application client adapter.
 * Adapts internal REST conventions into direct BackendStatistik endpoints.
 */
class ApiAdapter {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const isAdmin = isCurrentAdmin();
    const cleanUrl = url.replace(/^\/api/, '');

    // 1. Auth: Me
    if (cleanUrl === '/auth/me') {
      const stored = getStoredUser();
      const token = getStoredToken();
      if (!token) throw new AxiosError('Unauthorized', '401', config as any, null, { status: 401 } as any);
      try {
        const res = await backendHttp.get('/aplidakop_auth/me');
        const profile = res.data?.profile || {};
        const details = profile?.profile || {};
        const user = {
          id: String(profile._id || stored?.id || ''),
          username: String(profile.username || stored?.username || ''),
          nama: String(details.nama || details.username || profile.username || stored?.nama || ''),
          email: details.email ? String(details.email) : stored?.email,
          nip: details.nip ? String(details.nip) : stored?.nip,
          hp: details.hp ? String(details.hp) : stored?.hp,
          instansiNama: details.instansi_nama ? String(details.instansi_nama) : stored?.instansiNama,
          unitKerjaNama: details.unit_kerja_nama ? String(details.unit_kerja_nama) : stored?.unitKerjaNama,
          roleId: String(details.menu_klp || res.data?.role?.id || stored?.roleId || ''),
          role: {
            id: String(res.data?.role?.id || details.menu_klp || stored?.role?.id || ''),
            nama: String(res.data?.role?.nama || details.menu_klp_uraian || stored?.role?.nama || 'Pengguna'),
            permissions: Array.isArray(res.data?.role?.permissions) ? res.data.role.permissions : stored?.role?.permissions || [],
          },
        };
        localStorage.setItem('aplidakop-user', JSON.stringify(user));
        return { data: user as any } as AxiosResponse<T>;
      } catch {
        if (stored) return { data: stored as any } as AxiosResponse<T>;
        throw new AxiosError('Unauthorized', '401', config as any, null, { status: 401 } as any);
      }
    }

    // 2. Dashboard: Summary
    if (cleanUrl.startsWith('/dashboard/summary')) {
      const params = config?.params || {};
      const res = await backendHttp.post('/api/v1/dinkop_index/dashboardSummary', {
        kecamatanId: params.kecamatanId || '',
        periode: params.periode || params.tahun || 'all',
      });
      return res;
    }

    // 3. Wilayah: Kecamatan
    if (cleanUrl === '/wilayah/kecamatan') {
      try {
        const res = await backendHttp.get('/api/v1/dinkop_index/kecamatan');
        if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((item: any) => ({
            id: String(item.kecamatan_id),
            nama: item.nama_kecamatan,
          }));
          return { data: mapped as any } as AxiosResponse<T>;
        }
      } catch (err) {
        console.warn('Backend kecamatan error, using fallback:', err);
      }
      return { data: DAFTAR_KECAMATAN_KONSEL as any } as AxiosResponse<T>;
    }

    // 4. Wilayah: Desa
    const desaMatch = cleanUrl.match(/^\/wilayah\/desa\/(.+)$/);
    if (desaMatch) {
      const kecamatanId = desaMatch[1];
      try {
        const res = await backendHttp.post('/api/v1/master_pelaku/list', { kecamatan: kecamatanId });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((d: any) => ({
            id: String(d.des_kel_id || d.id),
            nama: d.nama_des_kel || d.nama || 'Desa/Kelurahan',
          }));
          return { data: mapped as any } as AxiosResponse<T>;
        }
      } catch (err) {
        console.warn('Backend desa error:', err);
      }
      return {
        data: [
          { id: `${kecamatanId}001`, nama: 'Desa Mandiri 1' },
          { id: `${kecamatanId}002`, nama: 'Desa Sejahtera 2' },
          { id: `${kecamatanId}003`, nama: 'Kelurahan Pusat' },
        ] as any,
      } as AxiosResponse<T>;
    }

    // 5. Pelaku UMKM: View
    if (cleanUrl === '/pelaku-umkm') {
      const p = config?.params || {};
      const page = Number(p.page || 1);
      const limit = Number(p.limit || 10);
      const periode = p.periode === '2021-2024' ? 'baseline' : p.periode || '';

      const res = await backendHttp.post('/api/v1/master_pelaku/view', {
        page_limit: limit,
        data_ke: page,
        cari_value: p.kecamatanId || '',
        pencarian: p.search || '',
        desa_id: p.desaId || '',
        jenisusaha_id: p.jenisUsahaId || '',
        periode,
      });

      const rawList = res.data?.data || [];
      const totalPages = Number(res.data?.jml_data) || 1;
      const total = typeof res.data?.total_data === 'number' ? res.data.total_data : totalPages * limit;

      const mapped = rawList.map((item: any) => mapPelakuUmkm(item, isAdmin));
      return {
        data: {
          data: mapped,
          meta: { page, limit, total: mapped.length === 0 ? 0 : total, totalPages },
        } as any,
      } as AxiosResponse<T>;
    }

    // 6. Koperasi: View
    if (cleanUrl === '/koperasi') {
      const p = config?.params || {};
      const page = Number(p.page || 1);
      const limit = Number(p.limit || 10);

      const res = await backendHttp.post('/api/v1/master_koperasi/view', {
        page_limit: limit,
        data_ke: page,
        pencarian: p.search || '',
        cari_value: p.kecamatanId || '',
        desa_id: p.desaId || '',
        jenis_koperasi: p.jenisKoperasiId || '',
        status_aktif: p.statusAktif || '',
        tahun: p.tahun || '',
      });

      const json = res.data || {};
      const data = Array.isArray(json.data) ? json.data.map((item: any) => mapKoperasi(item, isAdmin)) : [];
      return {
        data: {
          data,
          meta: {
            page,
            limit,
            total: Number(json.total_data || 0),
            totalPages: Number(json.jml_data || 0),
          },
        } as any,
      } as AxiosResponse<T>;
    }

    // 7. Master Jenis: Usaha
    if (cleanUrl === '/master-jenis/usaha') {
      const res = await backendHttp.post('/api/v1/master_jenis_usaha/view', {
        page_limit: 100,
        data_ke: 1,
        cari_value: '',
      });
      const list = res.data?.data || [];
      const mapped = list.map((item: any) => ({
        id: String(item.id),
        uraian: item.uraian,
        pelakuCount: Number(item.pelaku_count || 0),
        createdAt: item.createAt || new Date().toISOString(),
      }));
      return { data: mapped as any } as AxiosResponse<T>;
    }

    // 8. Master Jenis: Koperasi
    if (cleanUrl === '/master-jenis/koperasi') {
      const res = await backendHttp.post('/api/v1/master_jenis_koperasi/view', {
        page_limit: 100,
        data_ke: 1,
        cari_value: '',
      });
      const list = res.data?.data || [];
      const mapped = list.map((item: any) => ({
        id: String(item.id),
        uraian: item.uraian,
        koperasiCount: Number(item.koperasi_count || 0),
        createdAt: item.createAt || new Date().toISOString(),
      }));
      return { data: mapped as any } as AxiosResponse<T>;
    }

    // 9. Pembiayaan UMKM: View
    if (cleanUrl === '/pembiayaan/umkm') {
      const p = config?.params || {};
      const page = Number(p.page || 1);
      const limit = Number(p.limit || 10);

      const res = await backendHttp.post('/api/v1/stat_pembiayaan_umkm/view', {
        page_limit: limit,
        data_ke: page,
        pencarian: p.search || '',
        tahun: p.tahun === 'all' ? '' : p.tahun || '',
        cari_value: p.kecamatanId === 'all' ? '' : p.kecamatanId || '',
        desa_id: p.desaId === 'all' ? '' : p.desaId || '',
        jenisusaha_id: p.jenisUsahaId === 'all' ? '' : p.jenisUsahaId || '',
        jenis_bantuan: p.jenisBantuan === 'all' ? '' : p.jenisBantuan || '',
      });

      const rawList = res.data?.data || [];
      const mapped = rawList.map((item: any) => {
        const desa = item.nama_des_kel || '';
        const kec = item.nama_kecamatan || '';
        const alamat = [desa ? `Desa ${desa}` : '', kec ? `Kec. ${kec}` : ''].filter(Boolean).join(', ') || '-';
        return {
          id: String(item.id || item.idx),
          pelakuId: String(item.pelaku_id || item.master_pelaku_id || ''),
          namaPemilik: item.nama_pemilik || '-',
          nik: maskNik(item.nik, isAdmin),
          kk: maskNik(item.kk, isAdmin),
          nohp: item.nohp || '-',
          namaUsaha: item.nama_usaha || '-',
          alamat,
          kecamatan: item.nama_kecamatan || '-',
          desa: item.nama_des_kel || '-',
          jenisUsaha: item.jenis_usaha_nama || '-',
          tahun: Number(item.tahun) || 2024,
          bantuTunai: item.bantu_tunai || '',
          bantuSarana: item.bantu_sarana || '',
          sumberAnggaran: item.sumber_anggaran || '',
          keterangan: item.keterangan || '',
        };
      });
      return { data: mapped as any } as AxiosResponse<T>;
    }

    // 10. Pembiayaan Koperasi: View
    if (cleanUrl === '/pembiayaan/koperasi') {
      const p = config?.params || {};
      const res = await backendHttp.post('/api/v1/stat_pembiayaan_koperasi/view', {
        page_limit: Number(p.limit || 50),
        data_ke: Number(p.page || 1),
        cari_value: '',
        pencarian: p.search || '',
        desa_id: '',
        tahun: p.tahun || '',
      });
      const list = res.data?.data || [];
      const mapped = list.map((item: any) => ({
        id: String(item.id || item.idx),
        koperasi: {
          namaKoperasi: item.nama_koperasi || item.nama || '-',
          nomorBadanHukum: item.no_bh || item.nomor_badan_hukum || item.nbh || '-',
          kecamatan: { nama: item.nama_kecamatan || '-' },
        },
        tahun: Number(item.tahun) || new Date().getFullYear(),
        sumberPembiayaan: item.sumber_pembiayaan || item.bantu_tunai || '-',
        lembagaPenyalur: item.lembaga_penyalur || '-',
        jumlahPinjaman: Number(item.jumlah_pinjaman || 0),
        statusPengajuan: item.status_pengajuan || '-',
        keterangan: item.keterangan || '-',
      }));
      return { data: mapped as any } as AxiosResponse<T>;
    }

    // 11. Management: Roles
    const roleIdMatch = cleanUrl.match(/^\/management\/roles\/(.+)$/);
    if (roleIdMatch) {
      const roleId = roleIdMatch[1];
      const res = await backendHttp.post('/api/v1/kelompokUsersAplidakop/listEdit', { id: roleId });
      return res;
    }
    if (cleanUrl === '/management/roles') {
      const res = await backendHttp.post('/api/v1/kelompokUsersAplidakop/view', {
        page_limit: 100,
        data_ke: 1,
        cari_value: '',
      });
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      const mapped = list.map((role: any) => ({
        id: String(role.id),
        nama: role.uraian || role.kelompok || role.nama || 'Role tanpa nama',
        keterangan: role.keterangan || '',
      }));
      return { data: mapped as any } as AxiosResponse<T>;
    }

    // 12. Management: Menus
    if (cleanUrl === '/management/menus') {
      const res = await backendHttp.get('/api/v1/kelompokUsersAplidakop/listAdd');
      return res;
    }

    // 13. Management: Users
    if (cleanUrl === '/management/users/instansi') {
      return await backendHttp.get('/api/v1/registrasiAplidakop/instansiList');
    }
    if (cleanUrl === '/management/users/unit-kerja') {
      const instansiId = config?.params?.instansiId || '';
      return await backendHttp.post('/api/v1/registrasiAplidakop/unitKerjaList', { instansi_id: instansiId });
    }
    if (cleanUrl === '/management/users') {
      const p = config?.params || {};
      const hasRole = p.hasRole ?? 'true';
      const res = await backendHttp.post('/api/v1/registrasiAplidakop/view', {
        page_limit: Number(p.limit || 10),
        data_ke: Number(p.page || 1),
        cari_value: p.search || '',
        instansi_id: p.instansiId || undefined,
        unit_kerja_id: p.unitKerjaId || undefined,
        has_role: hasRole === 'all' ? undefined : hasRole === 'true',
      });
      const list = res.data?.data || [];
      const total = Number(res.data?.total ?? list.length);
      const mapped = list.map((u: any) => ({
        id: String(u.id),
        username: u.username,
        nama: u.nama || u.username,
        nip: u.nip || '-',
        hp: u.hp || '-',
        email: u.email || '',
        instansiId: String(u.instansi_id || ''),
        instansiNama: u.instansi_nama || '-',
        unitKerjaId: String(u.unit_kerja_id || ''),
        unitKerjaNama: u.unit_kerja_nama || '-',
        role: {
          id: String(u.menu_klp || u.db_dinkop || '0'),
          nama: u.menu_klp_uraian || 'Belum Ada Role',
        },
        hasRole: Number(u.menu_klp || 0) > 0,
        createdAt: u.createAt || null,
      }));
      return { data: { data: mapped, total } as any } as AxiosResponse<T>;
    }

    // 14. Management: Verifikasi Koperasi
    if (cleanUrl.startsWith('/management/verifikasi-koperasi')) {
      return await backendHttp.get('/api/v1/verifikasi_koperasi', config);
    }

    // 15. Management: NIK Kembar
    if (cleanUrl.startsWith('/management/nik-kembar')) {
      return await backendHttp.get('/api/v1/import_umkm_nik_kembar', config);
    }

    // 16. Management: Layanan UMKM
    if (cleanUrl.startsWith('/management/layanan-umkm')) {
      const subPath = cleanUrl.replace('/management/layanan-umkm', '');
      return await backendHttp.get(`/api/v1/layanan_umkm${subPath}`, config);
    }

    // Fallback direct GET
    return await backendHttp.get(cleanUrl, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const cleanUrl = url.replace(/^\/api/, '');

    // 1. Auth: Login
    if (cleanUrl === '/auth/login') {
      const res = await backendHttp.post('/aplidakop_auth/login', data, config);
      const raw = res.data || {};
      const profile = raw.profile || {};
      const details = profile.profile || {};
      const user = {
        id: String(profile._id || ''),
        username: String(profile.username || data?.username || ''),
        nama: String(details.nama || details.username || profile.username || data?.username || ''),
        email: details.email ? String(details.email) : undefined,
        nip: details.nip ? String(details.nip) : undefined,
        hp: details.hp ? String(details.hp) : undefined,
        instansiNama: details.instansi_nama ? String(details.instansi_nama) : undefined,
        unitKerjaNama: details.unit_kerja_nama ? String(details.unit_kerja_nama) : undefined,
        roleId: String(details.menu_klp || raw.role?.id || ''),
        role: {
          id: String(raw.role?.id || details.menu_klp || ''),
          nama: String(raw.role?.nama || details.menu_klp_uraian || 'Tanpa Role'),
          permissions: Array.isArray(raw.role?.permissions) ? raw.role.permissions : [],
        },
      };
      if (raw.token) {
        localStorage.setItem('aplidakop-token', raw.token);
        localStorage.setItem('aplidakop-user', JSON.stringify(user));
      }
      return { data: { user } as any } as AxiosResponse<T>;
    }

    // 2. Auth: Logout
    if (cleanUrl === '/auth/logout') {
      try {
        await backendHttp.post('/aplidakop_auth/logout', {}, config);
      } catch {}
      localStorage.removeItem('aplidakop-token');
      localStorage.removeItem('aplidakop-user');
      return { data: { success: true } as any } as AxiosResponse<T>;
    }

    // 3. Pelaku UMKM: Add
    if (cleanUrl === '/pelaku-umkm') {
      return await backendHttp.post('/api/v1/master_pelaku/addData', data, config);
    }

    // 4. Koperasi: Add
    if (cleanUrl === '/koperasi') {
      return await backendHttp.post('/api/v1/master_koperasi/addData', data, config);
    }

    // 5. Master Jenis: Usaha Add
    if (cleanUrl === '/master-jenis/usaha') {
      return await backendHttp.post('/api/v1/master_jenis_usaha/addData', data, config);
    }

    // 6. Master Jenis: Koperasi Add
    if (cleanUrl === '/master-jenis/koperasi') {
      return await backendHttp.post('/api/v1/master_jenis_koperasi/addData', data, config);
    }

    // 7. Pembiayaan UMKM: Add
    if (cleanUrl === '/pembiayaan/umkm') {
      return await backendHttp.post('/api/v1/stat_pembiayaan_umkm/addData', data, config);
    }

    // 8. Pembiayaan Koperasi: Add
    if (cleanUrl === '/pembiayaan/koperasi') {
      return await backendHttp.post('/api/v1/stat_pembiayaan_koperasi/addData', data, config);
    }

    // 9. Management: Roles Add
    if (cleanUrl === '/management/roles') {
      let listMenu = data?.list_menu;
      if (!listMenu?.length) {
        const menuRes = await backendHttp.get('/api/v1/kelompokUsersAplidakop/listAdd');
        listMenu = menuRes.data;
      }
      return await backendHttp.post('/api/v1/kelompokUsersAplidakop/addData', {
        form: { uraian: data?.nama },
        list_menu: listMenu,
      }, config);
    }

    // 10. Management: Permissions
    if (cleanUrl === '/management/permissions') {
      return await backendHttp.post('/api/v1/kelompokUsersAplidakop/editData', data, config);
    }

    // 11. Management: Users Add
    if (cleanUrl === '/management/users') {
      return await backendHttp.post('/api/v1/registrasiAplidakop/signup', data, config);
    }
    if (cleanUrl === '/management/users/reset-password') {
      return await backendHttp.post('/api/v1/registrasiAplidakop/editDataPass', data, config);
    }

    // 12. Management: Verifikasi Koperasi Action
    if (cleanUrl.startsWith('/management/verifikasi-koperasi')) {
      return await backendHttp.post('/api/v1/verifikasi_koperasi', data, config);
    }

    // 13. Management: NIK Kembar Resolve
    if (cleanUrl.startsWith('/management/nik-kembar/resolve') || cleanUrl.startsWith('/management/nik-kembar')) {
      return await backendHttp.post('/api/v1/import_umkm_nik_kembar/resolve', data, config);
    }

    // 14. Management: Layanan UMKM
    if (cleanUrl.startsWith('/management/layanan-umkm')) {
      const subPath = cleanUrl.replace('/management/layanan-umkm', '');
      return await backendHttp.post(`/api/v1/layanan_umkm${subPath}`, data, config);
    }

    // Fallback direct POST
    return await backendHttp.post(cleanUrl, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const cleanUrl = url.replace(/^\/api/, '');

    // 1. Pelaku UMKM: Edit
    const umkmMatch = cleanUrl.match(/^\/pelaku-umkm\/(.+)$/);
    if (umkmMatch) {
      return await backendHttp.post('/api/v1/master_pelaku/editData', { ...data, id: umkmMatch[1] }, config);
    }

    // 2. Koperasi: Edit
    const kopMatch = cleanUrl.match(/^\/koperasi\/(.+)$/);
    if (kopMatch) {
      return await backendHttp.post('/api/v1/master_koperasi/editData', { ...data, id: kopMatch[1] }, config);
    }

    // 3. Master Jenis Usaha: Edit
    const mjUsahaMatch = cleanUrl.match(/^\/master-jenis\/usaha\/(.+)$/);
    if (mjUsahaMatch) {
      return await backendHttp.post('/api/v1/master_jenis_usaha/editData', { ...data, id: mjUsahaMatch[1] }, config);
    }

    // 4. Master Jenis Koperasi: Edit
    const mjKopMatch = cleanUrl.match(/^\/master-jenis\/koperasi\/(.+)$/);
    if (mjKopMatch) {
      return await backendHttp.post('/api/v1/master_jenis_koperasi/editData', { ...data, id: mjKopMatch[1] }, config);
    }

    // 5. Pembiayaan UMKM: Edit
    const pbUmkmMatch = cleanUrl.match(/^\/pembiayaan\/umkm\/(.+)$/);
    if (pbUmkmMatch) {
      return await backendHttp.post('/api/v1/stat_pembiayaan_umkm/editData', { ...data, id: pbUmkmMatch[1] }, config);
    }

    // 6. Pembiayaan Koperasi: Edit
    const pbKopMatch = cleanUrl.match(/^\/pembiayaan\/koperasi\/(.+)$/);
    if (pbKopMatch) {
      return await backendHttp.post('/api/v1/stat_pembiayaan_koperasi/editData', { ...data, id: pbKopMatch[1] }, config);
    }

    // 7. Management: Roles Edit
    const roleMatch = cleanUrl.match(/^\/management\/roles\/(.+)$/);
    if (roleMatch) {
      return await backendHttp.post('/api/v1/kelompokUsersAplidakop/editData', {
        form: { id: roleMatch[1], uraian: data?.nama },
        list_menu: data?.list_menu,
      }, config);
    }

    // 8. Management: Users Edit
    if (cleanUrl === '/management/users') {
      return await backendHttp.post('/api/v1/registrasiAplidakop/editData', data, config);
    }

    // Fallback direct PUT
    return await backendHttp.put(cleanUrl, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const cleanUrl = url.replace(/^\/api/, '');

    // 1. Pelaku UMKM: Remove
    const umkmMatch = cleanUrl.match(/^\/pelaku-umkm\/(.+)$/);
    if (umkmMatch) {
      return await backendHttp.post('/api/v1/master_pelaku/removeData', { id: umkmMatch[1] }, config);
    }

    // 2. Koperasi: Remove
    const kopMatch = cleanUrl.match(/^\/koperasi\/(.+)$/);
    if (kopMatch) {
      return await backendHttp.post('/api/v1/master_koperasi/removeData', { id: kopMatch[1] }, config);
    }

    // 3. Master Jenis Usaha: Remove
    const mjUsahaMatch = cleanUrl.match(/^\/master-jenis\/usaha\/(.+)$/);
    if (mjUsahaMatch) {
      return await backendHttp.post('/api/v1/master_jenis_usaha/removeData', { id: mjUsahaMatch[1] }, config);
    }

    // 4. Master Jenis Koperasi: Remove
    const mjKopMatch = cleanUrl.match(/^\/master-jenis\/koperasi\/(.+)$/);
    if (mjKopMatch) {
      return await backendHttp.post('/api/v1/master_jenis_koperasi/removeData', { id: mjKopMatch[1] }, config);
    }

    // 5. Pembiayaan UMKM: Remove
    const pbUmkmMatch = cleanUrl.match(/^\/pembiayaan\/umkm\/(.+)$/);
    if (pbUmkmMatch) {
      return await backendHttp.post('/api/v1/stat_pembiayaan_umkm/removeData', { id: pbUmkmMatch[1] }, config);
    }

    // 6. Pembiayaan Koperasi: Remove
    const pbKopMatch = cleanUrl.match(/^\/pembiayaan\/koperasi\/(.+)$/);
    if (pbKopMatch) {
      return await backendHttp.post('/api/v1/stat_pembiayaan_koperasi/removeData', { id: pbKopMatch[1] }, config);
    }

    // 7. Management: Roles Remove
    const roleMatch = cleanUrl.match(/^\/management\/roles\/(.+)$/);
    if (roleMatch) {
      return await backendHttp.post('/api/v1/kelompokUsersAplidakop/removeData', { id: roleMatch[1] }, config);
    }

    // 8. Management: Users Remove
    if (cleanUrl === '/management/users') {
      const id = config?.data?.id || config?.params?.id;
      return await backendHttp.post('/api/v1/registrasiAplidakop/removeData', { id }, config);
    }

    // 9. Management: Layanan UMKM Remove
    if (cleanUrl.startsWith('/management/layanan-umkm')) {
      const subPath = cleanUrl.replace('/management/layanan-umkm', '');
      return await backendHttp.delete(`/api/v1/layanan_umkm${subPath}`, config);
    }

    // Fallback direct DELETE
    return await backendHttp.delete(cleanUrl, config);
  }
}

export const api = new ApiAdapter();
export default api;
