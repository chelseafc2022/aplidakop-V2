import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_STATISTIK_URL } from '@/lib/backend-client';

async function proxy(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ message: 'Silakan login terlebih dahulu.' }, { status: 401 });
  const { path = [] } = await context.params;
  const valid = req.method === 'GET'
    ? path.length === 0 || path.length === 1 || (path.length === 3 && path[1] === 'dokumen')
    : req.method === 'DELETE'
      ? path.length === 1
      : path.length === 2 && path[1] === 'verifikasi';
  if (!valid || path.some(part => !/^[a-zA-Z0-9_-]+$/.test(part))) return NextResponse.json({ message: 'Endpoint tidak ditemukan.' }, { status: 404 });
  try {
    const url = new URL(`${BACKEND_STATISTIK_URL}/api/v1/layanan_umkm/${path.map(encodeURIComponent).join('/')}`);
    for (const key of ['jenis', 'status', 'search', 'page']) {
      const value = req.nextUrl.searchParams.get(key);
      if (value) url.searchParams.set(key, value);
    }
    // Gunakan identitas pengguna; backend memeriksa role administrator dari database.
    const response = await fetch(url, {
      method: req.method, headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: req.method === 'POST' ? JSON.stringify(await req.json()) : undefined,
      cache: 'no-store', signal: req.signal,
    });
    if (path[1] === 'dokumen' && response.ok) {
      return new NextResponse(response.body, { headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': response.headers.get('content-disposition') || 'attachment',
        'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      } });
    }
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Layanan UMKM tidak dapat dihubungi.' }, { status: 503 });
  }
}
export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
