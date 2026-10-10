'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Boxes, Edit, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type JenisKoperasi = { id: string; uraian: string; koperasiCount: number; createdAt?: string };

export default function JenisKoperasiPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JenisKoperasi | null>(null);
  const [pendingDelete, setPendingDelete] = useState<JenisKoperasi | null>(null);
  const [search, setSearch] = useState('');
  const [uraian, setUraian] = useState('');

  const { data: list = [], isLoading, isFetching, isError, refetch } = useQuery<JenisKoperasi[]>({
    queryKey: ['jenis-koperasi-list'],
    queryFn: async () => (await api.get('/master-jenis/koperasi')).data,
    staleTime: 5 * 60 * 1000,
  });
  const filteredList = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('id-ID');
    return keyword ? list.filter((item) => item.uraian.toLocaleLowerCase('id-ID').includes(keyword)) : list;
  }, [list, search]);

  const finishSave = () => {
    queryClient.invalidateQueries({ queryKey: ['jenis-koperasi-list'] });
    queryClient.invalidateQueries({ queryKey: ['koperasi'] });
    setDialogOpen(false); setEditingItem(null); setUraian('');
  };
  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/master-jenis/koperasi', { uraian: name }),
    onSuccess: () => { finishSave(); toast.success('Jenis koperasi berhasil ditambahkan'); },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Gagal menambahkan jenis koperasi'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.put(`/master-jenis/koperasi/${id}`, { uraian: name }),
    onSuccess: () => { finishSave(); toast.success('Jenis koperasi berhasil diperbarui'); },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Gagal memperbarui jenis koperasi'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/master-jenis/koperasi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jenis-koperasi-list'] });
      setPendingDelete(null); toast.success('Jenis koperasi berhasil dihapus');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Gagal menghapus jenis koperasi'),
  });
  const saving = createMutation.isPending || updateMutation.isPending;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = uraian.trim();
    if (!name) return toast.error('Nama jenis koperasi wajib diisi');
    if (editingItem) updateMutation.mutate({ id: editingItem.id, name });
    else createMutation.mutate(name);
  };

  return (
    <div className="px-4 lg:px-8 space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/40 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Jenis Koperasi</h1>
          <p className="text-sm text-muted-foreground">Klasifikasi resmi yang digunakan oleh seluruh data koperasi</p>
        </div>
        <Button onClick={() => { setEditingItem(null); setUraian(''); setDialogOpen(true); }} className="bg-teal-600 text-white hover:bg-teal-500">
          <Plus className="mr-2 h-4 w-4" /> Tambah Jenis Koperasi
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari jenis koperasi..." className="pl-9" />
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground sm:justify-end">
          <span>{filteredList.length.toLocaleString('id-ID')} dari {list.length.toLocaleString('id-ID')} jenis</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Muat ulang
          </Button>
        </div>
      </div>

      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/40 bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3">No</th><th className="px-4 py-3">Jenis Koperasi</th><th className="px-4 py-3 text-center">Jumlah Koperasi</th><th className="px-4 py-3 text-center">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Memuat data...</td></tr>
                : isError ? <tr><td colSpan={4} className="p-8 text-center text-destructive"><AlertCircle className="mx-auto mb-2 h-5 w-5" />Master Jenis Koperasi gagal dimuat.</td></tr>
                  : filteredList.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Tidak ada jenis koperasi yang sesuai.</td></tr>
                    : filteredList.map((item, index) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="w-12 px-4 py-3 text-xs text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><Boxes className="h-4 w-4 text-teal-500" />{item.uraian}</span></td>
                        <td className="px-4 py-3 text-center font-mono text-xs">{item.koperasiCount.toLocaleString('id-ID')}</td>
                        <td className="w-28 px-4 py-3"><div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-teal-500" aria-label={`Edit ${item.uraian}`} onClick={() => { setEditingItem(item); setUraian(item.uraian); setDialogOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" aria-label={`Hapus ${item.uraian}`} onClick={() => setPendingDelete(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div></td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!saving) setDialogOpen(open); }}>
        <DialogContent><DialogHeader><DialogTitle>{editingItem ? 'Edit Jenis Koperasi' : 'Tambah Jenis Koperasi'}</DialogTitle><DialogDescription>Nama ini akan menjadi pilihan baku pada data koperasi.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-4"><Input value={uraian} onChange={(event) => setUraian(event.target.value)} placeholder="Contoh: Koperasi Produsen" required />
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button><Button type="submit" className="bg-teal-600 text-white hover:bg-teal-500" disabled={saving || !uraian.trim()}>{saving ? 'Menyimpan...' : 'Simpan'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && !deleteMutation.isPending && setPendingDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus jenis koperasi?</AlertDialogTitle><AlertDialogDescription>
          {pendingDelete && pendingDelete.koperasiCount > 0 ? `${pendingDelete.uraian} masih digunakan oleh ${pendingDelete.koperasiCount.toLocaleString('id-ID')} koperasi sehingga tidak dapat dihapus.` : `${pendingDelete?.uraian || 'Jenis ini'} akan dihapus permanen.`}
        </AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel><AlertDialogAction disabled={!pendingDelete || pendingDelete.koperasiCount > 0 || deleteMutation.isPending} onClick={(event) => { event.preventDefault(); if (pendingDelete) deleteMutation.mutate(pendingDelete.id); }} className="bg-destructive text-destructive-foreground">{deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
