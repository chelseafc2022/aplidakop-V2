'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Wallet, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function PembiayaanKoperasiPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    koperasiId: '',
    tahun: 2026,
    sumberPembiayaan: 'LPDB-KUMKM',
    lembagaPenyalur: 'Kemenkop UKM / LPDB',
    jumlahPinjaman: 150000000,
    statusPengajuan: 'Disetujui',
    keterangan: '',
  });

  const { data: list, isLoading } = useQuery({
    queryKey: ['pembiayaan-koperasi-list'],
    queryFn: async () => (await api.get('/pembiayaan/koperasi')).data,
  });

  const { data: koperasiList } = useQuery({
    queryKey: ['koperasi-all'],
    queryFn: async () => (await api.get('/koperasi', { params: { limit: 100 } })).data?.data || [],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/pembiayaan/koperasi', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembiayaan-koperasi-list'] });
      toast.success('Data Pembiayaan Koperasi berhasil dicatat');
      setIsDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menambahkan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pembiayaan/koperasi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembiayaan-koperasi-list'] });
      toast.success('Data Pembiayaan berhasil dihapus');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.koperasiId) {
      toast.error('Pilih Koperasi terlebih dahulu');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="px-4 lg:px-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fasilitasi Pembiayaan Koperasi</h1>
          <p className="text-sm text-muted-foreground">Monitoring fasilitas permodalan LPDB dan pinjaman bagi koperasi</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-teal-600 hover:bg-teal-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Penyaluran
        </Button>
      </div>

      <Card className="border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-4 py-3">Nama Koperasi</th>
                <th className="px-4 py-3">Sumber Fasilitas</th>
                <th className="px-4 py-3">Penyalur / Program</th>
                <th className="px-4 py-3 text-center">Tahun</th>
                <th className="px-4 py-3 text-right">Plafon Pembiayaan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : list?.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Belum ada catatan pembiayaan koperasi.</td></tr>
              ) : (
                list?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{item.koperasi?.namaKoperasi}</div>
                      <div className="text-xs text-muted-foreground">Kec. {item.koperasi?.kecamatan?.nama || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{item.sumberPembiayaan}</td>
                    <td className="px-4 py-3 text-xs">{item.lembagaPenyalur || '-'}</td>
                    <td className="px-4 py-3 text-center text-xs font-mono">{item.tahun}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                      Rp {Number(item.jumlahPinjaman || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className="bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30">
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
            <DialogTitle>Catat Pembiayaan Koperasi</DialogTitle>
            <DialogDescription>Input data pembiayaan LPDB atau permodalan koperasi.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Koperasi *</Label>
              <Select value={formData.koperasiId} onValueChange={(val) => setFormData({ ...formData, koperasiId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Koperasi" />
                </SelectTrigger>
                <SelectContent>
                  {koperasiList?.map((k: any) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.namaKoperasi} (Kec. {k.kecamatan?.nama || '-'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sumber Fasilitas</Label>
              <Input value={formData.sumberPembiayaan} onChange={(e) => setFormData({ ...formData, sumberPembiayaan: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Lembaga Penyalur</Label>
                <Input value={formData.lembagaPenyalur} onChange={(e) => setFormData({ ...formData, lembagaPenyalur: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Input type="number" value={formData.tahun} onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jumlah Pembiayaan (Rp) *</Label>
              <Input type="number" value={formData.jumlahPinjaman} onChange={(e) => setFormData({ ...formData, jumlahPinjaman: Number(e.target.value) })} required />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
