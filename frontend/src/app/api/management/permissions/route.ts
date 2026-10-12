import { NextRequest, NextResponse } from 'next/server';

import { permissionSchema } from '@/lib/api-schemas';
import { fetchFromBackend } from '@/lib/backend-client';
import { parseJsonBody, requireAdministrator, safeBackendStatus, securityErrorResponse } from '@/lib/server-security';

export async function POST(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const parsed = await parseJsonBody(request, permissionSchema, 512 * 1024);
  if (parsed.error) return parsed.error;

  try {
    const response = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/editData', {
      method: 'POST',
      body: JSON.stringify({
        form: { id: Number(parsed.data.roleId), uraian: parsed.data.roleName },
        list_menu: parsed.data.list_menu,
      }),
    });
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal menyimpan matriks hak akses.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json({ success: true, message: 'Matriks hak akses berhasil disimpan.' });
  } catch (error) {
    console.error('[Management Permissions] Operasi gagal.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan hak akses tidak tersedia.' }, { status: 503 });
  }
}
