import { NextRequest, NextResponse } from 'next/server';

import { fetchFromBackend } from '@/lib/backend-client';
import { requireAdministrator, safeBackendStatus, securityErrorResponse } from '@/lib/server-security';

export async function GET(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;

  try {
    const response = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/listAdd');
    const menus = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(menus)) {
      return NextResponse.json({ message: 'Gagal membaca struktur menu.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json(menus);
  } catch (error) {
    console.error('[Management Menus] Gagal membaca menu.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan menu tidak tersedia.' }, { status: 503 });
  }
}
