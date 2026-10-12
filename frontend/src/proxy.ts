import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { openSession, SESSION_COOKIE_NAME } from '@/lib/session';

const limiter = new Map<string, { count: number; resetAt: number }>();
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const PUBLIC_API_PATHS = new Set(['/api/auth/login', '/api/auth/logout']);

function requestIp(request: NextRequest): string {
  if (process.env.TRUST_PROXY_HEADERS !== 'true') return 'untrusted-proxy';
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  ).slice(0, 128);
}

function takeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = limiter.get(key);
  if (!current || current.resetAt <= now) {
    limiter.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: Math.ceil(windowMs / 1000) };
  }
  current.count += 1;
  if (limiter.size > 10_000) {
    for (const [storedKey, entry] of limiter) {
      if (entry.resetAt <= now) limiter.delete(storedKey);
    }
  }
  return {
    allowed: current.count <= limit,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

function isSameOrigin(request: NextRequest): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const configuredOrigin = process.env.APP_ORIGIN?.trim();
    if (configuredOrigin) return origin === configuredOrigin;
    return originUrl.host === request.headers.get('host');
  } catch {
    return false;
  }
}

function apiError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json(
    { message },
    { status, headers: { 'Cache-Control': 'no-store', ...headers } },
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');
  const isUnsafe = !SAFE_METHODS.has(request.method);

  if (isApi) {
    const isLogin = pathname === '/api/auth/login';
    const rate = takeRateLimit(
      `${isLogin ? 'login' : isUnsafe ? 'write' : 'read'}:${requestIp(request)}`,
      isLogin ? 10 : isUnsafe ? 60 : 300,
      isLogin ? 15 * 60_000 : 60_000,
    );
    if (!rate.allowed) {
      return apiError('Terlalu banyak permintaan. Silakan coba kembali nanti.', 429, {
        'Retry-After': String(rate.retryAfter),
      });
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    const maxBytes = pathname === '/api/pelaku-umkm/import' ? 2 * 1024 * 1024 : 1024 * 1024;
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return apiError('Payload permintaan terlalu besar.', 413);
    }
    if (isUnsafe && !isSameOrigin(request)) {
      return apiError('Permintaan lintas situs ditolak.', 403);
    }
    if (
      isUnsafe &&
      contentLength > 0 &&
      !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')
    ) {
      return apiError('Content-Type harus application/json.', 415);
    }
  }

  const encryptedSession = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await openSession(encryptedSession);

  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/' || pathname === '/landing') {
    return NextResponse.redirect(new URL(session ? '/dashboard' : '/login', request.url));
  }

  const protectedApi = isApi && !PUBLIC_API_PATHS.has(pathname);
  const protectedPage = !isApi && pathname !== '/login';
  if ((protectedApi || protectedPage) && !session) {
    if (protectedApi) {
      const response = apiError('Sesi tidak valid atau sudah berakhir.', 401);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.delete('authorization');
  if (session) forwardedHeaders.set('authorization', `Bearer ${session.accessToken}`);

  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  if (isApi) response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif)$).*)'],
};
