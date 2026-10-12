import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';
import { koperasiSchema, routeIdSchema } from '@/lib/api-schemas';
import { parseJsonBody, securityErrorResponse } from '@/lib/server-security';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });
  try {
    const parsed = await parseJsonBody(req, koperasiSchema);
    if (parsed.error) return parsed.error;

    const res = await fetchFromBackend('/api/v1/master_koperasi/editData', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: JSON.stringify({ ...parsed.data, id: parsedId.data }),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: 'Gagal memperbarui data koperasi di server.' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e) {
    console.error('[Koperasi] Error updating:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data koperasi tidak tersedia.' }, { status: 503 });
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
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });

  try {
    const res = await fetchFromBackend('/api/v1/master_koperasi/removeData', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: JSON.stringify({ id: parsedId.data }),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: 'Gagal menghapus data koperasi di server.' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e) {
    console.error('[Koperasi] Error removing:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data koperasi tidak tersedia.' }, { status: 503 });
  }
}
