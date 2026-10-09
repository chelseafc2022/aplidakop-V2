import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

const allowedPeriods = new Set(['all', 'baseline', '2025', '2026']);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kecamatanId = (searchParams.get('kecamatanId') || '').trim().slice(0, 25);
  const requestedPeriod = (searchParams.get('periode') || searchParams.get('tahun') || 'all').trim();
  const periode = allowedPeriods.has(requestedPeriod) ? requestedPeriod : 'all';

  try {
    const backendRes = await fetchFromBackend('/api/v1/dinkop_index/dashboardSummary', {
      method: 'POST',
      body: JSON.stringify({ kecamatanId, periode }),
      cache: 'no-store',
    });
    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || 'Gagal membaca ringkasan dashboard.' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Dashboard Summary] Backend fetch error:', error);
    return NextResponse.json(
      { message: 'Layanan ringkasan dashboard tidak tersedia.' },
      { status: 503 },
    );
  }
}
