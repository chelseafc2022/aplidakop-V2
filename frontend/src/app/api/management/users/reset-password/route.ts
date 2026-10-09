import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json({ message: 'User ID dan password baru diperlukan' }, { status: 400 });
    }

    const res = await fetchFromBackend('/api/v1/registrasiAplidakop/editDataPass', {
      method: 'POST',
      body: JSON.stringify({
        id: userId,
        password: password.trim(),
      }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true, message: 'Password pengguna berhasil diubah' });
    }

    const text = await res.text();
    return NextResponse.json({ message: text || 'Gagal mengubah password di database' }, { status: 500 });
  } catch (error: any) {
    console.error('[Reset Password] Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
