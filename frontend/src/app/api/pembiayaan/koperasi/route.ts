import { NextRequest, NextResponse } from 'next/server';

import { pembiayaanKoperasiSchema } from '@/lib/api-schemas';
import { fetchFromBackend } from '@/lib/backend-client';
import { parseJsonBody, securityErrorResponse } from '@/lib/server-security';

export async function GET(request: NextRequest) {
  const page = Math.max(1, Math.min(100_000, Number(request.nextUrl.searchParams.get('page') || 1) || 1));
  const limit = Math.max(1, Math.min(100, Number(request.nextUrl.searchParams.get('limit') || 50) || 50));

  try {
    const response = await fetchFromBackend('/api/v1/stat_pembiayaan_koperasi/view', {
      method: 'POST',
      body: JSON.stringify({
        page_limit: limit,
        data_ke: page,
        cari_value: '',
        pencarian: (request.nextUrl.searchParams.get('search') || '').trim().slice(0, 200),
        desa_id: '',
        tahun: (request.nextUrl.searchParams.get('tahun') || '').trim().slice(0, 4),
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { message: 'Gagal membaca data pembiayaan koperasi.' },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
      );
    }

    const list = Array.isArray(json?.data) ? json.data : [];
    return NextResponse.json(
      list.map((item: any) => ({
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
      })),
    );
  } catch (error) {
    console.error('[Pembiayaan Koperasi] Gagal membaca data.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan pembiayaan koperasi tidak tersedia.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, pembiayaanKoperasiSchema);
  if (parsed.error) return parsed.error;

  try {
    const response = await fetchFromBackend('/api/v1/stat_pembiayaan_koperasi/addData', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.status === false) {
      return NextResponse.json(
        { message: 'Gagal menyimpan data pembiayaan koperasi.' },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
      );
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Pembiayaan Koperasi] Gagal menyimpan data.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan pembiayaan koperasi tidak tersedia.' }, { status: 503 });
  }
}
