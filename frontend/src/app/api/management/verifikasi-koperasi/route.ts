import { NextRequest, NextResponse } from 'next/server';

import { verificationSchema } from '@/lib/api-schemas';
import { getBackendStatistikUrl } from '@/lib/backend-client';
import { parseJsonBody, requireAdministrator, safeBackendStatus } from '@/lib/server-security';

export async function GET(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;

  try {
    const url = new URL(`${getBackendStatistikUrl()}/api/v1/verifikasi_koperasi`);
    for (const [key, maxLength] of [['page', 10], ['limit', 3], ['search', 200], ['status', 50], ['issueType', 50]] as const) {
      const value = request.nextUrl.searchParams.get(key)?.trim().slice(0, maxLength);
      if (value) url.searchParams.set(key, value);
    }
    const response = await fetch(url, {
      headers: { Authorization: authorization.authHeader },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal membaca antrean verifikasi.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Verifikasi Koperasi] Gagal membaca antrean.', error);
    return NextResponse.json({ message: 'Layanan verifikasi koperasi tidak tersedia.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const parsed = await parseJsonBody(request, verificationSchema, 256 * 1024);
  if (parsed.error) return parsed.error;
  const endpoint = 'mode' in parsed.data && parsed.data.mode === 'flag' ? 'flag' : 'resolve';

  try {
    const response = await fetch(`${getBackendStatistikUrl()}/api/v1/verifikasi_koperasi/${endpoint}`, {
      method: 'POST',
      headers: { Authorization: authorization.authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal memproses verifikasi koperasi.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Verifikasi Koperasi] Gagal memproses antrean.', error);
    return NextResponse.json({ message: 'Layanan verifikasi koperasi tidak tersedia.' }, { status: 503 });
  }
}
