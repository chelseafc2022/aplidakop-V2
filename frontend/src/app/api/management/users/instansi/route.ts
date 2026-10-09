import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET() {
  try {
    const res = await fetchFromBackend('/api/v1/registrasiAplidakop/instansiList');
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data || []);
    }
  } catch (err) {
    console.error('[API Instansi List] Error:', err);
  }

  // Fallback instansi
  return NextResponse.json([
    { id: '1', nama: 'Dinas Koperasi dan Usaha Kecil Menengah' },
    { id: '2', nama: 'Dinas Komunikasi, Informatika dan Persandian' },
    { id: '3', nama: 'Badan Perencanaan Pembangunan Daerah' },
  ]);
}
