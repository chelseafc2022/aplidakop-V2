import { NextRequest, NextResponse } from 'next/server';

import { getBackendStatistikUrl } from '@/lib/backend-client';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      await fetch(`${getBackendStatistikUrl()}/aplidakop_auth/logout`, {
        method: 'POST',
        headers: { Authorization: authHeader },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(5_000),
      });
    } catch (error) {
      console.warn('[Auth Logout] Backend tidak mendukung pencabutan sesi.', error);
    }
  }

  const response = NextResponse.json({ message: 'Logout berhasil.' });
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Clear-Site-Data', '"cache", "storage"');
  return response;
}
