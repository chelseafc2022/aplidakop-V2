import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    { id: '1', title: 'Dashboard Utama', url: '/dashboard' },
    { id: '2', title: 'Pelaku UMKM', url: '/pelaku-umkm' },
    { id: '3', title: 'Data Koperasi', url: '/koperasi' },
    { id: '4', title: 'Pembiayaan UMKM & Koperasi', url: '/pembiayaan/umkm' },
    { id: '5', title: 'Laporan Statistik', url: '/statistik/umkm' },
    { id: '6', title: 'Inovasi Smart City', url: '/inovasi' },
  ]);
}
