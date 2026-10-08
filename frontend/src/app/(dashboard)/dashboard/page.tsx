'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Store,
  Building2,
  CheckCircle2,
  XCircle,
  Filter,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

export default function DashboardPage() {
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
  const [selectedTahun, setSelectedTahun] = useState<string>('all');

  // Fetch Kecamatan for filter
  const { data: kecamatanList } = useQuery({
    queryKey: ['kecamatan-list'],
    queryFn: async () => {
      const res = await api.get('/wilayah/kecamatan');
      return res.data;
    },
  });

  // Fetch Summary with filters
  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-summary', selectedKecamatan, selectedTahun],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary', {
        params: {
          kecamatanId: selectedKecamatan !== 'all' ? selectedKecamatan : undefined,
          tahun: selectedTahun !== 'all' ? selectedTahun : undefined,
        },
      });
      return res.data;
    },
  });

  const cards = summary?.cards || {
    totalUmkm: 0,
    totalKoperasi: 0,
    koperasiAktif: 0,
    koperasiNonAktif: 0,
  };

  const umkmByKecamatan = summary?.charts?.umkmByKecamatan || [];
  const umkmByJenisUsaha = summary?.charts?.umkmByJenisUsaha || [];
  const koperasiByJenis = summary?.charts?.koperasiByJenis || [];

  return (
    <div className="px-4 lg:px-8 space-y-6">
      {/* Top Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Statistik UMKM & Koperasi
          </h1>
          <p className="text-sm text-muted-foreground">
            Dinas Koperasi dan UMKM Kabupaten Konawe Selatan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kecamatan Filter */}
          <div className="w-[180px]">
            <Select value={selectedKecamatan} onValueChange={setSelectedKecamatan}>
              <SelectTrigger className="h-9 text-xs">
                <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Semua Kecamatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kecamatan</SelectItem>
                {kecamatanList?.map((kec: any) => (
                  <SelectItem key={kec.id} value={kec.id}>
                    {kec.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tahun Filter */}
          <div className="w-[130px]">
            <Select value={selectedTahun} onValueChange={setSelectedTahun}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Semua Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 px-2.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button asChild size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white">
            <Link href="/pelaku-umkm">
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Data
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Pelaku UMKM
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1">
                  {cards.totalUmkm}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Pelaku usaha terverifikasi
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs hover:border-teal-500/40 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Koperasi
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1">
                  {cards.totalKoperasi}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              Badan hukum & binaan dinas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Koperasi Aktif
                </p>
                <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {cards.koperasiAktif}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Rutin menyelenggarakan RAT
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs hover:border-rose-500/40 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Koperasi Non-Aktif
                </p>
                <h3 className="text-3xl font-extrabold text-rose-500 mt-1">
                  {cards.koperasiNonAktif}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Perlu pembinaan dan revitalisasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sebaran Wilayah Kecamatan (2 Cols) */}
        <Card className="lg:col-span-2 border-border/60 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Sebaran Pelaku UMKM & Koperasi per Kecamatan
            </CardTitle>
            <CardDescription className="text-xs">
              Grafik perbandingan data pelaku UMKM dan Koperasi di seluruh kecamatan Kabupaten Konawe Selatan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={umkmByKecamatan} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="umkm" name="Pelaku UMKM" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="koperasi" name="Koperasi" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Jenis Usaha Donut (1 Col) */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Distribusi Sektor Usaha
            </CardTitle>
            <CardDescription className="text-xs">
              Komposisi jenis usaha pelaku UMKM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={umkmByJenisUsaha}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {umkmByJenisUsaha.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5 max-h-[90px] overflow-y-auto text-xs">
              {umkmByJenisUsaha.map((ju: any, idx: number) => (
                <div key={ju.name} className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate">{ju.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{ju.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
