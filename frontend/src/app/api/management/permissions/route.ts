import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roleId, roleName, list_menu } = body;

    if (!roleId) {
      return NextResponse.json({ message: 'Role ID diperlukan' }, { status: 400 });
    }

    const res = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/editData', {
      method: 'POST',
      body: JSON.stringify({
        form: {
          id: Number(roleId),
          uraian: roleName || 'Role Sistem',
        },
        list_menu: list_menu || [],
      }),
    });

    if (res.ok) {
      return NextResponse.json({
        success: true,
        message: 'Matriks hak akses RBAC berhasil disimpan ke basis data',
      });
    }

    const text = await res.text();
    return NextResponse.json({ message: text || 'Gagal menyimpan izin di database' }, { status: 500 });
  } catch (error: any) {
    console.error('[API Management Permissions POST] Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
