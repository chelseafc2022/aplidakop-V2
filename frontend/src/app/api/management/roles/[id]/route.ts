import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/listEdit', {
      method: 'POST',
      body: JSON.stringify({ menu_klp_id: id }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('[API Management Role Detail GET] Error:', error);
  }

  return NextResponse.json([]);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nama, list_menu } = body;

    const res = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/editData', {
      method: 'POST',
      body: JSON.stringify({
        form: { id: Number(id), uraian: nama },
        list_menu: list_menu || [],
      }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true, message: 'Data role dan hak akses berhasil diperbarui' });
    }

    const text = await res.text();
    return NextResponse.json({ message: text || 'Gagal mengubah data role' }, { status: 500 });
  } catch (error: any) {
    console.error('[API Management Role Detail PUT] Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/removeData', {
      method: 'POST',
      body: JSON.stringify({ id: Number(id) }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true, message: 'Kelompok role berhasil dihapus' });
    }

    const text = await res.text();
    return NextResponse.json({ message: text || 'Gagal menghapus role' }, { status: 500 });
  } catch (error: any) {
    console.error('[API Management Role Detail DELETE] Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
