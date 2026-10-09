import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_STATISTIK_URL } from '@/lib/backend-client';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_STATISTIK_URL}/aplidakop_auth/me`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });
    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || 'Unauthorized' },
        { status: backendRes.status },
      );
    }

    const profile = data.profile || {};
    return NextResponse.json({
      id: data._id,
      username: data.username,
      nama: profile.nama || profile.username || data.username,
      email: profile.email,
      nip: profile.nip,
      hp: profile.hp,
      instansiNama: profile.instansi_nama,
      unitKerjaNama: profile.unit_kerja_nama,
      roleId: String(profile.menu_klp),
      role: {
        id: String(data.role?.id || profile.menu_klp),
        nama: data.role?.nama || profile.menu_klp_uraian || 'Tanpa Role',
      },
    });
  } catch (error) {
    console.error('[Auth me] BackendStatistik tidak dapat diakses:', error);
    return NextResponse.json({ message: 'Layanan autentikasi tidak tersedia.' }, { status: 503 });
  }
}
