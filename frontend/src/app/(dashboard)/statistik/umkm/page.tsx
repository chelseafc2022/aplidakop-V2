'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BarChart3, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function StatistikUmkmPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data,
  });

  const umkmByKecamatan = summary?.charts?.umkmByKecamatan || [];
  const umkmByJenisUsaha = summary?.charts?.umkmByJenisUsaha || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="px-4 lg:px-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Statistik Pelaku UMKM</h1>
          <p className="text-sm text-muted-foreground">Analisis agregasi sebaran UMKM per kecamatan dan sektor usaha</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak Laporan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-bold">Sebaran UMKM per Kecamatan</CardTitle>
            <CardDescription className="text-xs">Jumlah pelaku usaha di 25 kecamatan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={umkmByKecamatan} margin={{ bottom: 50, left: -20 }}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="umkm" name="Pelaku UMKM" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-bold">Rekapitulasi per Kecamatan</CardTitle>
            <CardDescription className="text-xs">Tabel ringkasan jumlah pelaku UMKM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[350px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-muted border-b">
                  <tr>
                    <th className="p-2">No</th>
                    <th className="p-2">Nama Kecamatan</th>
                    <th className="p-2 text-right">Jumlah UMKM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {umkmByKecamatan.map((kec: any, idx: number) => (
                    <tr key={kec.name || idx} className="hover:bg-muted/30">
                      <td className="p-2 text-muted-foreground">{idx + 1}</td>
                      <td className="p-2 font-medium">{kec.name}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-600">{kec.umkm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
