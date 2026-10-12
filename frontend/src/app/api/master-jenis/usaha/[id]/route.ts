import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';
import { masterJenisSchema, routeIdSchema } from '@/lib/api-schemas';
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
  const parsed = await parseJsonBody(req, masterJenisSchema, 16 * 1024);
  if (parsed.error) return parsed.error;

  try {
    const res = await fetchFromBackend('/api/v1/master_jenis_usaha/editData', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: JSON.stringify({ ...parsed.data, id: parsedId.data }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[Master Jenis Usaha] Error updating:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
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
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });

  try {
    const res = await fetchFromBackend('/api/v1/master_jenis_usaha/removeData', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: JSON.stringify({ id: parsedId.data }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[Master Jenis Usaha] Error deleting:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan Master Jenis Usaha tidak tersedia.' }, { status: 503 });
  }
}
