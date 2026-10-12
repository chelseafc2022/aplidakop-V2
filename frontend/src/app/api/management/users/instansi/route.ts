import { NextRequest, NextResponse } from 'next/server';

import { fetchFromBackend } from '@/lib/backend-client';
import { requireAdministrator, safeBackendStatus, securityErrorResponse } from '@/lib/server-security';

export async function GET(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;

  try {
    const response = await fetchFromBackend('/api/v1/registrasiAplidakop/instansiList');
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal membaca daftar instansi.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('[Management Instansi] Gagal membaca instansi.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan instansi tidak tersedia.' }, { status: 503 });
  }
}
