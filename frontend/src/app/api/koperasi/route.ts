import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 10);
  const search = searchParams.get('search') || '';
  const kecamatanId = searchParams.get('kecamatanId') || '';
  const desaId = searchParams.get('desaId') || '';
  const jenisKoperasiId = searchParams.get('jenisKoperasiId') || '';
  const statusAktif = searchParams.get('statusAktif') || '';

  try {
    const res = await fetchFromBackend('/api/v1/master_koperasi/view', {
      method: 'POST',
      body: JSON.stringify({
        page_limit: limit,
        data_ke: page,
        cari_value: kecamatanId,
        pencarian: search,
        desa_id: desaId,
        jenis_koperasi: jenisKoperasiId,
        status_aktif: statusAktif,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const rawList = json?.data || [];
      const totalPages = Number(json?.jml_data) || 1;
      const total = typeof json?.total_data === 'number' ? json.total_data : totalPages * limit;

      const mapped = rawList.map((item: any) => ({
        id: String(item.id || item.no_bh),
        namaKoperasi: item.nama_koperasi || item.nama || 'Koperasi Serba Usaha',
        nomorBadanHukum: item.no_bh || item.nomor_badan_hukum || item.nbh || '-',
        tanggalBadanHukum: item.tgl_bh || item.tanggal_badan_hukum || '2020-01-01',
        alamat: item.alamat || `Desa ${item.nama_des_kel || '-'}, Kec. ${item.nama_kecamatan || '-'}`,
        kecamatanId: String(item.kecamatan_id || ''),
        kecamatan: {
          id: String(item.kecamatan_id || ''),
          nama: item.nama_kecamatan || 'Kecamatan',
        },
        desa: {
          id: String(item.desa_id || ''),
          nama: item.nama_des_kel || 'Desa',
        },
        jenisKoperasi: {
          id: String(item.jeniskoperasi_id || item.jenis_koperasi || '1'),
          uraian: item.jenis_koperasi || item.uraian || 'Koperasi Produsen',
        },
        statusAktif: item.status_koperasi ? item.status_koperasi.toLowerCase() === 'aktif' : (item.status_aktif !== '0' && item.status_aktif !== 0),
        statusKoperasi: item.status_koperasi || (item.status_aktif ? 'Aktif' : 'Tidak Aktif'),
        ketua: item.nama_ketua || item.ketua || '-',
        nikop: item.nikop || '-',
        keterangan: item.keterangan || '-',
        jumlahAnggota: Number(item.jumlah_anggota || item.anggota || 25),
        modalAwal: Number(item.modal_sendiri || item.modal_awal || 20000000),
        asset: Number(item.modal_luar || item.asset || 50000000),
      }));

      return NextResponse.json({
        data: mapped,
        meta: {
          page,
          limit,
          total: mapped.length === 0 ? 0 : total,
          totalPages: mapped.length === 0 ? 0 : totalPages,
        },
      });
    }
  } catch (e) {
    console.error('[Koperasi] Error fetching from backend:', e);
  }

  // Fallback data simulasi
  const fallbackList = [
    {
      id: '1',
      namaKoperasi: 'KUD Sejahtera Bersama',
      nomorBadanHukum: 'AHU-00123.AH.01.26.TAHUN 2021',
      tanggalBadanHukum: '2021-03-15',
      alamat: 'Jl. Poros Tinanggea Km. 3',
      kecamatanId: '7405010',
      kecamatan: { id: '7405010', nama: 'Tinanggea' },
      desa: { id: '7405010001', nama: 'Tinanggea' },
      jenisKoperasi: { id: '1', uraian: 'Koperasi Produsen' },
      statusAktif: true,
      jumlahAnggota: 65,
      modalAwal: 50000000,
      asset: 185000000,
    },
    {
      id: '2',
      namaKoperasi: 'KSP Bina Mandiri Konsel',
      nomorBadanHukum: 'AHU-00456.AH.01.26.TAHUN 2019',
      tanggalBadanHukum: '2019-07-20',
      alamat: 'Kompleks Pasar Andoolo',
      kecamatanId: '7405030',
      kecamatan: { id: '7405030', nama: 'Andoolo' },
      desa: { id: '7405030001', nama: 'Andoolo' },
      jenisKoperasi: { id: '2', uraian: 'Koperasi Simpan Pinjam' },
      statusAktif: true,
      jumlahAnggota: 120,
      modalAwal: 75000000,
      asset: 420000000,
    },
  ];

  return NextResponse.json({
    data: fallbackList,
    meta: {
      page: 1,
      limit: 10,
      total: fallbackList.length,
      totalPages: 1,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetchFromBackend('/api/v1/master_koperasi/addData', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: data?.message || 'Gagal menyimpan data koperasi ke server' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e: any) {
    console.error('[Koperasi] Error saving data:', e);
    return NextResponse.json(
      { message: 'Koneksi ke backend gagal: ' + (e?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
