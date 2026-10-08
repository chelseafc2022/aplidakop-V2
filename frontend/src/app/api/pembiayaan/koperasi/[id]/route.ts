import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetchFromBackend('/api/v1/stat_pembiayaan_koperasi/removeData', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (e) {
    console.error('[Pembiayaan Koperasi] Error deleting:', e);
  }

  return NextResponse.json({ message: 'Data pembiayaan koperasi berhasil dihapus' });
}
