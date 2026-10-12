import { NextRequest, NextResponse } from 'next/server';

import { roleUpdateSchema, routeIdSchema } from '@/lib/api-schemas';
import { fetchFromBackend } from '@/lib/backend-client';
import { parseJsonBody, requireAdministrator, safeBackendStatus, securityErrorResponse } from '@/lib/server-security';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID role tidak valid.' }, { status: 400 });

  try {
    const response = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/listEdit', {
      method: 'POST',
      body: JSON.stringify({ menu_klp_id: parsedId.data }),
    });
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal membaca hak akses role.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('[Management Role Detail] Gagal membaca role.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan role tidak tersedia.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID role tidak valid.' }, { status: 400 });
  const parsed = await parseJsonBody(request, roleUpdateSchema, 512 * 1024);
  if (parsed.error) return parsed.error;

  try {
    const response = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/editData', {
      method: 'POST',
      body: JSON.stringify({
        form: { id: Number(parsedId.data), uraian: parsed.data.nama },
        list_menu: parsed.data.list_menu,
      }),
    });
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal memperbarui role.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json({ success: true, message: 'Role dan hak akses berhasil diperbarui.' });
  } catch (error) {
    console.error('[Management Role Detail] Gagal memperbarui role.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan role tidak tersedia.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID role tidak valid.' }, { status: 400 });

  try {
    const response = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/removeData', {
      method: 'POST',
      body: JSON.stringify({ id: Number(parsedId.data) }),
    });
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal menghapus role.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json({ success: true, message: 'Role berhasil dihapus.' });
  } catch (error) {
    console.error('[Management Role Detail] Gagal menghapus role.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan role tidak tersedia.' }, { status: 503 });
  }
}
