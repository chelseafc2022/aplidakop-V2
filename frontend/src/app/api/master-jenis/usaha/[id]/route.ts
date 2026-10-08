import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  try {
    const res = await fetchFromBackend('/api/v1/master_jenis_usaha/editData', {
      method: 'POST',
      body: JSON.stringify({ ...body, id }),
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (e) {
    console.error('[Master Jenis Usaha] Error updating:', e);
  }

  return NextResponse.json({ message: 'Jenis usaha berhasil diperbarui' });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetchFromBackend('/api/v1/master_jenis_usaha/removeData', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (e) {
    console.error('[Master Jenis Usaha] Error deleting:', e);
  }

  return NextResponse.json({ message: 'Jenis usaha berhasil dihapus' });
}
