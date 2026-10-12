import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';
import { securityErrorResponse } from '@/lib/server-security';

export async function GET(req: NextRequest) {
  try {
    const res = await fetchFromBackend('/api/v1/stat_pembiayaan_umkm/riwayat_penerima', {
      method: 'GET',
      signal: req.signal,
    });

    if (res.ok) {
      const json = await res.json();
      const list = json?.data || [];
      return NextResponse.json({
        data: list.map((item: any) => ({
          id: String(item.id),
          pelakuId: String(item.pelaku_id),
          tahun: Number(item.tahun),
          bantuTunai: item.bantu_tunai || '',
          bantuSarana: item.bantu_sarana || '',
          keterangan: item.keterangan || '',
        })),
      });
    }

    return NextResponse.json({ message: 'Gagal membaca riwayat penerima bantuan.' }, { status: res.status >= 400 && res.status < 500 ? res.status : 502 });
  } catch (error) {
    console.error('[Riwayat Penerima Bantuan] Error:', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan riwayat bantuan tidak tersedia.' }, { status: 503 });
  }
}
