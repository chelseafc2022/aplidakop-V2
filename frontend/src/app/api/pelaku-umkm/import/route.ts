import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { records, tahun } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { status: false, message: 'Daftar data impor (records) kosong atau tidak valid.' },
        { status: 400 }
      );
    }

    const res = await fetchFromBackend('/api/v1/master_pelaku/batchImport', {
      method: 'POST',
      body: JSON.stringify({
        records,
        tahun: tahun || '2025',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Jika backend mengembalikan error status
    const errData = await res.json().catch(() => null);
    return NextResponse.json(
      {
        status: false,
        message: errData?.message || 'Gagal memproses batch import di server database.',
        error: errData,
      },
      { status: res.status }
    );
  } catch (err: any) {
    console.error('[API Pelaku UMKM Import] Error:', err);
    return NextResponse.json(
      {
        status: false,
        message: 'Terjadi kesalahan sistem saat memproses impor data.',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
