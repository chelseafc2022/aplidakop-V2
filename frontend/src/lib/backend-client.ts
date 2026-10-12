import 'server-only';

import { headers as requestHeaders } from 'next/headers';

import { isAdministratorRole } from '@/lib/auth-role';

const DEFAULT_TIMEOUT_MS = 15_000;

export class BackendConfigurationError extends Error {}
export class BackendAuthenticationError extends Error {}
export class BackendAuthorizationError extends Error {}

export function getBackendStatistikUrl(): string {
  const configuredUrl = process.env.BACKEND_STATISTIK_URL?.trim();
  if (!configuredUrl) {
    throw new BackendConfigurationError('BACKEND_STATISTIK_URL belum dikonfigurasi.');
  }

  const url = new URL(configuredUrl);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new BackendConfigurationError('BACKEND_STATISTIK_URL harus menggunakan HTTP atau HTTPS.');
  }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new BackendConfigurationError('BACKEND_STATISTIK_URL wajib menggunakan HTTPS di production.');
  }

  return url.toString().replace(/\/$/, '');
}

function isPrivilegedBackendPath(path: string): boolean {
  if (/^\/api\/v1\/(?:registrasiAplidakop|kelompokUsersAplidakop)(?:\/|$)/.test(path)) {
    return true;
  }

  return /\/(?:addData|editData|editDataPass|removeData|batchImport)$/.test(path);
}

async function assertAdministrator(authHeader: string): Promise<void> {
  const response = await fetch(`${getBackendStatistikUrl()}/aplidakop_auth/me`, {
    headers: { Authorization: authHeader },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (response.status === 401 || response.status === 403) {
    throw new BackendAuthenticationError('Sesi tidak valid atau sudah berakhir.');
  }
  if (!response.ok) {
    throw new Error('Layanan otorisasi backend tidak tersedia.');
  }

  const profile = await response.json().catch(() => ({}));
  const roleName = String(profile.role?.nama || profile.profile?.menu_klp_uraian || '');
  if (!isAdministratorRole(roleName)) {
    throw new BackendAuthorizationError('Operasi ini hanya dapat dilakukan administrator.');
  }
}

export async function fetchFromBackend(path: string, options: RequestInit = {}): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${getBackendStatistikUrl()}${normalizedPath}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let authHeader = headers.get('Authorization');
  if (!authHeader) {
    const incomingHeaders = await requestHeaders();
    authHeader = incomingHeaders.get('authorization');
  }

  if (!authHeader?.startsWith('Bearer ') || authHeader.length > 16_384) {
    throw new BackendAuthenticationError('Sesi autentikasi diperlukan.');
  }
  headers.set('Authorization', authHeader);

  if (isPrivilegedBackendPath(normalizedPath)) {
    await assertAdministrator(authHeader);
  }

  const timeoutMs = Number(process.env.BACKEND_REQUEST_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const timeoutSignal = AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;

  try {
    return await fetch(url, {
      ...options,
      headers,
      signal,
      redirect: 'error',
      cache: options.cache || 'no-store',
    });
  } catch (error) {
    console.error(`[BackendStatistik] Request gagal untuk path ${normalizedPath}.`, error);
    throw error;
  }
}
