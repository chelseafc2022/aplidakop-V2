'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Coins, Plus, Trash2, Building, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function PembiayaanUmkmPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    pelakuUmkmId: '',
    tahun: 2026,
    sumberPembiayaan: 'KUR (Kredit Usaha Rakyat)',
    lembagaPenyalur: 'Bank BRI',
    jumlahPinjaman: 25000000,
    statusPengajuan: 'Disetujui',
    keterangan: '',
  });

  const { data: list, isLoading } = useQuery({
    queryKey: ['pembiayaan-umkm-list'],
    queryFn: async () => (await api.get('/pembiayaan/umkm')).data,
  });

  const { data: umkmList } = useQuery({
    queryKey: ['pelaku-umkm-all'],
    queryFn: async () => (await api.get('/pelaku-umkm', { params: { limit: 100 } })).data?.data || [],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/pembiayaan/umkm', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembiayaan-umkm-list'] });
      toast.success('Data Pembiayaan UMKM berhasil dicatat');
      setIsDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menambahkan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pembiayaan/umkm/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembiayaan-umkm-list'] });
      toast.success('Data Pembiayaan berhasil dihapus');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pelakuUmkmId) {
      toast.error('Pilih Pelaku UMKM terlebih dahulu');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="px-4 lg:px-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fasilitasi Pembiayaan UMKM</h1>
          <p className="text-sm text-muted-foreground">Monitoring penyaluran permodalan dan kredit perbankan/lembaga bagi UMKM</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Penyaluran
        </Button>
      </div>

      <Card className="border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-4 py-3">Nama Usaha & Pemilik</th>
                <th className="px-4 py-3">Sumber Pembiayaan</th>
                <th className="px-4 py-3">Lembaga Penyalur</th>
                <th className="px-4 py-3 text-center">Tahun</th>
                <th className="px-4 py-3 text-right">Plafon Pinjaman</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : list?.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Belum ada catatan pembiayaan UMKM.</td></tr>
              ) : (
                list?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{item.pelakuUmkm?.namaUsaha}</div>
                      <div className="text-xs text-muted-foreground">{item.pelakuUmkm?.namaPemilik} (Kec. {item.pelakuUmkm?.kecamatan?.nama || '-'})</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{item.sumberPembiayaan}</td>
                    <td className="px-4 py-3 text-xs">{item.lembagaPenyalur || '-'}</td>
                    <td className="px-4 py-3 text-center text-xs font-mono">{item.tahun}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Rp {Number(item.jumlahPinjaman || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        {item.statusPengajuan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Penyaluran Pembiayaan UMKM</DialogTitle>
            <DialogDescription>Input data pembiayaan kredit atau bantuan modal usaha.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Pelaku UMKM *</Label>
              <Select value={formData.pelakuUmkmId} onValueChange={(val) => setFormData({ ...formData, pelakuUmkmId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Usaha / Pemilik" />
                </SelectTrigger>
                <SelectContent>
                  {umkmList?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.namaUsaha} ({u.namaPemilik})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sumber Pembiayaan</Label>
              <Select value={formData.sumberPembiayaan} onValueChange={(val) => setFormData({ ...formData, sumberPembiayaan: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KUR (Kredit Usaha Rakyat)">KUR (Kredit Usaha Rakyat)</SelectItem>
                  <SelectItem value="UMi (Ultra Mikro)">UMi (Ultra Mikro)</SelectItem>
                  <SelectItem value="Bantuan Modal Bergulir">Bantuan Modal Bergulir</SelectItem>
                  <SelectItem value="Pinjaman Komersial Bank">Pinjaman Komersial Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Lembaga Penyalur</Label>
                <Input value={formData.lembagaPenyalur} onChange={(e) => setFormData({ ...formData, lembagaPenyalur: e.target.value })} placeholder="Contoh: Bank Sultra" />
              </div>
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Input type="number" value={formData.tahun} onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jumlah Plafon Pinjaman (Rp) *</Label>
              <Input type="number" value={formData.jumlahPinjaman} onChange={(e) => setFormData({ ...formData, jumlahPinjaman: Number(e.target.value) })} required />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
