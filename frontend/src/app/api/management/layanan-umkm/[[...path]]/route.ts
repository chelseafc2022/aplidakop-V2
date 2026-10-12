import { NextRequest, NextResponse } from 'next/server';

import { boundedJsonObjectSchema } from '@/lib/api-schemas';
import { getBackendStatistikUrl } from '@/lib/backend-client';
import { parseJsonBody, requireAdministrator, safeBackendStatus } from '@/lib/server-security';

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;

  const { path = [] } = await context.params;
  const validPath = request.method === 'GET'
    ? path.length === 0 || path.length === 1 || (path.length === 3 && path[1] === 'dokumen')
    : request.method === 'DELETE'
      ? path.length === 1
      : path.length === 2 && path[1] === 'verifikasi';
  if (!validPath || path.some((part) => !/^[a-zA-Z0-9_-]{1,100}$/.test(part))) {
    return NextResponse.json({ message: 'Endpoint tidak ditemukan.' }, { status: 404 });
  }

  let body: string | undefined;
  if (request.method === 'POST') {
    const parsed = await parseJsonBody(request, boundedJsonObjectSchema, 256 * 1024);
    if (parsed.error) return parsed.error;
    body = JSON.stringify(parsed.data);
  }

  try {
    const url = new URL(`${getBackendStatistikUrl()}/api/v1/layanan_umkm/${path.map(encodeURIComponent).join('/')}`);
    for (const [key, maxLength] of [['jenis', 50], ['status', 50], ['search', 200], ['page', 10]] as const) {
      const value = request.nextUrl.searchParams.get(key)?.trim().slice(0, maxLength);
      if (value) url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      method: request.method,
      headers: { Authorization: authorization.authHeader, 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]),
    });

    if (path[1] === 'dokumen' && response.ok) {
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
          'Content-Disposition': response.headers.get('content-disposition') || 'attachment',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ message: 'Permintaan layanan UMKM gagal.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Layanan UMKM] Proxy gagal.', error);
    return NextResponse.json({ message: 'Layanan UMKM tidak dapat dihubungi.' }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
