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
            keterangan: r.keterangan || `Role Otorisasi Sistem APLI DAKOP ID #${r.id}`,
          }))
        );
      }
    }
  } catch (e) {
    console.error('[Management Roles GET] Error:', e);
  }

  // Fallback kelompok user standar
  return NextResponse.json([
    {
      id: '1',
      nama: 'SUPER_ADMIN',
      keterangan: 'Administrator Dinas Koperasi dan UMKM (Akses Penuh)',
    },
    {
      id: '2',
      nama: 'OPERATOR_KECAMATAN',
      keterangan: 'Petugas Penginput Data Kewilayahan Kecamatan',
    },
    {
      id: '3',
      nama: 'EVALUATOR_JURI',
      keterangan: 'Akses Verifikasi Tim Penilai Smart City (Read-Only)',
    },
  ]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, list_menu } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ message: 'Nama kelompok role wajib diisi' }, { status: 400 });
    }

    // Ambil default listAdd jika list_menu belum disediakan
    let menuPayload = list_menu;
    if (!menuPayload || !Array.isArray(menuPayload) || menuPayload.length === 0) {
      const menuRes = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/listAdd');
      if (menuRes.ok) {
        menuPayload = await menuRes.json();
      } else {
        menuPayload = [];
      }
    }

    const res = await fetchFromBackend('/api/v1/kelompokUsersAplidakop/addData', {
      method: 'POST',
      body: JSON.stringify({
        form: { uraian: nama.trim() },
        list_menu: menuPayload,
      }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true, message: 'Kelompok Role baru berhasil dibuat' });
    }

    const text = await res.text();
    return NextResponse.json({ message: text || 'Gagal menyimpan role di backend' }, { status: 500 });
  } catch (err: any) {
    console.error('[Management Roles POST] Error:', err);
    return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
