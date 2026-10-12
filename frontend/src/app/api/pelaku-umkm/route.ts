import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';
import { pelakuUmkmSchema } from '@/lib/api-schemas';
import { parseJsonBody, securityErrorResponse } from '@/lib/server-security';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Math.min(100_000, Number(searchParams.get('page') || 1) || 1));
  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 10) || 10));
  const search = (searchParams.get('search') || '').trim().slice(0, 200);
  const kecamatanId = (searchParams.get('kecamatanId') || '').trim().slice(0, 64);
  const desaId = (searchParams.get('desaId') || '').trim().slice(0, 64);
  const jenisUsahaId = (searchParams.get('jenisUsahaId') || '').trim().slice(0, 64);
  const periode = (searchParams.get('periode') || '').trim().slice(0, 20);
  const backendPeriode = periode === '2021-2024' ? 'baseline' : periode;

  try {
    const res = await fetchFromBackend('/api/v1/master_pelaku/view', {
      method: 'POST',
      signal: req.signal,
      body: JSON.stringify({
        page_limit: limit,
        data_ke: page,
        cari_value: kecamatanId,
        pencarian: search,
        desa_id: desaId,
        jenisusaha_id: jenisUsahaId,
        periode: backendPeriode,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const rawList = json?.data || [];
      const totalPages = Number(json?.jml_data) || 1;
      const total = typeof json?.total_data === 'number' ? json.total_data : totalPages * limit;

      const mapped = rawList.map((item: any) => {
        const tb = item.tahun_berdiri ? Number(item.tahun_berdiri) : 0;
        const tahunPendataan = Number(item.tahun_pendataan_aktif || item.tahun_pendataan || 2024);
        const isBaseline = tahunPendataan <= 2024;

        return {
          id: String(item.id || item.nik),
          namaPemilik: item.nama_pemilik || item.nama || '-',
          nik: item.nik || '-',
          namaUsaha: item.nama_usaha || item.uraian || 'Usaha Mikro',
          alamat: item.alamat || `Desa ${item.nama_des_kel || '-'}, Kec. ${item.nama_kecamatan || '-'}`,
          nohp: item.nohp || '-',
          kk: item.kk || '-',
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
      });

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
    return NextResponse.json(
      { message: 'Backend gagal membaca data pelaku UMKM.' },
      { status: res.status >= 400 ? res.status : 502 },
    );
  } catch (e) {
    console.error('[Pelaku UMKM] Error fetching from backend:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json(
      { message: 'Layanan data pelaku UMKM tidak tersedia.' },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody(req, pelakuUmkmSchema);
    if (parsed.error) return parsed.error;

    const res = await fetchFromBackend('/api/v1/master_pelaku/addData', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: 'Gagal menyimpan data ke database server.' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e) {
    console.error('[Pelaku UMKM] Error saving data:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data pelaku UMKM tidak tersedia.' }, { status: 503 });
  }
}
