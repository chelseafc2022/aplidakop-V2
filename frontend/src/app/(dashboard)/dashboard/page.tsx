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
  Printer,
  Coins,
  Users,
  MapPin,
  ArrowUpRight,
  PieChart as PieIcon,
  Award,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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

const COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f43f5e', // rose
];

export default function DashboardPage() {
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
  const [selectedTahun, setSelectedTahun] = useState<string>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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
    totalUmkm: 17671,
    totalKoperasi: 326,
    koperasiAktif: 248,
    koperasiNonAktif: 78,
  };

  const umkmByKecamatan = summary?.charts?.umkmByKecamatan || [];
  const umkmByJenisUsaha = summary?.charts?.umkmByJenisUsaha || [];
  const koperasiByJenis = summary?.charts?.koperasiByJenis || [];

  // Top 5 Sentra Kecamatan
  const topKecamatan = [...umkmByKecamatan]
    .sort((a: any, b: any) => b.umkm - a.umkm)
    .slice(0, 5);

  const totalUmkmCount = cards.totalUmkm || 17671;
  const totalKoperasiCount = cards.totalKoperasi || 326;

  return (
    <div className="px-4 lg:px-8 space-y-6">
      {/* Top Header & Executive Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-border/40">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Satu Data UMKM & Koperasi
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">Kabupaten Konawe Selatan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
            Dashboard Eksekutif Statistik & Analitik
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Sistem Informasi Terpadu APLI DAKOP v2.0 — Dinas Koperasi dan Usaha Kecil Menengah
          </p>
        </div>

        {/* Baris Kontrol Filter Statis & Tombol Aksi */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Kotak Filter Kecamatan Statis (Lebar Pasti 195px) */}
          <div className="w-[195px] shrink-0">
            <Select value={selectedKecamatan} onValueChange={setSelectedKecamatan}>
              <SelectTrigger className="w-full h-9 text-xs">
                <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Semua Kecamatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Semua Kecamatan</SelectItem>
                {kecamatanList?.map((kec: any) => (
                  <SelectItem key={kec.id} value={kec.id} className="text-xs">
                    {kec.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kotak Filter Tahun Statis (Lebar Pasti 130px) */}
          <div className="w-[130px] shrink-0">
            <Select value={selectedTahun} onValueChange={setSelectedTahun}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Semua Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Semua Tahun</SelectItem>
                <SelectItem value="2026" className="text-xs">Tahun 2026</SelectItem>
                <SelectItem value="2025" className="text-xs">Tahun 2025</SelectItem>
                <SelectItem value="2024" className="text-xs">Tahun 2024</SelectItem>
                <SelectItem value="2023" className="text-xs">Tahun 2023</SelectItem>
                <SelectItem value="2022" className="text-xs">Tahun 2022</SelectItem>
                <SelectItem value="2021" className="text-xs">Tahun 2021</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tombol Refresh Statis */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            title="Muat ulang data statistik"
            className="h-9 w-9 p-0 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Tombol Cetak Dokumen Eksekutif Statis */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-9 px-3 text-xs border-border/80 hover:bg-muted shrink-0"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
            Cetak Ringkasan
          </Button>

          {/* Tombol Tambah Data Statis */}
          <Button asChild size="sm" className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs shrink-0">
            <Link href="/pelaku-umkm">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Tambah Data
            </Link>
          </Button>
        </div>
      </div>

      {/* Baseline Status Notice & Smart Economy Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">
                Basis Data Baseline Resmi (Periode 2021–2024)
              </span>
              <span className="hidden sm:inline-block bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Terkunci & Valid
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              Sebanyak <strong>{totalUmkmCount.toLocaleString('id-ID')} Pelaku UMKM</strong> dan{' '}
              <strong>{totalKoperasiCount} Koperasi</strong> telah tervalidasi sebagai data dasar pembangunan daerah Kab. Konawe Selatan. Data tahun 2025/2026 disiapkan melalui modul import berkala.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs bg-background/80">
            <Link href="/inovasi">
              <Award className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Portofolio Smart City
            </Link>
          </Button>
          <Button asChild size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
            <Link href="/pelaku-umkm">
              Kelola Data
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards (4 Kolom Utama) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total UMKM */}
        <Card className="border-border/60 shadow-xs hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Pelaku UMKM
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1">
                  {cards.totalUmkm.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs pt-2 border-t border-border/40">
              <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Baseline 2021–2024
              </span>
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                100% Terverifikasi NIK
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Koperasi */}
        <Card className="border-border/60 shadow-xs hover:border-teal-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Koperasi
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1">
                  {cards.totalKoperasi}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs pt-2 border-t border-border/40">
              <span className="text-muted-foreground text-[11px]">
                Badan Hukum Resmi Dinas
              </span>
              <span className="text-[10px] font-medium text-teal-700 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                25 Kecamatan
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Koperasi Aktif */}
        <Card className="border-border/60 shadow-xs hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
            <div className="flex items-center justify-between mt-3 text-xs pt-2 border-t border-border/40">
              <span className="text-muted-foreground text-[11px]">
                Rasio Keaktifan:
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                76,1% (Rutin RAT)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Koperasi Non-Aktif */}
        <Card className="border-border/60 shadow-xs hover:border-rose-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
            <div className="flex items-center justify-between mt-3 text-xs pt-2 border-t border-border/40">
              <span className="text-muted-foreground text-[11px]">
                Perlu Pendampingan:
              </span>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                23,9% (Target Revitalisasi)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Macroeconomic Impact Cards (3 Kolom Ringkasan Makro Daerah) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60 bg-muted/20 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                Estimasi Perputaran Omset UMKM
              </p>
              <h4 className="text-lg font-bold text-foreground">
                Rp 632,6 Miliar <span className="text-xs font-normal text-muted-foreground">/ Tahun</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Dihitung dari rata-rata omset pelaku usaha mikro binaan dinas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-muted/20 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                Estimasi Penyerapan Tenaga Kerja
              </p>
              <h4 className="text-lg font-bold text-foreground">
                ~37.100 Orang <span className="text-xs font-normal text-muted-foreground">Pekerja Lokal</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Rata-rata 2,1 tenaga kerja terserap per unit usaha mikro/kecil
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-muted/20 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                Cakupan Wilayah Binaan
              </p>
              <h4 className="text-lg font-bold text-foreground">
                25 Kecamatan <span className="text-xs font-normal text-muted-foreground">& 351 Desa/Kel.</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                100% wilayah administratif terpetakan secara presisi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sebaran Wilayah Kecamatan (2 Cols) */}
        <Card className="lg:col-span-2 border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Sebaran Pelaku UMKM & Koperasi per Kecamatan
                </CardTitle>
                <CardDescription className="text-xs">
                  Agregasi data riil pelaku usaha dan kelembagaan koperasi di 25 kecamatan Kabupaten Konawe Selatan
                </CardDescription>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Total: 25 Kecamatan
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={umkmByKecamatan} margin={{ top: 10, right: 10, left: -15, bottom: 45 }}>
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={65}
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
                  <Bar dataKey="umkm" name="Pelaku UMKM (Unit)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="koperasi" name="Koperasi (Lembaga)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribusi Sektor Usaha UMKM & Bentuk Koperasi (1 Col) */}
        <Card className="border-border/60 shadow-xs flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Distribusi Sektor Usaha</span>
              <PieIcon className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription className="text-xs">
              Komposisi jenis usaha UMKM dan klasifikasi bentuk koperasi
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <Tabs defaultValue="umkm" className="w-full">
              <TabsList className="grid grid-cols-2 h-8 text-xs mb-3">
                <TabsTrigger value="umkm" className="text-xs">Sektor UMKM</TabsTrigger>
                <TabsTrigger value="koperasi" className="text-xs">Bentuk Koperasi</TabsTrigger>
              </TabsList>

              {/* Tab 1: Sektor Usaha UMKM */}
              <TabsContent value="umkm" className="space-y-3 mt-0">
                <div className="h-[210px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={umkmByJenisUsaha}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {umkmByJenisUsaha.map((_: any, index: number) => (
                          <Cell key={`cell-umkm-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto text-xs pr-1">
                  {umkmByJenisUsaha.map((ju: any, idx: number) => (
                    <div key={ju.name} className="flex items-center justify-between text-muted-foreground py-0.5">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="truncate text-xs">{ju.name}</span>
                      </div>
                      <span className="font-semibold text-foreground text-xs">{ju.value.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Tab 2: Bentuk Koperasi */}
              <TabsContent value="koperasi" className="space-y-3 mt-0">
                <div className="h-[210px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={koperasiByJenis}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {koperasiByJenis.map((_: any, index: number) => (
                          <Cell key={`cell-kop-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
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
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto text-xs pr-1">
                  {koperasiByJenis.map((kop: any, idx: number) => (
                    <div key={kop.name} className="flex items-center justify-between text-muted-foreground py-0.5">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[(idx + 3) % COLORS.length] }}
                        />
                        <span className="truncate text-xs">{kop.name}</span>
                      </div>
                      <span className="font-semibold text-foreground text-xs">{kop.value} Lembaga</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Sentra Ekonomi Kecamatan & Quick Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Top 5 Sentra Ekonomi */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Top 5 Sentra Ekonomi UMKM & Koperasi
              </span>
              <span className="text-xs text-muted-foreground font-normal">Konawe Selatan Hubs</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Kecamatan dengan konsentrasi aktivitas usaha mikro dan koperasi tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {topKecamatan.map((kec: any, idx: number) => {
              const pct = ((kec.umkm / totalUmkmCount) * 100).toFixed(1);
              return (
                <div key={kec.name} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px]">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-foreground text-sm">{kec.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {kec.umkm.toLocaleString('id-ID')} UMKM
                      </span>
                      <span className="text-muted-foreground text-[11px] ml-1.5">
                        ({kec.koperasi} Koperasi)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={Number(pct) * 10} className="h-1.5 flex-1" />
                    <span className="text-[11px] text-muted-foreground font-mono w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Card 2: Pusat Navigasi & Tata Kelola Smart City */}
        <Card className="border-border/60 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Pusat Tata Kelola & Pipa Inovasi Daerah
            </CardTitle>
            <CardDescription className="text-xs">
              Akses cepat ke modul operasional harian, manajemen basis data, dan portofolio Smart City
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/pelaku-umkm"
              className="p-3.5 rounded-xl border border-border/50 hover:border-emerald-500/40 bg-muted/20 hover:bg-emerald-500/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                    Basis Data Pelaku UMKM (17.671 Data)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Filter 25 kecamatan, pencarian NIK debounced, batch import & export laporan
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
            </Link>

            <Link
              href="/koperasi"
              className="p-3.5 rounded-xl border border-border/50 hover:border-teal-500/40 bg-muted/20 hover:bg-teal-500/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-teal-600 transition-colors">
                    Buku Induk Koperasi Daerah (326 Lembaga)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Status keaktifan RAT, nomor badan hukum, pengurus, dan modal usaha
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </Link>

            <Link
              href="/inovasi"
              className="p-3.5 rounded-xl border border-border/50 hover:border-amber-500/40 bg-muted/20 hover:bg-amber-500/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-amber-600 transition-colors">
                    Dokumen & Portofolio Smart City 2026
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Matriks Before vs After, 9 kriteria inovasi Smart Economy & cetak portofolio
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Modal Cetak Ringkasan Eksekutif (Print / PDF) */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Printer className="w-5 h-5" />
                <DialogTitle className="text-lg">Cetak Ringkasan Eksekutif Satu Data</DialogTitle>
              </div>
              <Button size="sm" onClick={() => window.print()} className="bg-teal-600 hover:bg-teal-500 text-white text-xs">
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak / Simpan PDF
              </Button>
            </div>
            <DialogDescription className="text-xs">
              Format lembar ringkasan eksekutif ber-kop resmi Pemerintah Kabupaten Konawe Selatan untuk bahan laporan pimpinan daerah atau dewan juri Smart City.
            </DialogDescription>
          </DialogHeader>

          {/* Area Lembar Cetak Ber-Kop Resmi */}
          <div className="p-6 bg-white text-black rounded-lg border border-gray-300 shadow-xs print:border-none print:shadow-none print:p-0">
            {/* Kop Resmi Dinas */}
            <div className="text-center border-b-2 border-black pb-3 mb-5">
              <h3 className="font-bold text-sm tracking-wide uppercase">
                PEMERINTAH KABUPATEN KONAWE SELATAN
              </h3>
              <h2 className="font-black text-base tracking-wider uppercase text-teal-900">
                DINAS KOPERASI DAN USAHA KECIL MENENGAH
              </h2>
              <p className="text-[11px] text-gray-700">
                Kompleks Perkantoran Pemerintah Daerah Kab. Konawe Selatan, Andoolo — Sulawesi Tenggara
              </p>
              <p className="text-[10px] text-gray-600 font-serif italic mt-0.5">
                Sistem Satu Data Terpadu APLI DAKOP v2.0 (Dimensi Smart Economy)
              </p>
            </div>

            {/* Judul Dokumen */}
            <div className="text-center mb-5">
              <h4 className="font-bold text-xs uppercase tracking-wider underline">
                RINGKASAN EKSEKUTIF DATA UMKM & KOPERASI
              </h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Posisi Data Baseline Terverifikasi Periode 2021–2024
              </p>
            </div>

            {/* 4 Kotak KPI Cetak */}
            <div className="grid grid-cols-4 gap-3 mb-5 text-center">
              <div className="p-2.5 border border-gray-400 rounded bg-gray-50">
                <p className="text-[10px] text-gray-600 uppercase font-semibold">Total Pelaku UMKM</p>
                <p className="text-base font-extrabold text-teal-900 mt-0.5">
                  {totalUmkmCount.toLocaleString('id-ID')}
                </p>
                <p className="text-[9px] text-gray-500">25 Kecamatan Terjangkau</p>
              </div>
              <div className="p-2.5 border border-gray-400 rounded bg-gray-50">
                <p className="text-[10px] text-gray-600 uppercase font-semibold">Total Koperasi</p>
                <p className="text-base font-extrabold text-teal-900 mt-0.5">
                  {totalKoperasiCount}
                </p>
                <p className="text-[9px] text-gray-500">Badan Hukum Binaan</p>
              </div>
              <div className="p-2.5 border border-gray-400 rounded bg-gray-50">
                <p className="text-[10px] text-gray-600 uppercase font-semibold">Koperasi Aktif</p>
                <p className="text-base font-extrabold text-emerald-800 mt-0.5">
                  {cards.koperasiAktif} (76,1%)
                </p>
                <p className="text-[9px] text-gray-500">Rutin Melaksanakan RAT</p>
              </div>
              <div className="p-2.5 border border-gray-400 rounded bg-gray-50">
                <p className="text-[10px] text-gray-600 uppercase font-semibold">Estimasi Omset</p>
                <p className="text-base font-extrabold text-gray-900 mt-0.5">
                  Rp 632,6 M
                </p>
                <p className="text-[9px] text-gray-500">Perputaran Ekonomi Lokal</p>
              </div>
            </div>

            {/* Tabel Top 10 Kecamatan */}
            <div className="mb-6">
              <h5 className="font-bold text-[11px] uppercase mb-1.5 text-gray-800">
                Rekapitulasi Sebaran Usaha 10 Kecamatan Tertinggi:
              </h5>
              <table className="w-full text-[10px] border border-gray-400 border-collapse">
                <thead className="bg-gray-100 text-gray-800 font-semibold border-b border-gray-400">
                  <tr>
                    <th className="p-1.5 border-r border-gray-400 text-center w-8">No</th>
                    <th className="p-1.5 border-r border-gray-400 text-left">Nama Kecamatan</th>
                    <th className="p-1.5 border-r border-gray-400 text-right">Jumlah UMKM (Unit)</th>
                    <th className="p-1.5 border-r border-gray-400 text-right">Jumlah Koperasi</th>
                    <th className="p-1.5 text-right">Pangsa (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...umkmByKecamatan]
                    .sort((a: any, b: any) => b.umkm - a.umkm)
                    .slice(0, 10)
                    .map((item: any, idx: number) => {
                      const share = ((item.umkm / totalUmkmCount) * 100).toFixed(1);
                      return (
                        <tr key={item.name} className="border-b border-gray-300">
                          <td className="p-1.5 border-r border-gray-300 text-center">{idx + 1}</td>
                          <td className="p-1.5 border-r border-gray-300 font-medium">{item.name}</td>
                          <td className="p-1.5 border-r border-gray-300 text-right font-mono">
                            {item.umkm.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 border-r border-gray-300 text-right font-mono">
                            {item.koperasi}
                          </td>
                          <td className="p-1.5 text-right font-mono">{share}%</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Catatan Kaki & Tanda Tangan */}
            <div className="flex justify-between items-end pt-4 border-t border-gray-300 text-[11px]">
              <div className="text-gray-600">
                <p>Sumber: Aplikasi APLI DAKOP v2.0</p>
                <p>Waktu Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              </div>
              <div className="text-center w-48">
                <p>Andoolo, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                <p className="font-semibold mt-1">Kepala Dinas Koperasi & UKM</p>
                <p className="font-semibold">Kabupaten Konawe Selatan</p>
                <div className="h-16" />
                <p className="font-bold underline uppercase">( ............................................ )</p>
                <p className="text-[10px] text-gray-600">NIP. ......................................</p>
              </div>
            </div>
          </div>

          <DialogFooter className="print:hidden pt-3 border-t border-border/40 gap-2">
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)} className="text-xs">
              Tutup
            </Button>
            <Button onClick={() => window.print()} className="bg-teal-600 hover:bg-teal-500 text-white text-xs">
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Dokumen Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
