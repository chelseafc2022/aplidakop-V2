import { NextRequest, NextResponse } from 'next/server';

import { idBodySchema, userCreateSchema, userUpdateSchema } from '@/lib/api-schemas';
import { fetchFromBackend } from '@/lib/backend-client';
import {
  parseJsonBody,
  requireAdministrator,
  safeBackendStatus,
  securityErrorResponse,
} from '@/lib/server-security';

export async function GET(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Math.min(100_000, Number(searchParams.get('page') || 1) || 1));
  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 10) || 10));
  const hasRole = searchParams.get('hasRole') ?? 'true';

  try {
    const response = await fetchFromBackend('/api/v1/registrasiAplidakop/view', {
      method: 'POST',
      body: JSON.stringify({
        page_limit: limit,
        data_ke: page,
        cari_value: (searchParams.get('search') || '').trim().slice(0, 200),
        instansi_id: (searchParams.get('instansiId') || '').trim().slice(0, 64) || undefined,
        unit_kerja_id: (searchParams.get('unitKerjaId') || '').trim().slice(0, 64) || undefined,
        has_role: hasRole === 'all' ? undefined : hasRole === 'true',
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { message: 'Gagal membaca direktori pengguna.' },
        { status: safeBackendStatus(response.status) },
      );
    }

    const list = Array.isArray(json?.data) ? json.data : [];
    const total = Number(json?.total ?? list.length);
    return NextResponse.json({
      data: list.map((user: any) => ({
        id: String(user.id),
        username: user.username,
        nama: user.nama || user.username,
        nip: user.nip || '-',
        hp: user.hp || '-',
        email: user.email || '',
        instansiId: String(user.instansi_id || ''),
        instansiNama: user.instansi_nama || '-',
        unitKerjaId: String(user.unit_kerja_id || ''),
        unitKerjaNama: user.unit_kerja_nama || '-',
        role: {
          id: String(user.menu_klp || user.db_dinkop || '0'),
          nama: user.menu_klp_uraian || 'Belum Ada Role',
        },
        hasRole: Number(user.menu_klp || 0) > 0,
        createdAt: user.createAt || null,
      })),
      total,
      totalPages: Number(json?.jmlData ?? Math.ceil(total / limit)),
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error('[Management Users] Gagal membaca pengguna.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan pengguna tidak tersedia.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const parsed = await parseJsonBody(request, userCreateSchema, 32 * 1024);
  if (parsed.error) return parsed.error;
  const { username, password, email, hp, roleId, nip, unitKerjaId } = parsed.data;

  try {
    const response = await fetchFromBackend('/api/v1/registrasiAplidakop/signup', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        email,
        hp: hp || '',
        unit_kerja: unitKerjaId,
        nama_nip: nip || username,
        menu_klp: Number(roleId),
      }),
    });
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal mendaftarkan pengguna.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json({ success: true, message: 'Pengguna baru berhasil diregistrasi.' });
  } catch (error) {
    console.error('[Management Users] Gagal membuat pengguna.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan pengguna tidak tersedia.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const parsed = await parseJsonBody(request, userUpdateSchema, 32 * 1024);
  if (parsed.error) return parsed.error;
  const { id, roleId, username, email, hp } = parsed.data;

  try {
    const response = await fetchFromBackend('/api/v1/registrasiAplidakop/editData', {
      method: 'POST',
      body: JSON.stringify({ id, menu_klp: Number(roleId), username, email, hp }),
    });
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal memperbarui pengguna.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json({ success: true, message: 'Pengguna berhasil diperbarui.' });
  } catch (error) {
    console.error('[Management Users] Gagal memperbarui pengguna.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan pengguna tidak tersedia.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const authorization = await requireAdministrator(request);
  if (authorization.error) return authorization.error;
  const parsed = await parseJsonBody(request, idBodySchema, 8 * 1024);
  if (parsed.error) return parsed.error;

  try {
    const response = await fetchFromBackend('/api/v1/registrasiAplidakop/removeData', {
      method: 'POST',
      body: JSON.stringify({ id: { id: parsed.data.id } }),
    });
    if (!response.ok) {
      return NextResponse.json({ message: 'Gagal menghapus pengguna.' }, { status: safeBackendStatus(response.status) });
    }
    return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus.' });
  } catch (error) {
    console.error('[Management Users] Gagal menghapus pengguna.', error);
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ message: 'Layanan pengguna tidak tersedia.' }, { status: 503 });
  }
}
