import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  BackendAuthenticationError,
  BackendAuthorizationError,
  BackendConfigurationError,
  getBackendStatistikUrl,
} from '@/lib/backend-client';
import { isAdministratorRole } from '@/lib/auth-role';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const MAX_JSON_BYTES = 1024 * 1024;

export const identifierSchema = z.coerce.string().trim().min(1).max(64).regex(/^[\p{L}\p{N}._:@/-]+$/u);
export const shortTextSchema = z.string().trim().min(1).max(255);

export function clientAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (forwarded || request.headers.get('x-real-ip') || 'unknown').slice(0, 128);
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: Math.ceil(windowMs / 1000) };
  }
  current.count += 1;
  if (rateLimitStore.size > 10_000) {
    for (const [storedKey, value] of rateLimitStore) {
      if (value.resetAt <= now) rateLimitStore.delete(storedKey);
    }
  }
  return {
    allowed: current.count <= limit,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { message: 'Terlalu banyak permintaan. Silakan coba kembali nanti.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  );
}

export async function parseJsonBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
  maxBytes = MAX_JSON_BYTES,
): Promise<{ data: z.infer<T>; error?: never } | { data?: never; error: NextResponse }> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return {
      error: NextResponse.json({ message: 'Content-Type harus application/json.' }, { status: 415 }),
    };
  }

  try {
    const text = await request.text();
    if (!text || new TextEncoder().encode(text).byteLength > maxBytes) {
      return { error: NextResponse.json({ message: 'Payload kosong atau terlalu besar.' }, { status: 413 }) };
    }
    const result = schema.safeParse(JSON.parse(text));
    if (!result.success) {
      return { error: NextResponse.json({ message: 'Data permintaan tidak valid.' }, { status: 400 }) };
    }
    return { data: result.data };
  } catch {
    return { error: NextResponse.json({ message: 'Payload JSON tidak valid.' }, { status: 400 }) };
  }
}

export async function requireAdministrator(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ message: 'Sesi autentikasi diperlukan.' }, { status: 401 }) };
  }

  try {
    const response = await fetch(`${getBackendStatistikUrl()}/aplidakop_auth/me`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    const profile = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { error: NextResponse.json({ message: 'Sesi tidak valid atau sudah berakhir.' }, { status: 401 }) };
    }
    const roleName = String(profile.role?.nama || profile.profile?.menu_klp_uraian || '');
    if (!isAdministratorRole(roleName)) {
      return { error: NextResponse.json({ message: 'Operasi ini hanya dapat dilakukan administrator.' }, { status: 403 }) };
    }
    return { authHeader, profile };
  } catch (error) {
    console.error('[Authorization] Verifikasi administrator gagal.', error);
    return { error: NextResponse.json({ message: 'Layanan otorisasi tidak tersedia.' }, { status: 503 }) };
  }
}

export async function getRequesterRole(request: NextRequest): Promise<{ isAdministrator: boolean; roleName: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdministrator: false, roleName: '' };
  }

  try {
    const response = await fetch(`${getBackendStatistikUrl()}/aplidakop_auth/me`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return { isAdministrator: false, roleName: '' };
    const profile = await response.json().catch(() => ({}));
    const roleName = String(profile.role?.nama || profile.profile?.menu_klp_uraian || '');
    return { isAdministrator: isAdministratorRole(roleName), roleName };
  } catch {
    return { isAdministrator: false, roleName: '' };
  }
}

export function safeBackendStatus(status: number): number {
  if ([400, 401, 403, 404, 409, 413, 422, 429].includes(status)) return status;
  return status >= 500 ? 502 : 400;
}

export function backendFailure(message: string, status = 502): NextResponse {
  return NextResponse.json({ message }, { status: safeBackendStatus(status) });
}

export function securityErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof BackendAuthenticationError) {
    return NextResponse.json({ message: 'Sesi tidak valid atau sudah berakhir.' }, { status: 401 });
  }
  if (error instanceof BackendAuthorizationError) {
    return NextResponse.json({ message: 'Operasi ini hanya dapat dilakukan administrator.' }, { status: 403 });
  }
  if (error instanceof BackendConfigurationError) {
    console.error('[Configuration] Konfigurasi backend tidak valid.', error);
    return NextResponse.json({ message: 'Konfigurasi layanan belum lengkap.' }, { status: 503 });
  }
  return null;
}
