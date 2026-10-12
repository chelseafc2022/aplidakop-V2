import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';
import { pelakuUmkmSchema, routeIdSchema } from '@/lib/api-schemas';
import { parseJsonBody, securityErrorResponse } from '@/lib/server-security';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });
  try {
    const parsed = await parseJsonBody(req, pelakuUmkmSchema);
    if (parsed.error) return parsed.error;

    const res = await fetchFromBackend('/api/v1/master_pelaku/editData', {
      method: 'POST',
      body: JSON.stringify({ ...parsed.data, id: parsedId.data }),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: 'Gagal memperbarui data di database server.' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e) {
    console.error('[Pelaku UMKM] Error updating:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data pelaku UMKM tidak tersedia.' }, { status: 503 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });

  try {
    const res = await fetchFromBackend('/api/v1/master_pelaku/removeData', {
      method: 'POST',
      body: JSON.stringify({ id: parsedId.data }),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: 'Gagal menghapus data di database server.' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e) {
    console.error('[Pelaku UMKM] Error removing:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data pelaku UMKM tidak tersedia.' }, { status: 503 });
  }
}
