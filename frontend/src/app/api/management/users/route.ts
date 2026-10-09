import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1') || 1;
  const limit = parseInt(searchParams.get('limit') || '10') || 10;
  const search = searchParams.get('search') || '';
  const instansiId = searchParams.get('instansiId') || '';
  const unitKerjaId = searchParams.get('unitKerjaId') || '';
  const hasRole = searchParams.get('hasRole') ?? 'true'; // default: 'true' (hanya yang sudah memiliki role)

  try {
    const res = await fetchFromBackend('/api/v1/registrasiAplidakop/view', {
      method: 'POST',
      body: JSON.stringify({
        page_limit: limit,
        data_ke: page,
        cari_value: search,
        instansi_id: instansiId || undefined,
        unit_kerja_id: unitKerjaId || undefined,
        has_role: hasRole === 'all' ? undefined : hasRole,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const list = json?.data || [];
      const total = json?.total ?? list.length;
      const totalPages = json?.jmlData ?? Math.ceil(total / limit);

      return NextResponse.json({
        data: list.map((u: any) => ({
          id: String(u.id),
          username: u.username,
          nama: u.nama || u.username,
          nip: u.nip || '-',
          hp: u.hp || '-',
          email: u.email || `${u.username}@konaweselatankab.go.id`,
          instansiId: String(u.instansi_id || ''),
          instansiNama: u.instansi_nama || 'Pemerintah Kab. Konawe Selatan',
          unitKerjaId: String(u.unit_kerja_id || ''),
          unitKerjaNama: u.unit_kerja_nama || '-',
          role: {
            id: String(u.menu_klp || u.db_dinkop || '0'),
            nama: u.menu_klp_uraian || (u.menu_klp > 0 ? `Role #${u.menu_klp}` : 'Belum Ada Role'),
          },
          hasRole: !!(u.menu_klp && Number(u.menu_klp) > 0),
          createdAt: u.createAt || new Date().toISOString(),
        })),
        total,
        totalPages,
        currentPage: page,
        limit,
      });
    }
  } catch (e) {
    console.error('[Management Users GET] Error:', e);
  }

  // Fallback demo data
  return NextResponse.json({
    data: [
      {
        id: '1',
        username: 'admin',
        nama: 'Administrator Sistem Dinkop',
        nip: '198501012010011001',
        hp: '081234567890',
        email: 'admin.dinkop@konaweselatankab.go.id',
        instansiId: '1',
        instansiNama: 'Dinas Koperasi dan Usaha Kecil Menengah',
        unitKerjaId: '1',
        unitKerjaNama: 'Bidang Pemberdayaan dan Pengembangan UMKM',
        role: { id: '1', nama: 'SUPER_ADMIN' },
        hasRole: true,
        createdAt: '2023-01-01',
      },
      {
        id: '2',
        username: 'op_andoolo',
        nama: 'Operator Kec. Andoolo',
        nip: '199003152015021002',
        hp: '085200000001',
        email: 'andoolo@konaweselatankab.go.id',
        instansiId: '1',
        instansiNama: 'Dinas Koperasi dan Usaha Kecil Menengah',
        unitKerjaId: '2',
        unitKerjaNama: 'Bidang Kelembagaan dan Pengawasan Koperasi',
        role: { id: '2', nama: 'OPERATOR_KECAMATAN' },
        hasRole: true,
        createdAt: '2023-06-12',
      },
    ],
    total: 2,
    totalPages: 1,
    currentPage: page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, nama, email, hp, roleId, nip, unitKerjaId } = body;

    const res = await fetchFromBackend('/api/v1/registrasiAplidakop/signup', {
      method: 'POST',
      body: JSON.stringify({
        username: username?.trim(),
        password: password?.trim() || 'password123',
        email: email?.trim() || `${username}@konaweselatankab.go.id`,
        hp: hp || '-',
        unit_kerja: unitKerjaId || '1',
        nama_nip: nip || username,
        menu_klp: Number(roleId) || 1,
      }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true, message: 'Pengguna baru berhasil diregistrasi' });
    }

    const text = await res.text();
    return NextResponse.json({ message: text || 'Gagal mendaftarkan pengguna baru' }, { status: 500 });
  } catch (err: any) {
    console.error('[Management Users POST] Error:', err);
    return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, roleId, username, email, hp } = body;

    const res = await fetchFromBackend('/api/v1/registrasiAplidakop/editData', {
      method: 'POST',
      body: JSON.stringify({
        id: id,
        menu_klp: Number(roleId) || 0,
        username: username || undefined,
        email: email || undefined,
        hp: hp || undefined,
      }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true, message: 'Hak akses (role) pengguna berhasil diperbarui' });
    }

    const text = await res.text();
    return NextResponse.json({ message: text || 'Gagal memperbarui role pengguna' }, { status: 500 });
  } catch (err: any) {
    console.error('[Management Users PUT] Error:', err);
    return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    const res = await fetchFromBackend('/api/v1/registrasiAplidakop/removeData', {
      method: 'POST',
      body: JSON.stringify({ id: { id } }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus' });
    }

    const text = await res.text();
    return NextResponse.json({ message: text || 'Gagal menghapus pengguna' }, { status: 500 });
  } catch (err: any) {
    console.error('[Management Users DELETE] Error:', err);
    return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
