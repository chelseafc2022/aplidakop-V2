import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();

    const res = await fetchFromBackend('/api/v1/master_koperasi/editData', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: JSON.stringify({ ...body, id }),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: data?.message || 'Gagal memperbarui data koperasi di server' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e: any) {
    console.error('[Koperasi] Error updating:', e);
    return NextResponse.json(
      { message: 'Koneksi ke backend gagal: ' + (e?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  try {
    const res = await fetchFromBackend('/api/v1/master_koperasi/removeData', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: data?.message || 'Gagal menghapus data koperasi di server' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e: any) {
    console.error('[Koperasi] Error removing:', e);
    return NextResponse.json(
      { message: 'Koneksi ke backend gagal: ' + (e?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
