'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Store,
  Building2,
  Coins,
  MapPin,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  BarChart3,
  Users2,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ModeToggle } from '@/components/mode-toggle';

export default function LandingPage() {
  const { data: summary } = useQuery({
    queryKey: ['landing-summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const cards = summary?.cards || {
    totalUmkm: 3,
    totalKoperasi: 2,
    koperasiAktif: 2,
    koperasiNonAktif: 0,
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20 selection:text-emerald-500">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                APLI DAKOP UMKM
              </span>
              <span className="block text-[11px] text-muted-foreground font-medium">
                Kabupaten Konawe Selatan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ModeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-emerald-600 dark:text-emerald-400 font-semibold gap-1 hover:bg-emerald-500/10">
              <Link href="/inovasi">
                <Award className="w-4 h-4 mr-1 text-emerald-500" />
                Inovasi Smart City
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/dashboard">Lihat Dashboard</Link>
            </Button>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Link href="/login">
                Masuk Sistem
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-emerald-500/10 via-transparent to-transparent -z-10" />
        <div className="container mx-auto px-4 sm:px-8 text-center max-w-4xl">
          <Link
            href="/inovasi"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-6 hover:bg-emerald-500/20 transition-colors"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            Inovasi Smart City 2026: Dimensi Smart Economy Kab. Konawe Selatan
          </Link>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15]">
            Digitalisasi & Pemberdayaan{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Koperasi & UMKM
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Platform terpadu pendataan, pemantauan status kelembagaan koperasi, fasilitas pembiayaan,
            serta analisis statistik pelaku usaha mikro, kecil, dan menengah di 25 kecamatan Konawe Selatan.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 px-8">
              <Link href="/dashboard">
                Akses Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
              <Link href="/inovasi">
                <Award className="w-5 h-5 mr-2 text-emerald-500" />
                Inovasi Smart City
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/login">Login Operator</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Live Statistics Counter Cards */}
      <section className="py-12 border-y border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Pelaku UMKM
                  </span>
                  <Store className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-3xl font-extrabold text-foreground">{cards.totalUmkm}</div>
                <p className="text-xs text-muted-foreground mt-1">Terdata aktif di 25 Kecamatan</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Koperasi
                  </span>
                  <Building2 className="w-5 h-5 text-teal-500" />
                </div>
                <div className="text-3xl font-extrabold text-foreground">{cards.totalKoperasi}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-emerald-500 font-semibold">{cards.koperasiAktif}</span> Berstatus Aktif
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Kecamatan
                  </span>
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-extrabold text-foreground">25</div>
                <p className="text-xs text-muted-foreground mt-1">Cakupan wilayah Kab. Konsel</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Jenis Sektor Usaha
                  </span>
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-extrabold text-foreground">9</div>
                <p className="text-xs text-muted-foreground mt-1">Kuliner, Kriya, Kelautan, dll.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Fitur Unggulan Sistem Informasi
            </h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Mendukung akurasi dan kecepatan pelaporan statistik bagi pengambil kebijakan dan masyarakat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-border/50 bg-card/40 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Pendataan Terintegrasi</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pencatatan NIK, NIB, legalitas PIRT, sertifikasi Halal, dan HAKI untuk setiap pelaku UMKM.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card/40 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Fasilitasi Pembiayaan</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Monitoring penyaluran KUR, LPDB, perbankan, dan bantuan modal bagi UMKM serta koperasi.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card/40 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Visualisasi & Laporan Dinamis</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Grafik sebaran per kecamatan dan jenis usaha secara real-time untuk kemudahan analisis kebijakan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© 2026 Dinas Koperasi dan UMKM Kabupaten Konawe Selatan. All rights reserved.</p>
          <p className="mt-1">APLI DAKOP v2 — Next.js 16 + TanStack Query + Tailwind + NestJS + PostgreSQL</p>
        </div>
      </footer>
    </div>
  );
}
