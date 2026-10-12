import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';
import { koperasiSchema } from '@/lib/api-schemas';
import { parseJsonBody, securityErrorResponse } from '@/lib/server-security';

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

const mapKoperasi = (item: any) => ({
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
  nikKetua: item.nik_ketua ?? null,
  telpKoperasi: item.hp_ketua ?? null,
  namaSekretaris: item.nama_sek ?? null,
  nikSekretaris: item.nik_sek ?? null,
  hpSekretaris: item.hp_sek ?? null,
  namaBendahara: item.nama_ben ?? null,
  nikBendahara: item.nik_ben ?? null,
  hpBendahara: item.hp_ben ?? null,
  namaPengawas: item.nama_pengawas ?? null,
  nikPengawas: item.nik_pengawas ?? null,
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
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Math.min(100_000, Number(searchParams.get('page') || 1) || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 10) || 10));
  try {
    const res = await fetchFromBackend('/api/v1/master_koperasi/view', {
      method: 'POST',
      body: JSON.stringify({
        page_limit: limit,
        data_ke: page,
        pencarian: (searchParams.get('search') || '').trim().slice(0, 200),
        cari_value: (searchParams.get('kecamatanId') || '').trim().slice(0, 64),
        desa_id: (searchParams.get('desaId') || '').trim().slice(0, 64),
        jenis_koperasi: (searchParams.get('jenisKoperasiId') || '').trim().slice(0, 64),
        status_aktif: (searchParams.get('statusAktif') || '').trim().slice(0, 10),
        tahun: (searchParams.get('tahun') || '').trim().slice(0, 4),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ message: 'Gagal membaca data koperasi.' }, { status: res.status });
    const data = Array.isArray(json.data) ? json.data.map(mapKoperasi) : [];
    return NextResponse.json({
      data,
      meta: {
        page,
        limit,
        total: Number(json.total_data || 0),
        totalPages: Number(json.jml_data || 0),
      },
    });
  } catch (error) {
    console.error('[Koperasi] Error fetching from backend:', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data koperasi tidak tersedia.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const parsed = await parseJsonBody(req, koperasiSchema);
    if (parsed.error) return parsed.error;
    const res = await fetchFromBackend('/api/v1/master_koperasi/addData', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[Koperasi] Error saving data:', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data koperasi tidak tersedia.' }, { status: 503 });
  }
}
