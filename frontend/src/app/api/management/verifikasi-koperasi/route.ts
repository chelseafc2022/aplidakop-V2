import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_STATISTIK_URL } from '@/lib/backend-client';
import { isAdministratorRole } from '@/lib/auth-role';

async function authorize(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  const profileRes = await fetch(`${BACKEND_STATISTIK_URL}/aplidakop_auth/me`, {
    headers: { Authorization: authHeader }, cache: 'no-store',
  });
  const profile = await profileRes.json().catch(() => ({}));
  const roleName = String(profile.role?.nama || profile.profile?.menu_klp_uraian || '');
  if (!profileRes.ok || !isAdministratorRole(roleName)) {
    return { error: NextResponse.json({ message: 'Menu ini hanya dapat diakses administrator.' }, { status: profileRes.ok ? 403 : profileRes.status }) };
  }
  return { authHeader };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (auth.error) return auth.error;
    const url = new URL(`${BACKEND_STATISTIK_URL}/api/v1/verifikasi_koperasi`);
    for (const key of ['page', 'limit', 'search', 'status', 'issueType']) {
      const value = req.nextUrl.searchParams.get(key);
      if (value) url.searchParams.set(key, value);
    }
    const response = await fetch(url, { headers: { Authorization: auth.authHeader! }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Verifikasi Koperasi] Gagal membaca antrean:', error);
    return NextResponse.json({ message: 'Layanan verifikasi koperasi tidak tersedia.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (auth.error) return auth.error;
    const body = await req.json();
    const endpoint = body.mode === 'flag' ? 'flag' : 'resolve';
    const response = await fetch(`${BACKEND_STATISTIK_URL}/api/v1/verifikasi_koperasi/${endpoint}`, {
      method: 'POST',
      headers: { Authorization: auth.authHeader!, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Verifikasi Koperasi] Gagal memproses antrean:', error);
    return NextResponse.json({ message: 'Layanan verifikasi koperasi tidak tersedia.' }, { status: 503 });
  }
}
