import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instansiId = searchParams.get('instansiId') || '';

  try {
    const res = await fetchFromBackend('/api/v1/registrasiAplidakop/unitKerjaList', {
      method: 'POST',
      body: JSON.stringify({ instansi_id: instansiId }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data || []);
    }
  } catch (err) {
    console.error('[API Unit Kerja List] Error:', err);
  }

  // Fallback sub-unit kerja
  return NextResponse.json([
    { id: '1', nama: 'Bidang Pemberdayaan dan Pengembangan UMKM', instansi_id: '1' },
    { id: '2', nama: 'Bidang Kelembagaan dan Pengawasan Koperasi', instansi_id: '1' },
    { id: '3', nama: 'Sekretariat Dinas Koperasi', instansi_id: '1' },
  ]);
}
