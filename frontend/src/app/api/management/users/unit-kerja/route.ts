import { NextRequest, NextResponse } from 'next/server';

import { fetchFromBackend } from '@/lib/backend-client';
import { requireAdministrator, safeBackendStatus, securityErrorResponse } from '@/lib/server-security';

export async function GET(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const instansiId = (request.nextUrl.searchParams.get('instansiId') || '').trim();
  if (!/^[\p{L}\p{N}._:@/-]{1,64}$/u.test(instansiId)) {
    return NextResponse.json({ message: 'ID instansi tidak valid.' }, { status: 400 });
  }

  try {
    const response = await fetchFromBackend('/api/v1/registrasiAplidakop/unitKerjaList', {
      method: 'POST',
      body: JSON.stringify({ instansi_id: instansiId }),
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal membaca daftar unit kerja.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('[Management Unit Kerja] Gagal membaca unit kerja.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan unit kerja tidak tersedia.' }, { status: 503 });
  }
}
