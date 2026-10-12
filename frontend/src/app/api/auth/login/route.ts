import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getBackendStatistikUrl } from '@/lib/backend-client';
import {
  checkRateLimit,
  clientAddress,
  parseJsonBody,
  rateLimitResponse,
} from '@/lib/server-security';
import { sealSession, SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/session';

const loginSchema = z.object({
  username: z.string().trim().min(3).max(100),
  password: z.string().min(8).max(256),
}).strict();

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, loginSchema, 16 * 1024);
  if (parsed.error) return parsed.error;

  const { username, password } = parsed.data;
  const usernameLimit = checkRateLimit(
    `login-account:${clientAddress(request)}:${username.toLowerCase()}`,
    5,
    15 * 60_000,
  );
  if (!usernameLimit.allowed) return rateLimitResponse(usernameLimit.retryAfter);

  try {
    const backendResponse = await fetch(`${getBackendStatistikUrl()}/aplidakop_auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const data = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok || typeof data.token !== 'string') {
      const status = backendResponse.status === 429 ? 429 : 401;
      return NextResponse.json(
        { message: status === 429 ? 'Terlalu banyak percobaan login.' : 'Username atau kata sandi salah.' },
        { status },
      );
    }

    const profile = data.profile || {};
    const details = profile.profile || {};
    const user = {
      id: String(profile._id || ''),
      username: String(profile.username || username),
      nama: String(details.nama || details.username || profile.username || username),
      email: details.email ? String(details.email) : undefined,
      nip: details.nip ? String(details.nip) : undefined,
      hp: details.hp ? String(details.hp) : undefined,
      instansiNama: details.instansi_nama ? String(details.instansi_nama) : undefined,
      unitKerjaNama: details.unit_kerja_nama ? String(details.unit_kerja_nama) : undefined,
      roleId: String(details.menu_klp || data.role?.id || ''),
      role: {
        id: String(data.role?.id || details.menu_klp || ''),
        nama: String(data.role?.nama || details.menu_klp_uraian || 'Tanpa Role'),
        permissions: Array.isArray(data.role?.permissions) ? data.role.permissions : [],
      },
    };

    const encryptedSession = await sealSession(data.token);
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE_NAME, encryptedSession, sessionCookieOptions);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('[Auth Login] Proses login gagal.', error);
    return NextResponse.json(
      { message: 'Layanan autentikasi tidak tersedia.' },
      { status: 503 },
    );
  }
}
