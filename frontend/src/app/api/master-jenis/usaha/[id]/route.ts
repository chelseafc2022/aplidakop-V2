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
  const body = await req.json();

  try {
    const res = await fetchFromBackend('/api/v1/master_jenis_usaha/editData', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: JSON.stringify({ ...body, id }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[Master Jenis Usaha] Error updating:', e);
    return NextResponse.json({ message: 'Layanan Master Jenis Usaha tidak tersedia.' }, { status: 503 });
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
    const res = await fetchFromBackend('/api/v1/master_jenis_usaha/removeData', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[Master Jenis Usaha] Error deleting:', e);
    return NextResponse.json({ message: 'Layanan Master Jenis Usaha tidak tersedia.' }, { status: 503 });
  }
}
