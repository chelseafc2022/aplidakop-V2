import { NextRequest, NextResponse } from 'next/server';

import { getBackendStatistikUrl } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Sesi autentikasi diperlukan.' }, { status: 401 });
  }

  try {
    const backendResponse = await fetch(`${getBackendStatistikUrl()}/aplidakop_auth/me`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    const data = await backendResponse.json().catch(() => ({}));
    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: 'Sesi tidak valid atau sudah berakhir.' },
        { status: backendResponse.status === 403 ? 403 : 401 },
      );
    }

    const profile = data.profile || {};
    return NextResponse.json({
      id: String(data._id || ''),
      username: String(data.username || ''),
      nama: String(profile.nama || profile.username || data.username || ''),
      email: profile.email ? String(profile.email) : undefined,
      nip: profile.nip ? String(profile.nip) : undefined,
      hp: profile.hp ? String(profile.hp) : undefined,
      instansiNama: profile.instansi_nama ? String(profile.instansi_nama) : undefined,
      unitKerjaNama: profile.unit_kerja_nama ? String(profile.unit_kerja_nama) : undefined,
      roleId: String(profile.menu_klp || data.role?.id || ''),
      role: {
        id: String(data.role?.id || profile.menu_klp || ''),
        nama: String(data.role?.nama || profile.menu_klp_uraian || 'Tanpa Role'),
        permissions: Array.isArray(data.role?.permissions) ? data.role.permissions : [],
      },
    });
  } catch (error) {
    console.error('[Auth Me] Verifikasi sesi gagal.', error);
    return NextResponse.json({ message: 'Layanan autentikasi tidak tersedia.' }, { status: 503 });
  }
}
