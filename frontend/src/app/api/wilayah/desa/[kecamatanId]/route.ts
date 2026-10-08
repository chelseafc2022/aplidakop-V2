import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kecamatanId: string }> }
) {
  const { kecamatanId } = await params;

  try {
    const res = await fetchFromBackend('/api/v1/master_pelaku/list', {
      method: 'POST',
      body: JSON.stringify({ kecamatan: kecamatanId }),
    });

    if (res.ok) {
      const json = await res.json();
      const list = json?.data || json || [];
      if (Array.isArray(list) && list.length > 0) {
        return NextResponse.json(
          list.map((d: any) => ({
            id: String(d.des_kel_id || d.id),
            nama: d.nama_des_kel || d.nama || 'Desa/Kelurahan',
          }))
        );
      }
    }
  } catch (e) {
    console.error('[Desa] Error fetching from backend:', e);
  }

  // Fallback default desa
  return NextResponse.json([
    { id: `${kecamatanId}001`, nama: 'Desa Mandiri 1' },
    { id: `${kecamatanId}002`, nama: 'Desa Sejahtera 2' },
    { id: `${kecamatanId}003`, nama: 'Kelurahan Pusat' },
  ]);
}
