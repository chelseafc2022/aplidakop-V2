'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import {
  Building2,
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export default function KoperasiPage() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
  const [selectedJenisKoperasi, setSelectedJenisKoperasi] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    namaKoperasi: '',
    noBadanHukum: '',
    tglBadanHukum: '',
    alamat: '',
    kecamatanId: '',
    desaId: '',
    jenisKoperasiId: '',
    statusAktif: true,
    jumlahAnggota: 0,
    modalSendiri: 0,
    modalLuar: 0,
    aset: 0,
    volumeUsaha: 0,
    shu: 0,
    ketua: '',
    telpKoperasi: '',
  });

  // Queries
  const { data: kecamatanList } = useQuery({
    queryKey: ['kecamatan-list'],
    queryFn: async () => (await api.get('/wilayah/kecamatan')).data,
  });

  const { data: jenisKoperasiList } = useQuery({
    queryKey: ['jenis-koperasi-list'],
    queryFn: async () => (await api.get('/master-jenis/koperasi')).data,
  });

  const { data: koperasiResponse, isLoading } = useQuery({
    queryKey: ['koperasi', page, debouncedSearch, selectedKecamatan, selectedJenisKoperasi, selectedStatus],
    queryFn: async () => {
      const res = await api.get('/koperasi', {
        params: {
          page,
          limit,
          search: debouncedSearch || undefined,
          kecamatanId: selectedKecamatan !== 'all' ? selectedKecamatan : undefined,
          jenisKoperasiId: selectedJenisKoperasi !== 'all' ? selectedJenisKoperasi : undefined,
          statusAktif: selectedStatus === 'all' ? undefined : selectedStatus,
        },
      });
      return res.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/koperasi', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['koperasi'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Data Koperasi berhasil ditambahkan');
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan koperasi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/koperasi/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['koperasi'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Data Koperasi berhasil diperbarui');
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui koperasi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/koperasi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['koperasi'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Data Koperasi berhasil dihapus');
      setIsDeleteDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus koperasi');
    },
  });

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setFormData({
      namaKoperasi: '',
      noBadanHukum: '',
      tglBadanHukum: '',
      alamat: '',
      kecamatanId: '',
      desaId: '',
      jenisKoperasiId: '',
      statusAktif: true,
      jumlahAnggota: 0,
      modalSendiri: 0,
      modalLuar: 0,
      aset: 0,
      volumeUsaha: 0,
      shu: 0,
      ketua: '',
      telpKoperasi: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({
      namaKoperasi: item.namaKoperasi || '',
      noBadanHukum: item.noBadanHukum || '',
      tglBadanHukum: item.tglBadanHukum ? item.tglBadanHukum.substring(0, 10) : '',
      alamat: item.alamat || '',
      kecamatanId: item.kecamatanId || '',
      desaId: item.desaId || '',
      jenisKoperasiId: item.jenisKoperasiId || '',
      statusAktif: item.statusAktif ?? true,
      jumlahAnggota: item.jumlahAnggota || 0,
      modalSendiri: Number(item.modalSendiri) || 0,
      modalLuar: Number(item.modalLuar) || 0,
      aset: Number(item.aset) || 0,
      volumeUsaha: Number(item.volumeUsaha) || 0,
      shu: Number(item.shu) || 0,
      ketua: item.ketua || '',
      telpKoperasi: item.telpKoperasi || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaKoperasi) {
      toast.error('Harap isi Nama Koperasi');
      return;
    }

    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const items = koperasiResponse?.data || [];
  const meta = koperasiResponse?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <div className="px-4 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Data Koperasi</h1>
          <p className="text-sm text-muted-foreground">
            Pengelolaan badan hukum, status kelembagaan, serta data keuangan koperasi se-Konawe Selatan
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Koperasi
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/60">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Cari Nama Koperasi, No Badan Hukum, Ketua..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setPage(1); }}>
              <SelectTrigger className="h-9 w-[130px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Non-Aktif</SelectItem>
              </SelectContent>
            </Select>

            {/* Kecamatan Filter */}
            <Select value={selectedKecamatan} onValueChange={(val) => { setSelectedKecamatan(val); setPage(1); }}>
              <SelectTrigger className="h-9 w-[160px] text-xs">
                <SelectValue placeholder="Kecamatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kecamatan</SelectItem>
                {kecamatanList?.map((kec: any) => (
                  <SelectItem key={kec.id} value={kec.id}>{kec.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Jenis Koperasi Filter */}
            <Select value={selectedJenisKoperasi} onValueChange={(val) => { setSelectedJenisKoperasi(val); setPage(1); }}>
              <SelectTrigger className="h-9 w-[170px] text-xs">
                <SelectValue placeholder="Jenis Koperasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {jenisKoperasiList?.map((jk: any) => (
                  <SelectItem key={jk.id} value={jk.id}>{jk.uraian}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-4 py-3">Nama Koperasi</th>
                <th className="px-4 py-3">Badan Hukum & Ketua</th>
                <th className="px-4 py-3">Jenis & Wilayah</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Anggota</th>
                <th className="px-4 py-3 text-right">Aset (Rp)</th>
                <th className="px-4 py-3 text-right">SHU (Rp)</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Memuat data Koperasi...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada data koperasi ditemukan.
                  </td>
                </tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{item.namaKoperasi}</div>
                      <div className="text-xs text-muted-foreground">{item.telpKoperasi || item.alamat || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-mono">{item.noBadanHukum || '-'}</div>
                      <div className="text-muted-foreground">Ketua: {item.ketua || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <Badge variant="outline" className="border-teal-500/30 text-teal-600 dark:text-teal-400 font-normal">
                        {item.jenisKoperasi?.uraian || 'Umum'}
                      </Badge>
                      <div className="text-muted-foreground mt-1">Kec. {item.kecamatan?.nama || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.statusAktif ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="font-medium">
                          Non-Aktif
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono font-medium">
                      {item.jumlahAnggota || 0} Org
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono font-medium">
                      Rp {Number(item.aset || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono font-medium">
                      Rp {Number(item.shu || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-teal-500"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDeleteDialogOpen(true);
                          }}
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

        {/* Pagination */}
        <div className="p-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Menampilkan {items.length} dari {meta.total} data koperasi
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>
              Halaman {meta.page} dari {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Edit Data Koperasi' : 'Tambah Koperasi Baru'}
            </DialogTitle>
            <DialogDescription>
              Isi data kelembagaan dan finansial koperasi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="namaKoperasi">Nama Koperasi *</Label>
                <Input
                  id="namaKoperasi"
                  value={formData.namaKoperasi}
                  onChange={(e) => setFormData({ ...formData, namaKoperasi: e.target.value })}
                  placeholder="Contoh: KSP Bina Usaha Mandiri"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noBadanHukum">No. Badan Hukum</Label>
                <Input
                  id="noBadanHukum"
                  value={formData.noBadanHukum}
                  onChange={(e) => setFormData({ ...formData, noBadanHukum: e.target.value })}
                  placeholder="AHU-xxxx.AH.01..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tglBadanHukum">Tgl. Badan Hukum</Label>
                <Input
                  id="tglBadanHukum"
                  type="date"
                  value={formData.tglBadanHukum}
                  onChange={(e) => setFormData({ ...formData, tglBadanHukum: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ketua">Nama Ketua Koperasi</Label>
                <Input
                  id="ketua"
                  value={formData.ketua}
                  onChange={(e) => setFormData({ ...formData, ketua: e.target.value })}
                  placeholder="Nama ketua"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telpKoperasi">No. Telp / Kontak</Label>
                <Input
                  id="telpKoperasi"
                  value={formData.telpKoperasi}
                  onChange={(e) => setFormData({ ...formData, telpKoperasi: e.target.value })}
                  placeholder="08xxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kecamatanId">Kecamatan</Label>
                <Select
                  value={formData.kecamatanId}
                  onValueChange={(val) => setFormData({ ...formData, kecamatanId: val })}
                >
                  <SelectTrigger id="kecamatanId">
                    <SelectValue placeholder="Pilih Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {kecamatanList?.map((kec: any) => (
                      <SelectItem key={kec.id} value={kec.id}>{kec.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jenisKoperasiId">Jenis Koperasi</Label>
                <Select
                  value={formData.jenisKoperasiId}
                  onValueChange={(val) => setFormData({ ...formData, jenisKoperasiId: val })}
                >
                  <SelectTrigger id="jenisKoperasiId">
                    <SelectValue placeholder="Pilih Jenis Koperasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisKoperasiList?.map((jk: any) => (
                      <SelectItem key={jk.id} value={jk.id}>{jk.uraian}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="alamat">Alamat Lengkap Kantor</Label>
                <Input
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Jl. Poros..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jumlahAnggota">Jumlah Anggota (Orang)</Label>
                <Input
                  id="jumlahAnggota"
                  type="number"
                  value={formData.jumlahAnggota}
                  onChange={(e) => setFormData({ ...formData, jumlahAnggota: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aset">Total Aset (Rp)</Label>
                <Input
                  id="aset"
                  type="number"
                  value={formData.aset}
                  onChange={(e) => setFormData({ ...formData, aset: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modalSendiri">Modal Sendiri (Rp)</Label>
                <Input
                  id="modalSendiri"
                  type="number"
                  value={formData.modalSendiri}
                  onChange={(e) => setFormData({ ...formData, modalSendiri: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shu">SHU (Sisa Hasil Usaha Rp)</Label>
                <Input
                  id="shu"
                  type="number"
                  value={formData.shu}
                  onChange={(e) => setFormData({ ...formData, shu: Number(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2 sm:col-span-2 pt-2">
                <Switch
                  id="statusAktif"
                  checked={formData.statusAktif}
                  onCheckedChange={(checked) => setFormData({ ...formData, statusAktif: checked })}
                />
                <Label htmlFor="statusAktif" className="cursor-pointer font-medium">
                  Koperasi Aktif (Rutin melaksanakan Rapat Anggota Tahunan / RAT)
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white">
                Simpan Koperasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Data Koperasi?</DialogTitle>
            <DialogDescription>
              Koperasi <strong>{selectedItem?.namaKoperasi}</strong> akan dihapus permanen dari basis data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
            >
              Hapus Permanen
            </AlertDialogAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
