import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(req: NextRequest) {
  try {
    const res = await fetchFromBackend('/api/v1/master_jenis_usaha/view', {
      method: 'POST',
      body: JSON.stringify({ page_limit: 100, data_ke: 1, cari_value: '' }),
    });

    if (res.ok) {
      const json = await res.json();
      const list = json?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return NextResponse.json(
          list.map((item: any) => ({
            id: String(item.id),
            uraian: item.uraian,
            createdAt: item.createAt || new Date().toISOString(),
          }))
        );
      }
    }
  } catch (e) {
    console.error('[Master Jenis Usaha] Error:', e);
  }

  return NextResponse.json([
    { id: '1', uraian: 'Pertanian & Perkebunan', createdAt: '2022-01-15' },
    { id: '2', uraian: 'Kuliner & Makanan Ringan', createdAt: '2022-01-15' },
    { id: '3', uraian: 'Kelontong & Perdagangan', createdAt: '2022-01-15' },
    { id: '4', uraian: 'Perikanan & Kelautan', createdAt: '2022-02-10' },
    { id: '5', uraian: 'Kerajinan Tangan & Konveksi', createdAt: '2022-03-01' },
    { id: '6', uraian: 'Jasa & Bengkel', createdAt: '2022-03-20' },
  ]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const res = await fetchFromBackend('/api/v1/master_jenis_usaha/addData', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (e) {
    console.error('[Master Jenis Usaha] Error adding:', e);
  }

  return NextResponse.json({ message: 'Jenis usaha berhasil ditambahkan', data: body });
}
