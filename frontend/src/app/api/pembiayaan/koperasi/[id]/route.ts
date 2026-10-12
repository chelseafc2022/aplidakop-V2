import { NextRequest, NextResponse } from 'next/server';

import { routeIdSchema } from '@/lib/api-schemas';
import { fetchFromBackend } from '@/lib/backend-client';
import { securityErrorResponse } from '@/lib/server-security';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });

  try {
    const response = await fetchFromBackend('/api/v1/stat_pembiayaan_koperasi/removeData', {
      method: 'POST',
      body: JSON.stringify({ id: parsedId.data }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.status === false) {
      return NextResponse.json(
        { message: 'Gagal menghapus data pembiayaan koperasi.' },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Pembiayaan Koperasi] Gagal menghapus data.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan pembiayaan koperasi tidak tersedia.' }, { status: 503 });
  }
}
