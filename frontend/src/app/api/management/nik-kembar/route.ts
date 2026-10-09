import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_STATISTIK_URL } from '@/lib/backend-client';
import { isAdministratorRole } from '@/lib/auth-role';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profileRes = await fetch(`${BACKEND_STATISTIK_URL}/aplidakop_auth/me`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });
    const profile = await profileRes.json();
    const roleName = String(profile.role?.nama || profile.profile?.menu_klp_uraian || '');

    if (!profileRes.ok || !isAdministratorRole(roleName)) {
      return NextResponse.json(
        { message: 'Menu ini hanya dapat diakses administrator.' },
        { status: profileRes.ok ? 403 : profileRes.status },
      );
    }

    const backendUrl = new URL(`${BACKEND_STATISTIK_URL}/api/v1/import_umkm_nik_kembar`);
    for (const key of ['page', 'limit', 'search', 'status', 'batchId']) {
      const value = req.nextUrl.searchParams.get(key);
      if (value) backendUrl.searchParams.set(key, value);
    }

    const backendRes = await fetch(backendUrl, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('[API NIK kembar] BackendStatistik tidak dapat diakses:', error);
    return NextResponse.json({ message: 'Layanan data NIK kembar tidak tersedia.' }, { status: 503 });
  }
}
