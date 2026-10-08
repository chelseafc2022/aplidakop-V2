'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Boxes, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function JenisKoperasiPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uraian, setUraian] = useState('');

  const { data: list, isLoading } = useQuery({
    queryKey: ['jenis-koperasi-list'],
    queryFn: async () => (await api.get('/master-jenis/koperasi')).data,
  });

  const createMutation = useMutation({
    mutationFn: (uraian: string) => api.post('/master-jenis/koperasi', { uraian }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jenis-koperasi-list'] });
      toast.success('Jenis Koperasi berhasil ditambahkan');
      setIsDialogOpen(false);
      setUraian('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menambahkan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, uraian }: { id: string; uraian: string }) => api.put(`/master-jenis/koperasi/${id}`, { uraian }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jenis-koperasi-list'] });
      toast.success('Jenis Koperasi berhasil diperbarui');
      setIsDialogOpen(false);
      setEditingItem(null);
      setUraian('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal memperbarui'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/master-jenis/koperasi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jenis-koperasi-list'] });
      toast.success('Jenis Koperasi berhasil dihapus');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus'),
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setUraian('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setUraian(item.uraian);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uraian.trim()) return;
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, uraian });
    } else {
      createMutation.mutate(uraian);
    }
  };

  return (
    <div className="px-4 lg:px-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Jenis Koperasi</h1>
          <p className="text-sm text-muted-foreground">Klasifikasi dan bentuk kelembagaan koperasi</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jenis Koperasi
        </Button>
      </div>

      <Card className="border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Bentuk / Jenis Koperasi</th>
                <th className="px-4 py-3 text-center">Jumlah Koperasi</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : list?.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Belum ada data.</td></tr>
              ) : (
                list?.map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground w-12">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-teal-500" />
                      {item.uraian}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs">{item._count?.koperasis || 0}</td>
                    <td className="px-4 py-3 text-center w-28">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-teal-500" onClick={() => handleOpenEdit(item)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Jenis Koperasi' : 'Tambah Jenis Koperasi'}</DialogTitle>
            <DialogDescription>Masukkan nama jenis atau bentuk koperasi.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Contoh: Koperasi Simpan Pinjam (KSP)"
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              required
            />
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
