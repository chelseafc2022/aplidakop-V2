import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(req: NextRequest) {
  try {
    const res = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/view', {
      method: 'POST',
      body: JSON.stringify({ page_limit: 100, data_ke: 1, cari_value: '' }),
    });

    if (res.ok) {
      const json = await res.json();
      const list = json?.data || json || [];
      if (Array.isArray(list) && list.length > 0) {
        return NextResponse.json(
          list.map((r: any) => ({
            id: String(r.id),
            nama: r.uraian || r.kelompok || r.nama || 'Kelompok User',
            keterangan: r.keterangan || '-',
            permissions: [],
          }))
        );
      }
    }
  } catch (e) {
    console.error('[Management Roles] Error:', e);
  }

  return NextResponse.json([
    {
      id: '1',
      nama: 'SUPER_ADMIN',
      keterangan: 'Administrator Dinas Koperasi dan UMKM (Akses Penuh)',
      permissions: [
        { menuId: '1', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
        { menuId: '2', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
        { menuId: '3', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
        { menuId: '4', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
      ],
    },
    {
      id: '2',
      nama: 'OPERATOR_KECAMATAN',
      keterangan: 'Petugas Penginput Data Kewilayahan Kecamatan',
      permissions: [
        { menuId: '1', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
        { menuId: '2', canRead: true, canCreate: true, canUpdate: true, canDelete: false },
        { menuId: '3', canRead: true, canCreate: true, canUpdate: true, canDelete: false },
      ],
    },
    {
      id: '3',
      nama: 'EVALUATOR_JURI',
      keterangan: 'Akses Verifikasi Tim Penilai Smart City (Read-Only)',
      permissions: [
        { menuId: '1', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
        { menuId: '2', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
        { menuId: '3', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
        { menuId: '4', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
      ],
    },
  ]);
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Role berhasil ditambahkan' });
}
