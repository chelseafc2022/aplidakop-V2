'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
  Download,
  Printer,
  RotateCcw,
  MapPin,
  Coins,
  ShieldCheck,
  FileText,
  Phone,
  Eye,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { isAdministratorRole } from '@/lib/auth-role';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const showValue = (value: unknown) => value === null || value === undefined || value === '' ? '—' : String(value);
const showMoney = (value: unknown) => value === null || value === undefined || value === '' ? '—' : `Rp ${Number(value).toLocaleString('id-ID')}`;
const showMappingStatus = (value: unknown) => ({
  MAPPED: 'Terpetakan',
  UNMAPPED: 'Belum terpetakan',
  UNMAPPED_PRESERVED: 'Belum cocok — peta lama dipertahankan',
}[String(value)] || showValue(value));

export default function KoperasiPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAdministrator = isAdministratorRole(user?.role?.nama);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
  const [selectedDesa, setSelectedDesa] = useState<string>('all');
  const [selectedJenisKoperasi, setSelectedJenisKoperasi] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    namaKoperasi: '',
    noBadanHukum: '',
    tglBadanHukum: '',
    nikop: '',
    alamat: '',
    kecamatanId: '',
    desaId: '',
    jenisKoperasiId: '',
    statusAktif: true,
    jumlahAnggota: '',
    modalSendiri: '',
    modalLuar: '',
    aset: '',
    volumeUsaha: '',
    shu: '',
    ketua: '',
    telpKoperasi: '',
    keterangan: '',
    bentukKoperasi: '',
    polaPengelolaan: '',
    sektorUsaha: '',
    kelompokKoperasi: '',
    kabupatenKota: '',
    kelurahanSumber: '',
    desaSumber: '',
    kodePos: '',
    email: '',
    kuk: '',
    grade: '',
    statusAkunOdsMandiri: '',
    tahunPendataan: '',
    tanggalDiterima: '',
  });

  // Queries
  const { data: kecamatanList } = useQuery({
    queryKey: ['kecamatan-list'],
    queryFn: async () => (await api.get('/wilayah/kecamatan')).data,
    staleTime: 10 * 60 * 1000,
  });

  const { data: jenisKoperasiList } = useQuery({
    queryKey: ['jenis-koperasi-list'],
    queryFn: async () => (await api.get('/master-jenis/koperasi')).data,
    staleTime: 10 * 60 * 1000,
  });

  // Query desa untuk filter bar (dinamis berdasarkan kecamatan terpilih)
  const { data: filterDesaList } = useQuery({
    queryKey: ['filter-desa-list-koperasi', selectedKecamatan],
    queryFn: async () => {
      if (!selectedKecamatan || selectedKecamatan === 'all') return [];
      return (await api.get(`/wilayah/desa/${selectedKecamatan}`)).data;
    },
    enabled: !!selectedKecamatan && selectedKecamatan !== 'all',
    staleTime: 5 * 60 * 1000,
  });

  // Query desa untuk form modal tambah/edit (dinamis berdasarkan formData.kecamatanId)
  const { data: modalDesaList } = useQuery({
    queryKey: ['modal-desa-list-koperasi', formData.kecamatanId],
    queryFn: async () => {
      if (!formData.kecamatanId) return [];
      return (await api.get(`/wilayah/desa/${formData.kecamatanId}`)).data;
    },
    enabled: !!formData.kecamatanId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: koperasiResponse, isLoading } = useQuery({
    queryKey: ['koperasi', page, debouncedSearch, selectedKecamatan, selectedDesa, selectedJenisKoperasi, selectedStatus],
    queryFn: async () => {
      const res = await api.get('/koperasi', {
        params: {
          page,
          limit,
          search: debouncedSearch || undefined,
          kecamatanId: selectedKecamatan !== 'all' ? selectedKecamatan : undefined,
          desaId: selectedDesa !== 'all' ? selectedDesa : undefined,
          jenisKoperasiId: selectedJenisKoperasi !== 'all' ? selectedJenisKoperasi : undefined,
          statusAktif: selectedStatus === 'all' ? undefined : selectedStatus,
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
    setSelectedJenisKoperasi('all');
    setSelectedStatus('all');
    setPage(1);
  };

  const isFilterActive =
    Boolean(searchInput) ||
    selectedKecamatan !== 'all' ||
    selectedDesa !== 'all' ||
    selectedJenisKoperasi !== 'all' ||
    selectedStatus !== 'all';

  // Export Excel (.csv)
  const handleExportCSV = async () => {
    let listToExport: any[] = [];
    try {
      const response = await api.get('/koperasi', {
        params: {
          page: 1,
          limit: 5000,
          search: debouncedSearch || undefined,
          kecamatanId: selectedKecamatan !== 'all' ? selectedKecamatan : undefined,
          desaId: selectedDesa !== 'all' ? selectedDesa : undefined,
          jenisKoperasiId: selectedJenisKoperasi !== 'all' ? selectedJenisKoperasi : undefined,
          statusAktif: selectedStatus === 'all' ? undefined : selectedStatus,
        },
      });
      listToExport = response.data?.data || [];
    } catch {
      toast.error('Gagal menyiapkan data ekspor');
      return;
    }
    if (listToExport.length === 0) {
      toast.error('Tidak ada data koperasi untuk diekspor');
      return;
    }

    const headers = [
      'No',
      'Nama Koperasi',
      'No Badan Hukum',
      'Tanggal Badan Hukum',
      'NIKOP',
      'Jenis Koperasi',
      'Status Koperasi',
      'Kecamatan',
      'Desa / Kelurahan',
      'Alamat Kantor',
      'Nama Ketua',
      'No Telp / Kontak',
      'Jumlah Anggota',
      'Modal Sendiri (Rp)',
      'Modal Luar (Rp)',
      'Total Aset (Rp)',
      'Keterangan', 'Bentuk Koperasi', 'Pola Pengelolaan', 'Sektor Usaha',
      'Kelompok Koperasi', 'Kabupaten/Kota', 'Kode Pos', 'Email', 'KUK', 'Grade',
      'Status Akun ODS Mandiri', 'Tahun Pendataan', 'Tanggal Diterima',
    ];

    const rows = listToExport.map((item: any, idx: number) => [
      idx + 1,
      `"${(item.namaKoperasi || '').replace(/"/g, '""')}"`,
      `"${(item.nomorBadanHukum || '-').replace(/"/g, '""')}"`,
      item.tanggalBadanHukum || '-',
      item.nikop || '-',
      `"${(item.jenisKoperasi?.uraian || '-').replace(/"/g, '""')}"`,
      item.statusAktif ? 'Aktif' : 'Tidak Aktif',
      `"${(item.kecamatan?.nama || '-').replace(/"/g, '""')}"`,
      `"${(item.desa?.nama || '-').replace(/"/g, '""')}"`,
      `"${(item.alamat || '-').replace(/"/g, '""')}"`,
      `"${(item.ketua || '-').replace(/"/g, '""')}"`,
      item.telpKoperasi || '-',
      item.jumlahAnggota ?? '',
      item.modalAwal ?? '',
      item.modalLuar ?? '',
      item.asset ?? '',
      `"${(item.keterangan || '-').replace(/"/g, '""')}"`,
      `"${(item.bentukKoperasi || '').replace(/"/g, '""')}"`,
      `"${(item.polaPengelolaan || '').replace(/"/g, '""')}"`,
      `"${(item.sektorUsaha || '').replace(/"/g, '""')}"`,
      `"${(item.kelompokKoperasi || '').replace(/"/g, '""')}"`,
      `"${(item.kabupatenKota || '').replace(/"/g, '""')}"`,
      item.kodePos || '', item.email || '', item.kuk ?? '', item.grade || '',
      `"${(item.statusAkunOdsMandiri || '').replace(/"/g, '""')}"`,
      item.tahunPendataan ?? '', item.tanggalDiterima || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Rekap_Data_Koperasi_Konsel_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Berhasil mengekspor ${listToExport.length} data koperasi ke file Excel/CSV`);
  };

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

  const flagMutation = useMutation({
    mutationFn: ({ koperasiId, reason }: { koperasiId: string; reason: string }) => api.post('/management/verifikasi-koperasi', { mode: 'flag', koperasiId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifikasi-koperasi'] });
      toast.success('Koperasi masuk antrean verifikasi administrator');
      setIsFlagDialogOpen(false); setFlagReason('');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Gagal menandai koperasi'),
  });

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setFormData({
      namaKoperasi: '',
      noBadanHukum: '',
      tglBadanHukum: '',
      nikop: '',
      alamat: '',
      kecamatanId: '',
      desaId: '',
      jenisKoperasiId: '',
      statusAktif: true,
      jumlahAnggota: '', modalSendiri: '', modalLuar: '', aset: '', volumeUsaha: '', shu: '',
      ketua: '',
      telpKoperasi: '',
      keterangan: '',
      bentukKoperasi: '', polaPengelolaan: '', sektorUsaha: '', kelompokKoperasi: '',
      kabupatenKota: '', kelurahanSumber: '', desaSumber: '', kodePos: '', email: '', kuk: '',
      grade: '', statusAkunOdsMandiri: '', tahunPendataan: '', tanggalDiterima: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({
      namaKoperasi: item.namaKoperasi || '',
      noBadanHukum: item.nomorBadanHukum || '',
      tglBadanHukum: item.tanggalBadanHukum ? item.tanggalBadanHukum.substring(0, 10) : '',
      nikop: item.nikop || '',
      alamat: item.alamat || '',
      kecamatanId: item.kecamatanId || '',
      desaId: item.desa?.id || item.desaId || '',
      jenisKoperasiId: item.jenisKoperasi?.id || item.jenisKoperasiId || '',
      statusAktif: item.statusAktif ?? true,
      jumlahAnggota: item.jumlahAnggota?.toString() || '',
      modalSendiri: item.modalAwal?.toString() || '',
      modalLuar: item.modalLuar?.toString() || '',
      aset: item.asset?.toString() || '',
      volumeUsaha: item.volumeUsaha?.toString() || '',
      shu: item.shu?.toString() || '',
      ketua: item.ketua || '',
      telpKoperasi: item.telpKoperasi || '',
      keterangan: item.keterangan || '',
      bentukKoperasi: item.bentukKoperasi || '', polaPengelolaan: item.polaPengelolaan || '',
      sektorUsaha: item.sektorUsaha || '', kelompokKoperasi: item.kelompokKoperasi || '',
      kabupatenKota: item.kabupatenKota || '', kelurahanSumber: item.kelurahanSumber || '',
      desaSumber: item.desaSumber || '', kodePos: item.kodePos || '', email: item.email || '',
      kuk: item.kuk?.toString() || '', grade: item.grade || '',
      statusAkunOdsMandiri: item.statusAkunOdsMandiri || '',
      tahunPendataan: item.tahunPendataan?.toString() || '', tanggalDiterima: item.tanggalDiterima?.substring(0, 10) || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaKoperasi.trim() || !formData.jenisKoperasiId) {
      toast.error('Nama dan jenis koperasi wajib diisi');
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
            Pengelolaan badan hukum, status kelembagaan, serta data keuangan koperasi se-Kabupaten Konawe Selatan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Cetak Rekapitulasi Ber-Kop Dinas */}
          <Button
            variant="outline"
            onClick={() => setIsPrintModalOpen(true)}
            className="border-border text-foreground hover:bg-muted text-xs sm:text-sm"
          >
            <Printer className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
            Cetak Rekap Dinas
          </Button>

          {/* Tombol Export Excel */}
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs sm:text-sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export Excel (.csv)
          </Button>

          {/* Tombol Tambah Koperasi */}
          <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Koperasi
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Cari Nama Koperasi, No Badan Hukum, Ketua, NIKOP..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="w-full sm:w-[130px]">
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => {
                    setSelectedStatus(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Kecamatan Filter */}
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

              {/* Desa Filter Dinamis */}
              <div className="w-full sm:w-[160px]">
                <Select
                  value={selectedDesa}
                  onValueChange={(val) => {
                    setSelectedDesa(val);
                    setPage(1);
                  }}
                  disabled={!selectedKecamatan || selectedKecamatan === 'all'}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue
                      placeholder={
                        selectedKecamatan === 'all'
                          ? 'Pilih Kec. dahulu'
                          : 'Semua Desa / Kel.'
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

              {/* Jenis Koperasi Filter */}
              <div className="w-full sm:w-[170px]">
                <Select
                  value={selectedJenisKoperasi}
                  onValueChange={(val) => {
                    setSelectedJenisKoperasi(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Jenis Koperasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    {jenisKoperasiList?.map((jk: any) => (
                      <SelectItem key={jk.id} value={jk.id}>
                        {jk.uraian}
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
                  className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
            </div>
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
                <th className="px-4 py-3 text-right">Modal & Aset</th>
                <th className="px-4 py-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Memuat data koperasi...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Tidak ada data koperasi yang sesuai kriteria pencarian / filter.
                  </td>
                </tr>
              ) : (
                items.map((k: any) => (
                  <tr key={k.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">{k.namaKoperasi}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{k.alamat}</div>
                      {k.nikop && k.nikop !== '-' && (
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">NIKOP: {k.nikop}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono text-xs text-foreground font-medium">{k.nomorBadanHukum || '-'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Ketua: {k.ketua || '-'}</div>
                      {k.telpKoperasi && k.telpKoperasi !== '-' && (
                        <div className="text-[10px] text-muted-foreground">Kontak: {k.telpKoperasi}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="text-xs font-normal mb-1">
                        {k.jenisKoperasi?.uraian || 'Koperasi'}
                      </Badge>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>
                          {k.desa?.nama ? `${k.desa.nama}, ` : ''}
                          {k.kecamatan?.nama || '-'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {k.statusAktif ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3.5 h-3.5" />
                          Tidak Aktif
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-xs">
                      <div className="font-semibold text-foreground">
                        {showMoney(k.asset)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Modal: {showMoney(k.modalAwal)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:bg-slate-500/10 hover:text-slate-900 dark:text-slate-300"
                          onClick={() => { setSelectedItem(k); setIsDetailDialogOpen(true); }}
                          aria-label={`Lihat detail ${k.namaKoperasi}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-500 hover:bg-blue-500/10"
                          onClick={() => handleOpenEdit(k)}
                          aria-label={`Edit ${k.namaKoperasi}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => {
                            setSelectedItem(k);
                            setIsDeleteDialogOpen(true);
                          }}
                          aria-label={`Hapus ${k.namaKoperasi}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Menampilkan data ke {(meta.page - 1) * meta.limit + 1} sampai{' '}
            {Math.min(meta.page * meta.limit, meta.total)} dari total <strong>{meta.total}</strong> koperasi
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

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-border/50 bg-muted/30 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600"><Building2 className="h-5 w-5" /></div>
              <div><DialogTitle className="text-xl">{selectedItem?.namaKoperasi || 'Detail Koperasi'}</DialogTitle><DialogDescription className="mt-1">Informasi lengkap kelembagaan, wilayah, ODS, pengurus, dan keuangan.</DialogDescription></div>
            </div>
          </DialogHeader>
          {selectedItem && <div className="space-y-5 p-6">
            {[
              { title: 'Identitas & Legalitas', items: [
                ['NIKOP', selectedItem.nikop], ['Nomor Badan Hukum', selectedItem.nomorBadanHukum], ['Tanggal Badan Hukum', selectedItem.tanggalBadanHukum],
                ['Jenis Koperasi', selectedItem.jenisKoperasi?.uraian], ['Status', selectedItem.statusKoperasi], ['Bentuk', selectedItem.bentukKoperasi], ['Pola Pengelolaan', selectedItem.polaPengelolaan],
              ] },
              { title: 'Wilayah & Kontak', items: [
                ['Kecamatan', selectedItem.kecamatan?.nama], ['Desa/Kelurahan Terpetakan', selectedItem.desa?.nama], ['Desa Sumber', selectedItem.desaSumber], ['Kelurahan Sumber', selectedItem.kelurahanSumber],
                ['Status Pemetaan', showMappingStatus(selectedItem.wilayahMappingStatus)], ['Alamat', selectedItem.alamat], ['Kode Pos', selectedItem.kodePos], ['Email', selectedItem.email],
              ] },
              { title: 'Profil ODS', items: [
                ['Sektor Usaha', selectedItem.sektorUsaha], ['Kelompok Koperasi', selectedItem.kelompokKoperasi], ['Kabupaten/Kota', selectedItem.kabupatenKota], ['KUK', selectedItem.kuk],
                ['Grade', selectedItem.grade], ['Status Akun ODS Mandiri', selectedItem.statusAkunOdsMandiri], ['Tahun Pendataan', selectedItem.tahunPendataan], ['Tanggal Diterima', selectedItem.tanggalDiterima],
              ] },
              { title: 'Pengurus & Keanggotaan', items: [
                ['Ketua', selectedItem.ketua], ['NIK Ketua', selectedItem.nikKetua], ['Kontak Ketua', selectedItem.telpKoperasi], ['Sekretaris', selectedItem.namaSekretaris],
                ['Bendahara', selectedItem.namaBendahara], ['Pengawas', selectedItem.namaPengawas], ['Jumlah Anggota', selectedItem.jumlahAnggota],
              ] },
            ].map((section) => <section key={section.title} className="rounded-xl border border-border/50 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{section.items.map(([label, value]) => <div key={label as string}><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words text-sm font-medium">{showValue(value)}</dd></div>)}</dl>
            </section>)}
            <section className="rounded-xl border border-border/50 p-4"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keuangan</h3><dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {[['Modal Sendiri', selectedItem.modalAwal], ['Modal Luar', selectedItem.modalLuar], ['Aset', selectedItem.asset], ['Volume Usaha', selectedItem.volumeUsaha], ['SHU', selectedItem.shu]].map(([label, value]) => <div key={label as string}><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-0.5 text-sm font-semibold">{showMoney(value)}</dd></div>)}
            </dl></section>
            <div className="rounded-lg bg-muted/40 p-3 text-sm"><span className="text-muted-foreground">Keterangan: </span>{showValue(selectedItem.keterangan)}</div>
          </div>}
          <DialogFooter className="border-t border-border/50 p-4 sm:px-6 sm:justify-between"><div>{isAdministrator && <Button variant="outline" className="border-amber-500/40 text-amber-700" onClick={() => { setIsDetailDialogOpen(false); setIsFlagDialogOpen(true); }}><Flag className="mr-2 h-4 w-4" />Tandai perlu verifikasi</Button>}</div><div className="flex gap-2"><Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button><Button onClick={() => { const item = selectedItem; setIsDetailDialogOpen(false); if (item) handleOpenEdit(item); }} className="bg-teal-600 text-white hover:bg-teal-500"><Edit className="mr-2 h-4 w-4" />Edit Data</Button></div></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFlagDialogOpen} onOpenChange={(open) => !flagMutation.isPending && setIsFlagDialogOpen(open)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Tandai data perlu diverifikasi</DialogTitle><DialogDescription>{selectedItem?.namaKoperasi} akan masuk antrean administrator. Data master tidak berubah sampai proses verifikasi ditetapkan.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="flag-reason">Bagian yang keliru atau perlu diperiksa *</Label><Input id="flag-reason" value={flagReason} onChange={(event) => setFlagReason(event.target.value)} placeholder="Contoh: NIKOP atau desa tidak sesuai dokumen" /></div><DialogFooter><Button variant="outline" disabled={flagMutation.isPending} onClick={() => setIsFlagDialogOpen(false)}>Batal</Button><Button disabled={!selectedItem || !flagReason.trim() || flagMutation.isPending} onClick={() => selectedItem && flagMutation.mutate({ koperasiId: selectedItem.id, reason: flagReason.trim() })}>{flagMutation.isPending ? 'Menyimpan...' : 'Masukkan antrean'}</Button></DialogFooter></DialogContent>
      </Dialog>

      {/* Modal Dialog Form Tambah / Edit Koperasi (Luas & Terstruktur Persis Modal UMKM) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {selectedItem ? 'Edit Data Koperasi' : 'Tambah Data Koperasi Baru'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Lengkapi data profil kelembagaan, badan hukum, kepengurusan, dan keuangan koperasi Kabupaten Konawe Selatan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Seksi 1: Identitas Kelembagaan & Legalitas */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>1. Identitas Kelembagaan & Legalitas Koperasi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="namaKoperasi" className="text-xs font-medium">
                    Nama Resmi Koperasi <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="namaKoperasi"
                    value={formData.namaKoperasi}
                    onChange={(e) => setFormData({ ...formData, namaKoperasi: e.target.value })}
                    placeholder="Contoh: KSP Bina Usaha Mandiri Konsel"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="jenisKoperasiId" className="text-xs font-medium">
                    Jenis Koperasi <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.jenisKoperasiId}
                    onValueChange={(val) => setFormData({ ...formData, jenisKoperasiId: val })}
                  >
                    <SelectTrigger id="jenisKoperasiId" className="h-9 text-xs">
                      <SelectValue placeholder="Pilih Jenis Koperasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisKoperasiList?.map((jk: any) => (
                        <SelectItem key={jk.id} value={jk.id} className="text-xs">
                          {jk.uraian}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="noBadanHukum" className="text-xs font-medium">
                    Nomor Badan Hukum / AHU
                  </Label>
                  <Input
                    id="noBadanHukum"
                    value={formData.noBadanHukum}
                    onChange={(e) => setFormData({ ...formData, noBadanHukum: e.target.value })}
                    placeholder="AHU-00123.AH.01..."
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tglBadanHukum" className="text-xs font-medium">
                    Tanggal Pengesahan
                  </Label>
                  <Input
                    id="tglBadanHukum"
                    type="date"
                    value={formData.tglBadanHukum}
                    onChange={(e) => setFormData({ ...formData, tglBadanHukum: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nikop" className="text-xs font-medium">
                    Nomor Induk Koperasi (NIKOP)
                  </Label>
                  <Input
                    id="nikop"
                    value={formData.nikop}
                    onChange={(e) => setFormData({ ...formData, nikop: e.target.value })}
                    placeholder="7405xxxxxxxx"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Status Organisasi</Label>
                  <div className="flex items-center justify-between h-9 px-3 rounded-md border border-input bg-background">
                    <span className="text-xs font-medium">
                      {formData.statusAktif ? 'Aktif (RAT)' : 'Tidak Aktif'}
                    </span>
                    <Switch
                      id="statusAktif"
                      checked={formData.statusAktif}
                      onCheckedChange={(checked) => setFormData({ ...formData, statusAktif: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seksi 2: Wilayah Administratif & Alamat Kantor */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Domisili Wilayah Administratif & Alamat Sekretariat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modalKecamatanId" className="text-xs font-medium">
                    Kecamatan <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.kecamatanId}
                    onValueChange={(val) => setFormData({ ...formData, kecamatanId: val, desaId: '' })}
                  >
                    <SelectTrigger id="modalKecamatanId" className="h-9 text-xs">
                      <SelectValue placeholder="Pilih Kecamatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {kecamatanList?.map((kec: any) => (
                        <SelectItem key={kec.id} value={kec.id} className="text-xs">
                          {kec.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modalDesaId" className="text-xs font-medium">
                    Desa / Kelurahan
                  </Label>
                  <Select
                    value={formData.desaId}
                    onValueChange={(val) => setFormData({ ...formData, desaId: val })}
                    disabled={!formData.kecamatanId}
                  >
                    <SelectTrigger id="modalDesaId" className="h-9 text-xs">
                      <SelectValue
                        placeholder={
                          formData.kecamatanId ? 'Pilih Desa / Kelurahan' : 'Pilih Kecamatan terlebih dahulu'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {modalDesaList?.map((desa: any) => (
                        <SelectItem key={desa.id} value={desa.id} className="text-xs">
                          {desa.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="alamat" className="text-xs font-medium">
                    Alamat Lengkap Kantor Sekretariat
                  </Label>
                  <Input
                    id="alamat"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    placeholder="Contoh: Jl. Poros Andoolo Km. 2, Kompleks Pasar Sentral"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Seksi 3: Kepengurusan & Keanggotaan */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>3. Kepengurusan & Keanggotaan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ketua" className="text-xs font-medium">
                    Nama Ketua Koperasi
                  </Label>
                  <Input
                    id="ketua"
                    value={formData.ketua}
                    onChange={(e) => setFormData({ ...formData, ketua: e.target.value })}
                    placeholder="Nama lengkap ketua"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telpKoperasi" className="text-xs font-medium">
                    No. Telp / WhatsApp Pengurus
                  </Label>
                  <Input
                    id="telpKoperasi"
                    value={formData.telpKoperasi}
                    onChange={(e) => setFormData({ ...formData, telpKoperasi: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jumlahAnggota" className="text-xs font-medium">
                    Jumlah Anggota Aktif (Orang)
                  </Label>
                  <Input
                    id="jumlahAnggota"
                    type="number"
                    value={formData.jumlahAnggota}
                    onChange={(e) => setFormData({ ...formData, jumlahAnggota: e.target.value })}
                    className="h-9 text-xs font-mono"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Seksi 4: Finansial & Permodalan */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>4. Kinerja Keuangan & Permodalan (Rp)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modalSendiri" className="text-xs font-medium">
                    Modal Sendiri (Simpanan Pokok & Wajib)
                  </Label>
                  <Input
                    id="modalSendiri"
                    type="number"
                    value={formData.modalSendiri}
                    onChange={(e) => setFormData({ ...formData, modalSendiri: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modalLuar" className="text-xs font-medium">
                    Modal Luar (Pinjaman/Penyertaan)
                  </Label>
                  <Input
                    id="modalLuar"
                    type="number"
                    value={formData.modalLuar}
                    onChange={(e) => setFormData({ ...formData, modalLuar: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="aset" className="text-xs font-medium">
                    Total Aset Koperasi
                  </Label>
                  <Input
                    id="aset"
                    type="number"
                    value={formData.aset}
                    onChange={(e) => setFormData({ ...formData, aset: e.target.value })}
                    className="h-9 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="volumeUsaha" className="text-xs font-medium">
                    Volume Usaha Tahunan
                  </Label>
                  <Input
                    id="volumeUsaha"
                    type="number"
                    value={formData.volumeUsaha}
                    onChange={(e) => setFormData({ ...formData, volumeUsaha: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="shu" className="text-xs font-medium">
                    Sisa Hasil Usaha (SHU)
                  </Label>
                  <Input
                    id="shu"
                    type="number"
                    value={formData.shu}
                    onChange={(e) => setFormData({ ...formData, shu: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="keterangan" className="text-xs font-medium">
                    Catatan / Keterangan
                  </Label>
                  <Input
                    id="keterangan"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Catatan tambahan..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>5. Profil ODS & Metadata Pendataan</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['bentukKoperasi', 'Bentuk Koperasi'], ['polaPengelolaan', 'Pola Pengelolaan'],
                  ['sektorUsaha', 'Sektor Usaha'], ['kelompokKoperasi', 'Kelompok Koperasi'],
                  ['kabupatenKota', 'Kabupaten/Kota'], ['kelurahanSumber', 'Kelurahan (Sumber)'],
                  ['desaSumber', 'Desa (Sumber)'], ['kodePos', 'Kode Pos'], ['email', 'Email'],
                  ['grade', 'Grade'], ['statusAkunOdsMandiri', 'Status Akun ODS Mandiri'],
                ].map(([key, label]) => (
                  <div className={`space-y-1.5 ${key === 'sektorUsaha' || key === 'statusAkunOdsMandiri' ? 'sm:col-span-2' : ''}`} key={key}>
                    <Label htmlFor={key} className="text-xs font-medium">{label}</Label>
                    <Input id={key} value={formData[key as keyof typeof formData] as string} onChange={(event) => setFormData({ ...formData, [key]: event.target.value })} className="h-9 text-xs" />
                  </div>
                ))}
                <div className="space-y-1.5"><Label htmlFor="kuk" className="text-xs font-medium">KUK</Label><Input id="kuk" type="number" min="0" value={formData.kuk} onChange={(event) => setFormData({ ...formData, kuk: event.target.value })} className="h-9 text-xs" /></div>
                <div className="space-y-1.5"><Label htmlFor="tahunPendataan" className="text-xs font-medium">Tahun Pendataan</Label><Input id="tahunPendataan" type="number" min="1900" max="2200" value={formData.tahunPendataan} onChange={(event) => setFormData({ ...formData, tahunPendataan: event.target.value })} className="h-9 text-xs" /></div>
                <div className="space-y-1.5"><Label htmlFor="tanggalDiterima" className="text-xs font-medium">Tanggal Diterima</Label><Input id="tanggalDiterima" type="date" value={formData.tanggalDiterima} onChange={(event) => setFormData({ ...formData, tanggalDiterima: event.target.value })} className="h-9 text-xs" /></div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border/40 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Menyimpan...'
                  : selectedItem
                  ? 'Perbarui Data Koperasi'
                  : 'Simpan Koperasi Baru'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pratinjau Lembar Rekapitulasi Ber-Kop Dinas Resmi */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Printer className="w-5 h-5" />
                <DialogTitle>Pratinjau Lembar Rekapitulasi Koperasi Dinas</DialogTitle>
              </div>
              <Button size="sm" onClick={() => window.print()} className="bg-teal-600 hover:bg-teal-500 text-white">
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak ke Kertas / Simpan PDF
              </Button>
            </div>
            <DialogDescription className="text-xs">
              Format lembar rekapitulasi data resmi ber-kop Pemerintah Kabupaten Konawe Selatan.
            </DialogDescription>
          </DialogHeader>

          {/* Lembar Dokumen Siap Cetak */}
          <div className="p-6 bg-white text-black rounded-lg border border-gray-300 shadow-xs print:border-none print:shadow-none print:p-0">
            {/* Kop Surat Kedinasan */}
            <div className="text-center border-b-4 border-double border-black pb-3 mb-4">
              <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase">
                PEMERINTAH KABUPATEN KONAWE SELATAN
              </h2>
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase">
                DINAS KOPERASI DAN USAHA KECIL MENENGAH
              </h1>
              <p className="text-[11px] text-gray-700">
                Kompleks Perkantoran Pemerintah Daerah Kabupaten Konawe Selatan, Andoolo 93381
              </p>
              <p className="text-[10px] text-gray-600">
                Laman Resmi: konaweselatankab.go.id • Email: dinkop@konaweselatankab.go.id
              </p>
            </div>

            {/* Judul Laporan */}
            <div className="text-center my-3">
              <h3 className="text-xs sm:text-sm font-bold uppercase underline">
                REKAPITULASI DATA KELEMBAGAAN KOPERASI KABUPATEN KONAWE SELATAN
              </h3>
              <p className="text-[11px] text-gray-700 mt-0.5">
                Sistem Informasi APLI DAKOP v2.0 — Dimensi Smart Economy Kabupaten Konawe Selatan
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-[10px] text-gray-600 mt-1">
                <span>Total Data Tampil: {items.length} Unit Koperasi</span>
                <span>•</span>
                <span>
                  Waktu Unduh:{' '}
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Tabel Data Rekapitulasi */}
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-[10px] border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 font-semibold">
                    <th className="border border-gray-400 p-1.5 text-center w-7">No</th>
                    <th className="border border-gray-400 p-1.5 text-left">Nama Koperasi</th>
                    <th className="border border-gray-400 p-1.5 text-left">No. Badan Hukum</th>
                    <th className="border border-gray-400 p-1.5 text-left">Jenis Koperasi</th>
                    <th className="border border-gray-400 p-1.5 text-left">Wilayah (Kecamatan)</th>
                    <th className="border border-gray-400 p-1.5 text-left">Ketua</th>
                    <th className="border border-gray-400 p-1.5 text-center">Status</th>
                    <th className="border border-gray-400 p-1.5 text-right">Total Aset (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-400 p-1 text-center">{idx + 1}</td>
                      <td className="border border-gray-400 p-1 font-semibold">{item.namaKoperasi}</td>
                      <td className="border border-gray-400 p-1 font-mono text-[9px]">
                        {item.nomorBadanHukum || '-'}
                      </td>
                      <td className="border border-gray-400 p-1">{item.jenisKoperasi?.uraian || '-'}</td>
                      <td className="border border-gray-400 p-1">{item.kecamatan?.nama || '-'}</td>
                      <td className="border border-gray-400 p-1">{item.ketua || '-'}</td>
                      <td className="border border-gray-400 p-1 text-center">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                            item.statusAktif ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.statusAktif ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="border border-gray-400 p-1 text-right font-mono">
                        Rp {Number(item.asset || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lembar Tanda Tangan Resmi Pengesahan */}
            <div className="flex justify-between items-end mt-8 pt-4 text-xs text-gray-900">
              <div className="text-center">
                <p>Operator Bidang Kelembagaan,</p>
                <div className="h-14"></div>
                <p className="font-semibold underline">Staf Bidang Pengawasan Koperasi</p>
                <p className="text-[10px] text-gray-600">Dinas Koperasi & UKM Kab. Konawe Selatan</p>
              </div>

              <div className="text-center">
                <p>
                  Andoolo,{' '}
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="font-medium">Mengetahui,</p>
                <p className="font-semibold">Kepala Dinas Koperasi dan UKM</p>
                <p className="text-xs">Kabupaten Konawe Selatan</p>
                <div className="h-12"></div>
                <p className="font-bold underline">H. IMADUDDIN, S.Pi., M.Si.</p>
                <p className="text-[10px] font-mono">NIP. 19740510 199903 1 005</p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>
              Tutup
            </Button>
            <Button onClick={() => window.print()} className="bg-teal-600 hover:bg-teal-500 text-white">
              <Printer className="w-4 h-4 mr-2" />
              Cetak Dokumen Sekarang (Print / PDF)
            </Button>
          </DialogFooter>
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
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
            >
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
