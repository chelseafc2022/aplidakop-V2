import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 10);
  const search = searchParams.get('search') || '';
  const tahun = searchParams.get('tahun') || '';
  const kecamatanId = searchParams.get('kecamatanId') || '';
  const desaId = searchParams.get('desaId') || '';
  const jenisUsahaId = searchParams.get('jenisUsahaId') || '';
  const jenisBantuan = searchParams.get('jenisBantuan') || '';

  try {
    const res = await fetchFromBackend('/api/v1/stat_pembiayaan_umkm/view', {
      method: 'POST',
      signal: req.signal,
      body: JSON.stringify({
        page_limit: limit,
        data_ke: page,
        pencarian: search,
        tahun: tahun === 'all' ? '' : tahun,
        cari_value: kecamatanId === 'all' ? '' : kecamatanId,
        desa_id: desaId === 'all' ? '' : desaId,
        jenisusaha_id: jenisUsahaId === 'all' ? '' : jenisUsahaId,
        jenis_bantuan: jenisBantuan === 'all' ? '' : jenisBantuan,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const rawList = json?.data || [];
      const totalPages = Number(json?.jml_data) || 1;
      const total = typeof json?.total === 'number' ? json.total : rawList.length;

      const mapped = rawList.map((item: any) => {
        const desa = item.nama_des_kel || '';
        const kec = item.nama_kecamatan || '';
        const alamat = [desa ? `Desa ${desa}` : '', kec ? `Kec. ${kec}` : ''].filter(Boolean).join(', ') || '-';

        return {
          id: String(item.id || item.idx),
          pelakuId: String(item.pelaku_id || item.master_pelaku_id || ''),
          namaPemilik: item.nama_pemilik || '-',
          nik: item.nik || '-',
          kk: item.kk || '-',
          nohp: item.nohp || '-',
          namaUsaha: item.nama_usaha || '-',
          alamat,
          kecamatan: item.nama_kecamatan || '-',
          desa: item.nama_des_kel || '-',
          jenisUsaha: item.jenis_usaha_nama || '-',
          tahun: Number(item.tahun) || 2024,
          bantuTunai: item.bantu_tunai || '',
          bantuSarana: item.bantu_sarana || '',
          keterangan: item.keterangan || '-',
          createAt: item.createAt || null,
        };
      });

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

    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: err.message || 'Gagal mengambil data bantuan UMKM' },
      { status: res.status >= 400 ? res.status : 500 }
    );
  } catch (e: any) {
    console.error('[Bantuan/Pembiayaan UMKM] Error fetching:', e);
    return NextResponse.json(
      { message: 'Gagal menghubungi server database: ' + (e?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetchFromBackend('/api/v1/stat_pembiayaan_umkm/addData', {
      method: 'POST',
      body: JSON.stringify({
        pelaku_id: body.pelakuId || body.pelaku_id,
        tahun: body.tahun,
        bantu_tunai: body.bantuTunai !== undefined ? body.bantuTunai : body.bantu_tunai,
        bantu_sarana: body.bantuSarana !== undefined ? body.bantuSarana : body.bantu_sarana,
        keterangan: body.keterangan,
      }),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: data?.message || 'Gagal menyimpan data bantuan UMKM' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e: any) {
    console.error('[Bantuan/Pembiayaan UMKM] Error saving:', e);
    return NextResponse.json(
      { message: 'Koneksi ke backend gagal: ' + (e?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
