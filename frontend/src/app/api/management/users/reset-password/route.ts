import { NextRequest, NextResponse } from 'next/server';

import { resetPasswordSchema } from '@/lib/api-schemas';
import { fetchFromBackend } from '@/lib/backend-client';
import { parseJsonBody, requireAdministrator, safeBackendStatus, securityErrorResponse } from '@/lib/server-security';

export async function POST(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const parsed = await parseJsonBody(request, resetPasswordSchema, 16 * 1024);
  if (parsed.error) return parsed.error;

  try {
    const response = await fetchFromBackend('/api/v1/registrasiAplidakop/editDataPass', {
      method: 'POST',
      body: JSON.stringify({ id: parsed.data.userId, password: parsed.data.password }),
    });
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal mengubah kata sandi pengguna.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json({ success: true, message: 'Kata sandi pengguna berhasil diubah.' });
  } catch (error) {
    console.error('[Reset Password] Operasi gagal.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan pengguna tidak tersedia.' }, { status: 503 });
  }
}
