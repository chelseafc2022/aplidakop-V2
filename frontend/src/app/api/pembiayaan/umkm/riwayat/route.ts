import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

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

    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('[Riwayat Penerima Bantuan] Error:', error);
    return NextResponse.json({ data: [] });
  }
}
