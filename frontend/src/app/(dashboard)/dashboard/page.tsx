'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Store,
  Building2,
  Filter,
  Plus,
  RefreshCw,
  TrendingUp,
  Printer,
  Users,
  ArrowUpRight,
  PieChart as PieIcon,
  FileText,
  Award,
  Layers,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [selectedPeriode, setSelectedPeriode] = useState<string>('all');
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
  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary', selectedKecamatan, selectedPeriode],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary', {
        params: {
          kecamatanId: selectedKecamatan !== 'all' ? selectedKecamatan : undefined,
          periode: selectedPeriode,
        },
      });
      return res.data;
    },
  });

  const cards = summary?.cards || {
    totalUmkm: 0,
    totalCatatan: 0,
    pelakuBaru: 0,
    totalKoperasi: 0,
    koperasiAktif: 0,
    koperasiNonAktif: 0,
  };

  const umkmByKecamatan = summary?.charts?.umkmByKecamatan || [];
  const umkmByJenisUsaha = summary?.charts?.umkmByJenisUsaha || [];
  const koperasiByJenis = summary?.charts?.koperasiByJenis || [];
  const topUmkmByJenisUsaha = umkmByJenisUsaha.slice(0, 8);
  const topKoperasiByJenis = koperasiByJenis.slice(0, 8);
  const breakdown = summary?.breakdown || {
    baseline: 0,
    periode2025: 0,
    pendataanUlang2025: 0,
    pelakuBaru2025: 0,
    periode2026: 0,
    pendataanUlang2026: 0,
    pelakuBaru2026: 0,
    totalCatatanSemuaPeriode: 0,
  };

  // Top 5 Sentra Kecamatan
  const topKecamatan = [...umkmByKecamatan]
    .sort((a: any, b: any) => b.umkm - a.umkm)
    .slice(0, 5);

  const totalUmkmCount = cards.totalUmkm || 0;
  const totalKoperasiCount = cards.totalKoperasi || 0;
  const periodLabel = selectedPeriode === 'baseline'
    ? 'Baseline 2021–2024'
    : selectedPeriode === '2025'
      ? 'Pemutakhiran 2025'
      : selectedPeriode === '2026'
        ? 'Pemutakhiran 2026'
        : 'Semua Periode';
  return (
    <div className="space-y-5 px-4 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-border/40 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{periodLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

          <div className="w-[160px] shrink-0">
            <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Periode Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Semua Periode</SelectItem>
                <SelectItem value="baseline" className="text-xs">Baseline (2021–2024)</SelectItem>
                <SelectItem value="2025" className="text-xs">Pemutakhiran 2025</SelectItem>
                <SelectItem value="2026" className="text-xs">Pemutakhiran 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            title="Muat ulang data statistik"
            className="h-9 w-9 p-0 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-9 px-3 text-xs border-border/80 hover:bg-muted shrink-0"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
            Cetak
          </Button> */}

          <Button asChild size="sm" className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs shrink-0">
            <Link href="/pelaku-umkm">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Tambah UMKM
            </Link>
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Data gagal dimuat. Silakan muat ulang.
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Pelaku Unik
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1">
                  {cards.totalUmkm.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">NIK unik</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs hover:border-blue-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Catatan Pendataan
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1">
                  {cards.totalCatatan.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Seluruh periode</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs hover:border-amber-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Pelaku Baru
                </p>
                <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {cards.pelakuBaru.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Di luar baseline</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs hover:border-teal-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Koperasi
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1">
                  {cards.totalKoperasi.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{cards.koperasiAktif} aktif · {cards.koperasiNonAktif} tidak aktif</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Data per periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <PeriodMetric label="Baseline 2021–2024" value={breakdown.baseline} tone="slate" />
            <PeriodMetric label="Snapshot 2025" value={breakdown.periode2025} tone="blue" />
            <PeriodMetric label="Pendataan ulang 2025" value={breakdown.pendataanUlang2025} tone="emerald" />
            <PeriodMetric label="Pelaku baru 2025" value={breakdown.pelakuBaru2025} tone="amber" />
            <PeriodMetric label="Snapshot 2026" value={breakdown.periode2026} tone="violet" />
          </div>
        </CardContent>
      </Card>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sebaran Wilayah Kecamatan (2 Cols) */}
        <Card className="lg:col-span-2 border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">Sebaran per kecamatan</CardTitle>
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
                  <Bar dataKey="umkm" name="UMKM" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="koperasi" name="Koperasi" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribusi Sektor Usaha UMKM & Bentuk Koperasi (1 Col) */}
        <Card className="border-border/60 shadow-xs flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Komposisi data</span>
              <PieIcon className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
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
                        data={topUmkmByJenisUsaha}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {topUmkmByJenisUsaha.map((_: any, index: number) => (
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
                  {topUmkmByJenisUsaha.map((ju: any, idx: number) => (
                    <div key={`umkm-kind-${ju.id || 'unknown'}-${idx}`} className="flex items-center justify-between text-muted-foreground py-0.5">
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
                        data={topKoperasiByJenis}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {topKoperasiByJenis.map((_: any, index: number) => (
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
                  {topKoperasiByJenis.map((kop: any, idx: number) => (
                    <div key={`koperasi-kind-${kop.id || 'unknown'}-${idx}`} className="flex items-center justify-between text-muted-foreground py-0.5">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Kecamatan teratas
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {topKecamatan.map((kec: any, idx: number) => {
              const pct = totalUmkmCount > 0 ? ((kec.umkm / totalUmkmCount) * 100).toFixed(1) : '0.0';
              return (
                <div key={`top-kecamatan-${kec.id || kec.name}-${idx}`} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1.5">
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

        <Card className="border-border/60 shadow-xs flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Akses cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 flex-1 flex flex-col justify-between">
            <Link
              href="/pelaku-umkm"
              className="p-2.5 sm:p-3 rounded-lg border border-border/50 hover:border-emerald-500/40 bg-muted/20 hover:bg-emerald-500/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      Pelaku UMKM ({totalUmkmCount.toLocaleString('id-ID')})
                    </h4>
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* Modul 2: Buku Induk Koperasi */}
            <Link
              href="/koperasi"
              className="p-2.5 sm:p-3 rounded-lg border border-border/50 hover:border-teal-500/40 bg-muted/20 hover:bg-teal-500/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                      Data Koperasi ({totalKoperasiCount.toLocaleString('id-ID')})
                    </h4>
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-teal-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* Modul 3: Fasilitasi Pembiayaan & Akses Permodalan */}
            <Link
              href="/pembiayaan"
              className="p-2.5 sm:p-3 rounded-lg border border-border/50 hover:border-blue-500/40 bg-muted/20 hover:bg-blue-500/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      Pembiayaan
                    </h4>
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* Modul 4: Portofolio & Dokumen Inovasi */}
            <Link
              href="/inovasi"
              className="p-2.5 sm:p-3 rounded-lg border border-border/50 hover:border-amber-500/40 bg-muted/20 hover:bg-amber-500/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                      Inovasi Smart City
                    </h4>
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2" />
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
                Posisi Data {periodLabel}
              </p>
            </div>

            {/* 4 Kotak KPI Cetak */}
            <div className="grid grid-cols-4 gap-3 mb-5 text-center">
              <div className="p-2.5 border border-gray-400 rounded bg-gray-50">
                <p className="text-[10px] text-gray-600 uppercase font-semibold">Pelaku Unik</p>
                <p className="text-base font-extrabold text-teal-900 mt-0.5">
                  {totalUmkmCount.toLocaleString('id-ID')}
                </p>
                <p className="text-[9px] text-gray-500">NIK tidak dihitung ganda</p>
              </div>
              <div className="p-2.5 border border-gray-400 rounded bg-gray-50">
                <p className="text-[10px] text-gray-600 uppercase font-semibold">Catatan Pendataan</p>
                <p className="text-base font-extrabold text-teal-900 mt-0.5">
                  {cards.totalCatatan.toLocaleString('id-ID')}
                </p>
                <p className="text-[9px] text-gray-500">Kemunculan setiap periode</p>
              </div>
              <div className="p-2.5 border border-gray-400 rounded bg-gray-50">
                <p className="text-[10px] text-gray-600 uppercase font-semibold">Pelaku Baru</p>
                <p className="text-base font-extrabold text-amber-800 mt-0.5">
                  {cards.pelakuBaru.toLocaleString('id-ID')}
                </p>
                <p className="text-[9px] text-gray-500">Belum ada di baseline</p>
              </div>
              <div className="p-2.5 border border-gray-400 rounded bg-gray-50">
                <p className="text-[10px] text-gray-600 uppercase font-semibold">Total Koperasi</p>
                <p className="text-base font-extrabold text-teal-900 mt-0.5">
                  {totalKoperasiCount.toLocaleString('id-ID')}
                </p>
                <p className="text-[9px] text-gray-500">{cards.koperasiAktif} aktif/sehat · {cards.koperasiNonAktif} tidak aktif</p>
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
                      const share = totalUmkmCount > 0 ? ((item.umkm / totalUmkmCount) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={`print-kecamatan-${item.id || item.name}-${idx}`} className="border-b border-gray-300">
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

function PeriodMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'blue' | 'emerald' | 'amber' | 'violet';
}) {
  const toneClasses = {
    slate: 'border-slate-500/20 bg-slate-500/5 text-slate-700 dark:text-slate-300',
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300',
    violet: 'border-violet-500/20 bg-violet-500/5 text-violet-700 dark:text-violet-300',
  };

  return (
    <div className={`rounded-lg border p-3 ${toneClasses[tone]}`}>
      <p className="text-[11px] font-medium opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value.toLocaleString('id-ID')}</p>
    </div>
  );
}
