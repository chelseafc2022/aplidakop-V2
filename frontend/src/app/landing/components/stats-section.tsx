"use client"

import {
  Store,
  Building2,
  MapPin,
  Layers,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DotPattern } from '@/components/dot-pattern'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export function StatsSection() {
  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      try {
        const res = await api.get('/dashboard/summary');
        return res.data;
      } catch {
        return null;
      }
    },
  });

  const totalUmkm = summary?.cards?.totalUmkm ? summary.cards.totalUmkm.toLocaleString('id-ID') : '17.671+';
  const totalKoperasi = summary?.cards?.totalKoperasi ? summary.cards.totalKoperasi.toLocaleString('id-ID') : '326';
  const totalJenis = summary?.cards?.totalJenis || 37;

  const stats = [
    {
      icon: Store,
      value: totalUmkm,
      label: 'Pelaku UMKM Terdata',
      description: 'Tersebar di seluruh desa & kelurahan',
    },
    {
      icon: Building2,
      value: totalKoperasi,
      label: 'Badan Usaha Koperasi',
      description: 'Koperasi aktif dan binaan daerah',
    },
    {
      icon: MapPin,
      value: '25',
      label: 'Kecamatan Terintegrasi',
      description: 'Cakupan 100% wilayah Kab. Konawe Selatan',
    },
    {
      icon: Layers,
      value: `${totalJenis} Sektor`,
      label: 'Klasifikasi Jenis Usaha',
      description: 'Sembako, kuliner, pertanian, jasa, dll',
    },
  ];

  return (
    <section className="py-12 sm:py-16 relative">
      {/* Background with transparency */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-secondary/20" />
      <DotPattern className="opacity-75" size="md" fadeStyle="circle" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="text-center bg-background/60 backdrop-blur-sm border-border/50 py-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {stat.value}
                  </h3>
                  <p className="font-semibold text-foreground">{stat.label}</p>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
