'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { LineChart, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function StatistikKoperasiPage() {
  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data,
  });

  const umkmByKecamatan = summary?.charts?.umkmByKecamatan || [];
  const koperasiByJenis = summary?.charts?.koperasiByJenis || [];

  return (
    <div className="px-4 lg:px-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Statistik Koperasi</h1>
          <p className="text-sm text-muted-foreground">Analisis agregasi sebaran kelembagaan koperasi per kecamatan dan bentuk koperasi</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Cetak Laporan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-bold">Sebaran Koperasi per Kecamatan</CardTitle>
            <CardDescription className="text-xs">Jumlah badan hukum koperasi terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={umkmByKecamatan} margin={{ bottom: 50, left: -20 }}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="koperasi" name="Koperasi" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-bold">Rekapitulasi per Kecamatan</CardTitle>
            <CardDescription className="text-xs">Tabel ringkasan jumlah koperasi terdata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[350px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-muted border-b">
                  <tr>
                    <th className="p-2">No</th>
                    <th className="p-2">Nama Kecamatan</th>
                    <th className="p-2 text-right">Jumlah Koperasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {umkmByKecamatan.map((kec: any, idx: number) => (
                    <tr key={kec.name || idx} className="hover:bg-muted/30">
                      <td className="p-2 text-muted-foreground">{idx + 1}</td>
                      <td className="p-2 font-medium">{kec.name}</td>
                      <td className="p-2 text-right font-mono font-bold text-teal-600">{kec.koperasi}</td>
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
