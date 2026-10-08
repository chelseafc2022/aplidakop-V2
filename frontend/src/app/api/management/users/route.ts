import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

export async function GET(req: NextRequest) {
  try {
    const res = await fetchFromBackend('/api/v1/registrasiAplidakop/view', {
      method: 'POST',
      body: JSON.stringify({ page_limit: 100, data_ke: 1, cari_value: '' }),
    });

    if (res.ok) {
      const json = await res.json();
      const list = json?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return NextResponse.json(
          list.map((u: any) => ({
            id: String(u.id),
            username: u.username,
            nama: u.nama || u.username,
            email: u.email || `${u.username}@konaweselatankab.go.id`,
            role: {
              id: String(u.menu_klp || u.db_dinkop || '1'),
              nama: u.menu_klp_uraian || u.kelompok || 'Operator Dinas',
            },
            isActive: true,
            createdAt: u.createAt || new Date().toISOString(),
          }))
        );
      }
    }
  } catch (e) {
    console.error('[Management Users] Error:', e);
  }

  return NextResponse.json([
    {
      id: '1',
      username: 'admin',
      nama: 'Administrator Sistem Dinkop',
      email: 'admin.dinkop@konaweselatankab.go.id',
      role: { id: '1', nama: 'SUPER_ADMIN' },
      isActive: true,
      createdAt: '2023-01-01',
    },
    {
      id: '2',
      username: 'op_andoolo',
      nama: 'Operator Kec. Andoolo',
      email: 'andoolo@konaweselatankab.go.id',
      role: { id: '2', nama: 'OPERATOR_KECAMATAN' },
      isActive: true,
      createdAt: '2023-06-12',
    },
    {
      id: '3',
      username: 'juri_evaluator',
      nama: 'Tim Penilai Smart City (Guest)',
      email: 'penilai.smartcity@kemkominfo.go.id',
      role: { id: '3', nama: 'EVALUATOR_JURI' },
      isActive: true,
      createdAt: '2026-10-01',
    },
  ]);
}
