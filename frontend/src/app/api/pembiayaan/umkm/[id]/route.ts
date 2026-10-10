import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();

    const res = await fetchFromBackend('/api/v1/stat_pembiayaan_umkm/editData', {
      method: 'POST',
      body: JSON.stringify({
        id,
        pelaku_id: body.pelakuId || body.pelaku_id,
        tahun: body.tahun,
        bantu_tunai: body.bantuTunai !== undefined ? body.bantuTunai : body.bantu_tunai,
        bantu_sarana: body.bantuSarana !== undefined ? body.bantuSarana : body.bantu_sarana,
        keterangan: body.keterangan,
      }),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: data?.message || 'Gagal mengubah data bantuan UMKM' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e: any) {
    console.error('[Bantuan/Pembiayaan UMKM] Error updating:', e);
    return NextResponse.json(
      { message: 'Koneksi ke backend gagal: ' + (e?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetchFromBackend('/api/v1/stat_pembiayaan_umkm/removeData', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    }

    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: err.message || 'Gagal menghapus data bantuan' },
      { status: res.status >= 400 ? res.status : 500 }
    );
  } catch (e: any) {
    console.error('[Bantuan/Pembiayaan UMKM] Error deleting:', e);
    return NextResponse.json(
      { message: 'Koneksi ke backend gagal: ' + (e?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
