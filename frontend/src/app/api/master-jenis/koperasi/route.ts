import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(req: NextRequest) {
  try {
    const res = await fetchFromBackend('/api/v1/master_jenis_koperasi/view', {
      method: 'POST',
      body: JSON.stringify({ page_limit: 100, data_ke: 1, cari_value: '' }),
    });

    if (res.ok) {
      const json = await res.json();
      const list = json?.data || [];
      if (Array.isArray(list)) {
        return NextResponse.json(
          list.map((item: any) => ({
            id: String(item.id),
            uraian: item.uraian,
            koperasiCount: Number(item.koperasi_count || 0),
            createdAt: item.createAt || new Date().toISOString(),
          }))
        );
      }
    }
    const error = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: error.message || 'Gagal membaca Master Jenis Koperasi.' },
      { status: res.status >= 400 ? res.status : 502 },
    );
  } catch (e) {
    console.error('[Master Jenis Koperasi] Error:', e);
    return NextResponse.json({ message: 'Layanan Master Jenis Koperasi tidak tersedia.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();

  try {
    const res = await fetchFromBackend('/api/v1/master_jenis_koperasi/addData', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[Master Jenis Koperasi] Error adding:', e);
    return NextResponse.json({ message: 'Layanan Master Jenis Koperasi tidak tersedia.' }, { status: 503 });
  }
}
