'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import {
  Store,
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  CheckCircle,
  FileSpreadsheet,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export default function PelakuUmkmPage() {
  const queryClient = useQueryClient();

  // Search & 3 Filters state: Jenis Usaha, Kecamatan, Desa
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
  const [selectedDesa, setSelectedDesa] = useState<string>('all');
  const [selectedJenisUsaha, setSelectedJenisUsaha] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Dialog & Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    namaPemilik: '',
    nik: '',
    kk: '',
    nohp: '',
    namaUsaha: '',
    tahunBerdiri: '2024',
    modalSendiri: 0,
    modalLuar: 0,
    nib: '',
    pirt: '',
    halal: '',
    haki: '',
    keterangan: '',
    kecamatanId: '',
    desaId: '',
    jenisUsahaId: '',
  });

  // Queries
  const { data: kecamatanList } = useQuery({
    queryKey: ['kecamatan-list'],
    queryFn: async () => (await api.get('/wilayah/kecamatan')).data,
    staleTime: 10 * 60 * 1000,
  });

  const { data: jenisUsahaList } = useQuery({
    queryKey: ['jenis-usaha-list'],
    queryFn: async () => (await api.get('/master-jenis/usaha')).data,
    staleTime: 10 * 60 * 1000,
  });

  // Query desa untuk filter bar (dinamis berdasarkan kecamatan yang dipilih)
  const { data: filterDesaList, isLoading: isFilterDesaLoading } = useQuery({
    queryKey: ['filter-desa-list', selectedKecamatan],
    queryFn: async () => {
      if (!selectedKecamatan || selectedKecamatan === 'all') return [];
      return (await api.get(`/wilayah/desa/${selectedKecamatan}`)).data;
    },
    enabled: !!selectedKecamatan && selectedKecamatan !== 'all',
    staleTime: 5 * 60 * 1000,
  });

  // Query desa untuk form tambah/edit modal
  const { data: desaList } = useQuery({
    queryKey: ['desa-list', formData.kecamatanId],
    queryFn: async () => {
      if (!formData.kecamatanId) return [];
      return (await api.get(`/wilayah/desa/${formData.kecamatanId}`)).data;
    },
    enabled: !!formData.kecamatanId,
    staleTime: 5 * 60 * 1000,
  });

  // TanStack Query untuk 17rb+ data pelaku UMKM dengan server pagination & caching
  const { data: umkmResponse, isLoading, isFetching } = useQuery({
    queryKey: ['pelaku-umkm', page, debouncedSearch, selectedKecamatan, selectedDesa, selectedJenisUsaha],
    queryFn: async () => {
      const res = await api.get('/pelaku-umkm', {
        params: {
          page,
          limit,
          search: debouncedSearch || undefined,
          kecamatanId: selectedKecamatan !== 'all' ? selectedKecamatan : undefined,
          desaId: selectedDesa !== 'all' ? selectedDesa : undefined,
          jenisUsahaId: selectedJenisUsaha !== 'all' ? selectedJenisUsaha : undefined,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const handleResetFilter = () => {
    setSearchInput('');
    setSelectedKecamatan('all');
    setSelectedDesa('all');
    setSelectedJenisUsaha('all');
    setPage(1);
  };

  const isFilterActive =
    Boolean(searchInput) ||
    selectedKecamatan !== 'all' ||
    selectedDesa !== 'all' ||
    selectedJenisUsaha !== 'all';

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/pelaku-umkm', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pelaku-umkm'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Data Pelaku UMKM berhasil ditambahkan');
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan data');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/pelaku-umkm/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pelaku-umkm'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Data Pelaku UMKM berhasil diperbarui');
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui data');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pelaku-umkm/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pelaku-umkm'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Data Pelaku UMKM berhasil dihapus');
      setIsDeleteDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus data');
    },
  });

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setFormData({
      namaPemilik: '',
      nik: '',
      kk: '',
      nohp: '',
      namaUsaha: '',
      tahunBerdiri: new Date().getFullYear().toString(),
      modalSendiri: 0,
      modalLuar: 0,
      nib: '',
      pirt: '',
      halal: '',
      haki: '',
      keterangan: '',
      kecamatanId: '',
      desaId: '',
      jenisUsahaId: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({
      namaPemilik: item.namaPemilik || '',
      nik: item.nik || '',
      kk: item.kk || '',
      nohp: item.nohp || '',
      namaUsaha: item.namaUsaha || '',
      tahunBerdiri: item.tahunBerdiri || '',
      modalSendiri: Number(item.modalSendiri) || 0,
      modalLuar: Number(item.modalLuar) || 0,
      nib: item.nib || '',
      pirt: item.pirt || '',
      halal: item.halal || '',
      haki: item.haki || '',
      keterangan: item.keterangan || '',
      kecamatanId: item.kecamatanId || '',
      desaId: item.desaId || '',
      jenisUsahaId: item.jenisUsahaId || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPemilik || !formData.nik || !formData.namaUsaha) {
      toast.error('Harap lengkapi Nama Pemilik, NIK, dan Nama Usaha');
      return;
    }

    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const items = umkmResponse?.data || [];
  const meta = umkmResponse?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <div className="px-4 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pelaku UMKM</h1>
          <p className="text-sm text-muted-foreground">
            Data lengkap pelaku usaha mikro, kecil, dan menengah se-Kabupaten Konawe Selatan
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pelaku UMKM
        </Button>
      </div>

      {/* Filter and Search Bar: 3 Filter (Jenis Usaha, Kecamatan, Desa) + Pencarian */}
      <Card className="border-border/60">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Cari NIK, Nama Pemilik, atau Usaha..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* 3 Filters Group: Jenis Usaha, Kecamatan, Desa */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter 1: Jenis Usaha */}
            <div className="w-full sm:w-[170px]">
              <Select
                value={selectedJenisUsaha}
                onValueChange={(val) => {
                  setSelectedJenisUsaha(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Jenis Usaha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis Usaha</SelectItem>
                  {jenisUsahaList?.map((ju: any) => (
                    <SelectItem key={ju.id} value={ju.id}>
                      {ju.uraian}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter 2: Kecamatan */}
            <div className="w-full sm:w-[160px]">
              <Select
                value={selectedKecamatan}
                onValueChange={(val) => {
                  setSelectedKecamatan(val);
                  setSelectedDesa('all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Kecamatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kecamatan</SelectItem>
                  {kecamatanList?.map((kec: any) => (
                    <SelectItem key={kec.id} value={kec.id}>
                      {kec.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter 3: Desa / Kelurahan */}
            <div className="w-full sm:w-[170px]">
              <Select
                value={selectedDesa}
                onValueChange={(val) => {
                  setSelectedDesa(val);
                  setPage(1);
                }}
                disabled={selectedKecamatan === 'all' || isFilterDesaLoading}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue
                    placeholder={
                      selectedKecamatan === 'all'
                        ? 'Pilih Kecamatan Dulu'
                        : isFilterDesaLoading
                        ? 'Memuat Desa...'
                        : 'Semua Desa'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Desa / Kelurahan</SelectItem>
                  {filterDesaList?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tombol Reset Filter */}
            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}

            {/* Background Fetch Indicator */}
            {isFetching && !isLoading && (
              <div className="flex items-center text-xs text-muted-foreground animate-pulse ml-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-emerald-600" />
                Sinkron...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-4 py-3">Nama Usaha / Pemilik</th>
                <th className="px-4 py-3">NIK & Kontak</th>
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3">Sektor Usaha</th>
                <th className="px-4 py-3">Legalitas</th>
                <th className="px-4 py-3 text-right">Modal Usaha</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Memuat data UMKM...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada data pelaku UMKM ditemukan.
                  </td>
                </tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{item.namaUsaha}</div>
                      <div className="text-xs text-muted-foreground">{item.namaPemilik}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-mono">{item.nik}</div>
                      <div className="text-muted-foreground">{item.nohp || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>Kec. {item.kecamatan?.nama || '-'}</div>
                      <div className="text-muted-foreground">{item.desa?.nama || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <Badge variant="outline" className="font-normal border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        {item.jenisUsaha?.uraian || 'Umum'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs space-y-1">
                      {item.nib && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          NIB: {item.nib}
                        </div>
                      )}
                      {item.halal && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono">
                          Halal
                        </Badge>
                      )}
                      {item.pirt && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono ml-1">
                          PIRT
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono font-medium">
                      Rp {Number(item.modalSendiri || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-500"
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Menampilkan {items.length} dari {meta.total} data pelaku UMKM
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

      {/* Form Modal (Add / Edit) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Edit Data Pelaku UMKM' : 'Tambah Data Pelaku UMKM Baru'}
            </DialogTitle>
            <DialogDescription>
              Lengkapi formulir pendataan pelaku usaha mikro, kecil, dan menengah.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="namaPemilik">Nama Pemilik Usaha *</Label>
                <Input
                  id="namaPemilik"
                  value={formData.namaPemilik}
                  onChange={(e) => setFormData({ ...formData, namaPemilik: e.target.value })}
                  placeholder="Nama lengkap"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik">NIK (Nomor Induk Kependudukan) *</Label>
                <Input
                  id="nik"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  placeholder="16 digit NIK"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaUsaha">Nama Usaha / Merek *</Label>
                <Input
                  id="namaUsaha"
                  value={formData.namaUsaha}
                  onChange={(e) => setFormData({ ...formData, namaUsaha: e.target.value })}
                  placeholder="Contoh: Keripik Pisang Gula Aren"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nohp">No. Telepon / WhatsApp</Label>
                <Input
                  id="nohp"
                  value={formData.nohp}
                  onChange={(e) => setFormData({ ...formData, nohp: e.target.value })}
                  placeholder="08xxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kecamatanId">Kecamatan</Label>
                <Select
                  value={formData.kecamatanId}
                  onValueChange={(val) => setFormData({ ...formData, kecamatanId: val, desaId: '' })}
                >
                  <SelectTrigger id="kecamatanId">
                    <SelectValue placeholder="Pilih Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {kecamatanList?.map((kec: any) => (
                      <SelectItem key={kec.id} value={kec.id}>
                        {kec.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desaId">Desa / Kelurahan</Label>
                <Select
                  value={formData.desaId}
                  onValueChange={(val) => setFormData({ ...formData, desaId: val })}
                  disabled={!formData.kecamatanId}
                >
                  <SelectTrigger id="desaId">
                    <SelectValue placeholder="Pilih Desa/Kelurahan" />
                  </SelectTrigger>
                  <SelectContent>
                    {desaList?.map((des: any) => (
                      <SelectItem key={des.id} value={des.id}>
                        {des.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jenisUsahaId">Sektor / Jenis Usaha</Label>
                <Select
                  value={formData.jenisUsahaId}
                  onValueChange={(val) => setFormData({ ...formData, jenisUsahaId: val })}
                >
                  <SelectTrigger id="jenisUsahaId">
                    <SelectValue placeholder="Pilih Jenis Usaha" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisUsahaList?.map((ju: any) => (
                      <SelectItem key={ju.id} value={ju.id}>
                        {ju.uraian}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tahunBerdiri">Tahun Berdiri</Label>
                <Input
                  id="tahunBerdiri"
                  value={formData.tahunBerdiri}
                  onChange={(e) => setFormData({ ...formData, tahunBerdiri: e.target.value })}
                  placeholder="2022"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modalSendiri">Modal Sendiri (Rp)</Label>
                <Input
                  id="modalSendiri"
                  type="number"
                  value={formData.modalSendiri}
                  onChange={(e) => setFormData({ ...formData, modalSendiri: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modalLuar">Modal Luar / Pinjaman (Rp)</Label>
                <Input
                  id="modalLuar"
                  type="number"
                  value={formData.modalLuar}
                  onChange={(e) => setFormData({ ...formData, modalLuar: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nib">Nomor Induk Berusaha (NIB)</Label>
                <Input
                  id="nib"
                  value={formData.nib}
                  onChange={(e) => setFormData({ ...formData, nib: e.target.value })}
                  placeholder="Opsional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="halal">Sertifikat Halal</Label>
                <Input
                  id="halal"
                  value={formData.halal}
                  onChange={(e) => setFormData({ ...formData, halal: e.target.value })}
                  placeholder="Nomor sertifikat halal"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Data Pelaku UMKM?</DialogTitle>
            <DialogDescription>
              Data usaha <strong>{selectedItem?.namaUsaha}</strong> milik <strong>{selectedItem?.namaPemilik}</strong> akan dihapus permanen dari sistem.
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
