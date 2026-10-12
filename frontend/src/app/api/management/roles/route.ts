import { NextRequest, NextResponse } from 'next/server';

import { roleCreateSchema } from '@/lib/api-schemas';
import { fetchFromBackend } from '@/lib/backend-client';
import { parseJsonBody, requireAdministrator, safeBackendStatus, securityErrorResponse } from '@/lib/server-security';

export async function GET(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;

  try {
    const response = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/view', {
      method: 'POST',
      body: JSON.stringify({ page_limit: 100, data_ke: 1, cari_value: '' }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal membaca daftar role.' }, { status: safeBackendStatus(response.status) });
    }
    const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    return NextResponse.json(list.map((role: any) => ({
      id: String(role.id),
      nama: role.uraian || role.kelompok || role.nama || 'Role tanpa nama',
      keterangan: role.keterangan || '',
    })));
  } catch (error) {
    console.error('[Management Roles] Gagal membaca role.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan role tidak tersedia.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const parsed = await parseJsonBody(request, roleCreateSchema, 512 * 1024);
  if (parsed.error) return parsed.error;

  try {
    let listMenu = parsed.data.list_menu;
    if (!listMenu?.length) {
      const menuResponse = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/listAdd');
      if (!menuResponse.ok) {
        return NextResponse.json({ message: 'Template hak akses tidak tersedia.' }, { status: safeBackendStatus(menuResponse.status) });
      }
      listMenu = await menuResponse.json();
    }
    const response = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/addData', {
      method: 'POST',
      body: JSON.stringify({ form: { uraian: parsed.data.nama }, list_menu: listMenu }),
    });
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal membuat role.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json({ success: true, message: 'Role baru berhasil dibuat.' });
  } catch (error) {
    console.error('[Management Roles] Gagal membuat role.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan role tidak tersedia.' }, { status: 503 });
  }
}
