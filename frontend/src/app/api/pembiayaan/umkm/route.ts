import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';
import { pembiayaanUmkmSchema } from '@/lib/api-schemas';
import { parseJsonBody, securityErrorResponse } from '@/lib/server-security';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Math.min(100_000, Number(searchParams.get('page') || 1) || 1));
  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 10) || 10));
  const search = (searchParams.get('search') || '').trim().slice(0, 200);
  const tahun = (searchParams.get('tahun') || '').trim().slice(0, 10);
  const kecamatanId = (searchParams.get('kecamatanId') || '').trim().slice(0, 64);
  const desaId = (searchParams.get('desaId') || '').trim().slice(0, 64);
  const jenisUsahaId = (searchParams.get('jenisUsahaId') || '').trim().slice(0, 64);
  const jenisBantuan = (searchParams.get('jenisBantuan') || '').trim().slice(0, 32);

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

    return NextResponse.json(
      { message: 'Gagal mengambil data bantuan UMKM.' },
      { status: res.status >= 400 ? res.status : 500 }
    );
  } catch (e) {
    console.error('[Bantuan/Pembiayaan UMKM] Error fetching:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data bantuan UMKM tidak tersedia.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody(req, pembiayaanUmkmSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const res = await fetchFromBackend('/api/v1/stat_pembiayaan_umkm/addData', {
      method: 'POST',
      body: JSON.stringify({
        pelaku_id: body.pelakuId,
        tahun: body.tahun,
        bantu_tunai: body.bantuTunai,
        bantu_sarana: body.bantuSarana,
        keterangan: body.keterangan,
      }),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: 'Gagal menyimpan data bantuan UMKM.' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e) {
    console.error('[Bantuan/Pembiayaan UMKM] Error saving:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data bantuan UMKM tidak tersedia.' }, { status: 503 });
  }
}
