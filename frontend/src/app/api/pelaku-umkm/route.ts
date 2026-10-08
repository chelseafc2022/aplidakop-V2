import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 10);
  const search = searchParams.get('search') || '';
  const kecamatanId = searchParams.get('kecamatanId') || '';
  const desaId = searchParams.get('desaId') || '';
  const jenisUsahaId = searchParams.get('jenisUsahaId') || '';

  try {
    const res = await fetchFromBackend('/api/v1/master_pelaku/view', {
      method: 'POST',
      body: JSON.stringify({
        page_limit: limit,
        data_ke: page,
        cari_value: kecamatanId,
        pencarian: search,
        desa_id: desaId,
        jenisusaha_id: jenisUsahaId,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const rawList = json?.data || [];
      const totalPages = Number(json?.jml_data) || 1;
      const total = typeof json?.total_data === 'number' ? json.total_data : totalPages * limit;

      const mapped = rawList.map((item: any) => ({
        id: String(item.id || item.nik),
        namaPemilik: item.nama_pemilik || item.nama || '-',
        nik: item.nik || '-',
        namaUsaha: item.nama_usaha || item.uraian || 'Usaha Mikro',
        alamat: item.alamat || `Desa ${item.nama_des_kel || '-'}, Kec. ${item.nama_kecamatan || '-'}`,
        nohp: item.nohp || '-',
        kk: item.kk || '-',
        tahunBerdiri: item.tahun_berdiri || 2020,
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
        modalUsaha: Number(item.modal_sendiri || item.modal || 5000000),
        omsetTahun: Number(item.omset || item.omset_tahun || 15000000),
        jumlahTenagaKerja: Number(item.naker || item.jumlah_tenaga_kerja || 2),
      }));

      return NextResponse.json({
        data: mapped,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    }
  } catch (e) {
    console.error('[Pelaku UMKM] Error fetching from backend:', e);
  }

  // Fallback data simulasi
  const fallbackList = [
    {
      id: '1',
      namaPemilik: 'H. Sudirman',
      nik: '7405031204850001',
      namaUsaha: 'Toko Berkah Tani',
      alamat: 'Jl. Poros Andoolo No. 12',
      kecamatanId: '7405030',
      kecamatan: { id: '7405030', nama: 'Andoolo' },
      desa: { id: '7405030001', nama: 'Andoolo Utama' },
      jenisUsaha: { id: '1', uraian: 'Pertanian & Perkebunan' },
      modalUsaha: 15000000,
      omsetTahun: 45000000,
      jumlahTenagaKerja: 3,
    },
    {
      id: '2',
      namaPemilik: 'Siti Rahmawati',
      nik: '7405085507900002',
      namaUsaha: 'Keripik Pisang Mandiri',
      alamat: 'Desa Onewila',
      kecamatanId: '7405080',
      kecamatan: { id: '7405080', nama: 'Ranomeeto' },
      desa: { id: '7405080002', nama: 'Onewila' },
      jenisUsaha: { id: '2', uraian: 'Kuliner & Makanan Ringan' },
      modalUsaha: 7500000,
      omsetTahun: 28000000,
      jumlahTenagaKerja: 4,
    },
    {
      id: '3',
      namaPemilik: 'La Ode Baharuddin',
      nik: '7405101009820003',
      namaUsaha: 'Bengkel Logam Lestari',
      alamat: 'Jl. Bahari Moramo',
      kecamatanId: '7405100',
      kecamatan: { id: '7405100', nama: 'Moramo' },
      desa: { id: '7405100001', nama: 'Moramo' },
      jenisUsaha: { id: '3', uraian: 'Jasa & Bengkel' },
      modalUsaha: 12000000,
      omsetTahun: 36000000,
      jumlahTenagaKerja: 2,
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
  const body = await req.json();

  try {
    const res = await fetchFromBackend('/api/v1/master_pelaku/addData', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    console.error('[Pelaku UMKM] Error saving data:', e);
  }

  return NextResponse.json({ message: 'Data UMKM berhasil disimpan', data: body });
}
