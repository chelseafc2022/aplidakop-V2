import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';
import { pembiayaanUmkmSchema, routeIdSchema } from '@/lib/api-schemas';
import { parseJsonBody, securityErrorResponse } from '@/lib/server-security';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });

  try {
    const parsed = await parseJsonBody(req, pembiayaanUmkmSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const res = await fetchFromBackend('/api/v1/stat_pembiayaan_umkm/editData', {
      method: 'POST',
      body: JSON.stringify({
        id: parsedId.data,
        pelaku_id: body.pelakuId,
        tahun: body.tahun,
        bantu_tunai: body.bantuTunai,
        bantu_sarana: body.bantuSarana,
        keterangan: body.keterangan,
      }),
    });

    const data = await res.json();
    if (res.ok && data?.status !== false) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: 'Gagal mengubah data bantuan UMKM.' },
      { status: res.status >= 400 ? res.status : 400 }
    );
  } catch (e) {
    console.error('[Bantuan/Pembiayaan UMKM] Error updating:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data bantuan UMKM tidak tersedia.' }, { status: 503 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedId = routeIdSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });

  try {
    const res = await fetchFromBackend('/api/v1/stat_pembiayaan_umkm/removeData', {
      method: 'POST',
      body: JSON.stringify({ id: parsedId.data }),
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    }

    return NextResponse.json(
      { message: 'Gagal menghapus data bantuan.' },
      { status: res.status >= 400 ? res.status : 500 }
    );
  } catch (e) {
    console.error('[Bantuan/Pembiayaan UMKM] Error deleting:', e);
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan data bantuan UMKM tidak tersedia.' }, { status: 503 });
  }
}
