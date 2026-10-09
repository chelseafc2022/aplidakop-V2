import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_STATISTIK_URL } from '@/lib/backend-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // 1. Coba login ke BackendStatistik Express API
    try {
      const backendRes = await fetch(`${BACKEND_STATISTIK_URL}/aplidakop_auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await backendRes.json();

      if (backendRes.ok && data.token) {
        const profile = data.profile || {};
        const pDetails = profile.profile || {};

        return NextResponse.json({
          user: {
            id: profile._id || '1',
            username: profile.username || username,
            nama: pDetails.nama || pDetails.username || profile.username || 'Administrator',
            email: pDetails.email || `${username}@konaweselatankab.go.id`,
            nip: pDetails.nip || '-',
            hp: pDetails.hp || '-',
            instansiNama: pDetails.instansi_nama || 'Dinas Koperasi dan UMKM',
            unitKerjaNama: pDetails.unit_kerja_nama || 'Kabupaten Konawe Selatan',
            role: {
              id: String(pDetails.menu_klp || '0'),
              nama: pDetails.menu_klp_uraian || 'Tanpa Role',
              permissions: [],
            },
          },
          accessToken: data.token,
          refreshToken: data.token,
        });
      }

      if (!backendRes.ok) {
        return NextResponse.json(
          { message: data.message || 'Username atau password salah' },
          { status: backendRes.status || 401 }
        );
      }
    } catch (backendError) {
      console.warn('[BackendStatistik Offline] Login tidak tersedia:', backendError);
      return NextResponse.json(
        { message: 'Gagal terhubung ke server BackendStatistik (Port 5020). Pastikan BackendStatistik sedang berjalan.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ message: 'Login gagal' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
