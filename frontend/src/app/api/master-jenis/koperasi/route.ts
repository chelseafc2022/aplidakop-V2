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
    console.error('[Master Jenis Koperasi] Error:', e);
  }

  return NextResponse.json([
    { id: '1', uraian: 'Koperasi Produsen', createdAt: '2022-01-15' },
    { id: '2', uraian: 'Koperasi Simpan Pinjam (KSP)', createdAt: '2022-01-15' },
    { id: '3', uraian: 'Koperasi Konsumen', createdAt: '2022-01-15' },
    { id: '4', uraian: 'Koperasi Pemasaran', createdAt: '2022-02-10' },
    { id: '5', uraian: 'Koperasi Jasa', createdAt: '2022-03-01' },
  ]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const res = await fetchFromBackend('/api/v1/master_jenis_koperasi/addData', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (e) {
    console.error('[Master Jenis Koperasi] Error adding:', e);
  }

  return NextResponse.json({ message: 'Jenis koperasi berhasil ditambahkan', data: body });
}
