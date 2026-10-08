import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/backend-client';

const DAFTAR_KECAMATAN_KONSEL = [
  { id: '7405010', nama: 'Tinanggea' },
  { id: '7405020', nama: 'Angata' },
  { id: '7405030', nama: 'Andoolo' },
  { id: '7405040', nama: 'Palangga' },
  { id: '7405050', nama: 'Landono' },
  { id: '7405060', nama: 'Lainea' },
  { id: '7405070', nama: 'Konda' },
  { id: '7405080', nama: 'Ranomeeto' },
  { id: '7405090', nama: 'Kolono' },
  { id: '7405100', nama: 'Moramo' },
  { id: '7405110', nama: 'Laonti' },
  { id: '7405120', nama: 'Lalembuu' },
  { id: '7405130', nama: 'Benua' },
  { id: '7405140', nama: 'Palangga Selatan' },
  { id: '7405150', nama: 'Mowila' },
  { id: '7405160', nama: 'Moramo Utara' },
  { id: '7405170', nama: 'Buke' },
  { id: '7405180', nama: 'Wolasi' },
  { id: '7405190', nama: 'Laeya' },
  { id: '7405200', nama: 'Baito' },
  { id: '7405210', nama: 'Basala' },
  { id: '7405220', nama: 'Ranomeeto Barat' },
  { id: '7405230', nama: 'Kolono Timur' },
  { id: '7405240', nama: 'Sabulakoa' },
  { id: '7405250', nama: 'Andoolo Barat' },
];

export async function GET() {
  try {
    const res = await fetchFromBackend('/api/v1/dinkop_index/kecamatan');

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        const mapped = json.data.map((item: any) => ({
          id: String(item.kecamatan_id),
          nama: item.nama_kecamatan,
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (e) {
    console.error('[Kecamatan] Error fetching from backend:', e);
  }

  return NextResponse.json(DAFTAR_KECAMATAN_KONSEL);
}
