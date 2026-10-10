'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { AlertCircle, Edit, Plus, RefreshCw, Search, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type JenisUsahaItem = {
  id: string;
  uraian: string;
  pelakuCount: number;
  createdAt?: string;
};

export default function JenisUsahaPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JenisUsahaItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<JenisUsahaItem | null>(null);
  const [search, setSearch] = useState('');
  const [uraian, setUraian] = useState('');

  const { data: list = [], isLoading, isFetching, isError, refetch } = useQuery<JenisUsahaItem[]>({
    queryKey: ['jenis-usaha-list'],
    queryFn: async () => (await api.get('/master-jenis/usaha')).data,
    staleTime: 5 * 60 * 1000,
  });

  const filteredList = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('id-ID');
    if (!keyword) return list;
    return list.filter((item) => item.uraian.toLocaleLowerCase('id-ID').includes(keyword));
  }, [list, search]);

  const createMutation = useMutation({
    mutationFn: (uraian: string) => api.post('/master-jenis/usaha', { uraian }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jenis-usaha-list'] });
      toast.success('Jenis Usaha berhasil ditambahkan');
      setIsDialogOpen(false);
      setUraian('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menambahkan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, uraian }: { id: string; uraian: string }) => api.put(`/master-jenis/usaha/${id}`, { uraian }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jenis-usaha-list'] });
      toast.success('Jenis Usaha berhasil diperbarui');
      setIsDialogOpen(false);
      setEditingItem(null);
      setUraian('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal memperbarui'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/master-jenis/usaha/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jenis-usaha-list'] });
      toast.success('Jenis Usaha berhasil dihapus');
      setPendingDelete(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus'),
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setUraian('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: JenisUsahaItem) => {
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

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open && !isSaving) {
      setEditingItem(null);
      setUraian('');
    }
  };

  return (
    <div className="px-4 lg:px-8 space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/40 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Jenis Usaha</h1>
          <p className="text-sm text-muted-foreground">Kategori dan klasifikasi sektor usaha pelaku UMKM</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jenis Usaha
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari jenis usaha..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground sm:justify-end">
          <span>{filteredList.length.toLocaleString('id-ID')} dari {list.length.toLocaleString('id-ID')} kategori</span>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Muat ulang
          </Button>
        </div>
      </div>

      <Card className="border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Sektor / Jenis Usaha</th>
                <th className="px-4 py-3 text-center">Jumlah UMKM</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-destructive">
                    <AlertCircle className="mx-auto mb-2 h-5 w-5" />
                    Master Jenis Usaha gagal dimuat.
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Tidak ada jenis usaha yang sesuai.</td></tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground w-12">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      {item.uraian}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs">{item.pelakuCount.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-center w-28">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-emerald-500"
                          onClick={() => handleOpenEdit(item)}
                          aria-label={`Edit ${item.uraian}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => setPendingDelete(item)}
                          disabled={deleteMutation.isPending}
                          aria-label={`Hapus ${item.uraian}`}
                        >
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Jenis Usaha' : 'Tambah Jenis Usaha'}</DialogTitle>
            <DialogDescription>Masukkan nama kategori atau sektor jenis usaha baru.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Contoh: Kuliner & Olahan Pangan"
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={isSaving}>Batal</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white" disabled={isSaving || !uraian.trim()}>
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && !deleteMutation.isPending && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus jenis usaha?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && pendingDelete.pelakuCount > 0
                ? `${pendingDelete.uraian} masih digunakan oleh ${pendingDelete.pelakuCount.toLocaleString('id-ID')} pelaku UMKM sehingga tidak dapat dihapus.`
                : `${pendingDelete?.uraian || 'Jenis usaha ini'} akan dihapus permanen dari master data.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {pendingDelete && pendingDelete.pelakuCount > 0 ? 'Tutup' : 'Batal'}
            </AlertDialogCancel>
            {pendingDelete && pendingDelete.pelakuCount === 0 && (
              <AlertDialogAction
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(event) => {
                  event.preventDefault();
                  deleteMutation.mutate(pendingDelete.id);
                }}
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
