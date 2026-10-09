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
  Lock,
  UploadCloud,
  FileDown,
  Sparkles,
  AlertCircle,
  Calendar,
  Printer,
  Download,
  Coins,
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

  // Search & 4 Filters state: Jenis Usaha, Kecamatan, Desa, Periode
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
  const [selectedDesa, setSelectedDesa] = useState<string>('all');
  const [selectedJenisUsaha, setSelectedJenisUsaha] = useState<string>('all');
  const [selectedPeriode, setSelectedPeriode] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Dialog & Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBaselineLockedAlertOpen, setIsBaselineLockedAlertOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importYear, setImportYear] = useState('2025');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
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
    omsetTahun: 0,
    tenagaKerja: 1,
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
    queryKey: ['pelaku-umkm', page, debouncedSearch, selectedKecamatan, selectedDesa, selectedJenisUsaha, selectedPeriode],
    queryFn: async () => {
      const res = await api.get('/pelaku-umkm', {
        params: {
          page,
          limit,
          search: debouncedSearch || undefined,
          kecamatanId: selectedKecamatan !== 'all' ? selectedKecamatan : undefined,
          desaId: selectedDesa !== 'all' ? selectedDesa : undefined,
          jenisUsahaId: selectedJenisUsaha !== 'all' ? selectedJenisUsaha : undefined,
          periode: selectedPeriode !== 'all' ? selectedPeriode : undefined,
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
    setSelectedPeriode('all');
    setPage(1);
  };

  const isFilterActive =
    Boolean(searchInput) ||
    selectedKecamatan !== 'all' ||
    selectedDesa !== 'all' ||
    selectedJenisUsaha !== 'all' ||
    selectedPeriode !== 'all';

  const handleDownloadTemplate = () => {
    const csvContent =
      'NIK,No KK,Nama Pemilik,Nama Usaha,No HP / WA,Kecamatan,Desa / Kelurahan,Jenis Usaha,Tahun Berdiri,Modal Sendiri (Rp),Modal Luar (Rp),Omset Tahunan (Rp),Tenaga Kerja,NIB,PIRT,Sertifikat Halal,HAKI,Tahun Pendataan\n' +
      '7405032209800001,7405032507120001,CONTOH PEMILIK,USAHA MAJU BERSAMA,085200000000,ANDOOLO,ANDOOLO,KULINER,2025,5000000,0,15000000,2,090/SKU/180/2025,-,-,-,2025\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Data_Pemutakhiran_UMKM_Konsel.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template CSV 18 kolom dinas berhasil diunduh');
  };

  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const handleProcessImport = async () => {
    if (!importFile) {
      toast.error('Silakan pilih file Excel/CSV terlebih dahulu');
      return;
    }

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast.error('Berkas CSV/Excel tidak memiliki baris data.');
        setIsImporting(false);
        return;
      }

      const records: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        const nik = (row[0] || '').replace(/[^0-9]/g, '');
        if (!nik || nik.length < 8) continue;

        records.push({
          nik,
          kk: row[1] || '-',
          namaPemilik: row[2] || 'Pelaku UMKM',
          namaUsaha: row[3] || 'Usaha Mikro',
          nohp: row[4] || '-',
          kecamatanNama: row[5] || '',
          desaNama: row[6] || '',
          jenisUsahaNama: row[7] || '',
          tahunBerdiri: row[8] ? Number(row[8]) : Number(importYear),
          modalSendiri: row[9] ? Number(row[9].replace(/[^0-9]/g, '')) : 0,
          modalLuar: row[10] ? Number(row[10].replace(/[^0-9]/g, '')) : 0,
          omsetTahun: row[11] ? Number(row[11].replace(/[^0-9]/g, '')) : 0,
          tenagaKerja: row[12] ? Number(row[12].replace(/[^0-9]/g, '')) : 1,
          nib: row[13] || '-',
          pirt: row[14] || '-',
          halal: row[15] || '-',
          haki: row[16] || '-',
          tahunPendataan: row[17] || importYear,
        });
      }

      if (records.length === 0) {
        toast.error('Tidak ada baris data dengan NIK valid yang dapat diimpor.');
        setIsImporting(false);
        return;
      }

      const res = await api.post('/pelaku-umkm/import', {
        records,
        tahun: importYear,
      });

      if (res.data?.status || res.status === 200) {
        const d = res.data;
        toast.success(
          `Impor Selesai: ${d.inserted || 0} data baru ditambahkan, ${d.updated || 0} data lama dimutakhirkan untuk tahun ${importYear}.`
        );
        setIsImportModalOpen(false);
        setImportFile(null);
        queryClient.invalidateQueries({ queryKey: ['pelaku-umkm'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      } else {
        toast.error(res.data?.message || 'Gagal memproses batch import.');
      }
    } catch (err: any) {
      console.error('[Import Error]:', err);
      toast.error(err.response?.data?.message || err.message || 'Gagal memproses impor berkas');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportData = () => {
    const listToExport = umkmResponse?.data || [];
    if (!listToExport || listToExport.length === 0) {
      toast.error('Tidak ada data pelaku UMKM untuk diexport');
      return;
    }

    const headers = [
      'NIK',
      'No KK',
      'Nama Pemilik',
      'Nama Usaha',
      'No HP',
      'Kecamatan',
      'Desa / Kelurahan',
      'Jenis Usaha',
      'Tahun Berdiri',
      'Modal Sendiri (Rp)',
      'Modal Luar (Rp)',
      'Omset Tahunan (Rp)',
      'Tenaga Kerja',
      'NIB',
      'PIRT',
      'Sertifikat Halal',
      'HAKI',
      'Status Data',
      'Periode Data',
    ];

    const rows = listToExport.map((item: any) => [
      `"${item.nik || '-'}"`,
      `"${item.kk || '-'}"`,
      `"${(item.namaPemilik || '').replace(/"/g, '""')}"`,
      `"${(item.namaUsaha || '').replace(/"/g, '""')}"`,
      `"${item.nohp || '-'}"`,
      `"${item.kecamatan?.nama || '-'}"`,
      `"${item.desa?.nama || '-'}"`,
      `"${item.jenisUsaha?.uraian || '-'}"`,
      item.tahunBerdiri || '-',
      item.modalSendiri || 0,
      item.modalLuar || 0,
      item.omsetTahun || 0,
      item.jumlahTenagaKerja || 0,
      `"${item.nib || '-'}"`,
      `"${item.pirt || '-'}"`,
      `"${item.halal || '-'}"`,
      `"${item.haki || '-'}"`,
      `"${item.statusData || 'BASELINE'}"`,
      `"${item.periodeData || '2021-2024'}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      headers.join(',') +
      '\n' +
      rows.map((r: any[]) => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Rekap_Data_UMKM_Konsel_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Berhasil mengekspor ${listToExport.length} data UMKM ke file Excel/CSV`);
  };

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
      omsetTahun: 0,
      tenagaKerja: 1,
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
      tahunBerdiri: String(item.tahunBerdiri || '2024'),
      modalSendiri: Number(item.modalSendiri) || 0,
      modalLuar: Number(item.modalLuar) || 0,
      omsetTahun: Number(item.omsetTahun) || 0,
      tenagaKerja: Number(item.jumlahTenagaKerja) || 1,
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="h-9 text-xs border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Export Excel (.csv)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-9 text-xs border-blue-500/40 hover:bg-blue-500/10 text-blue-700 dark:text-blue-300"
          >
            <Printer className="w-4 h-4 mr-1.5 text-blue-600" />
            Cetak Rekap Dinas
          </Button>
          <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Pelaku UMKM
          </Button>
        </div>
      </div>

      {/* Banner Status Baseline Terverifikasi (Tahap 1 Data Governance) */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm">Status Data: Baseline Terverifikasi Dinas (2021–2024)</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[10px] py-0 px-2 flex items-center gap-1 font-medium">
                <Lock className="w-2.5 h-2.5" /> Terkunci & Sah
              </Badge>
              <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono">
                17.671 UMKM Terdata
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Basis data dasar resmi 25 kecamatan se-Kabupaten Konawe Selatan. Data baru tahun 2025/2026 disiapkan melalui modul impor pemutakhiran terpadu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="h-8 text-xs border-emerald-600/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            Import Data 2025/2026
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadTemplate}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            title="Download Template Format Dinas"
          >
            <FileDown className="w-3.5 h-3.5 mr-1" />
            Template
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar: 4 Filter (Jenis Usaha, Kecamatan, Desa, Periode) + Pencarian */}
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

          {/* 4 Filters Group: Jenis Usaha, Kecamatan, Desa, Periode */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter 1: Jenis Usaha */}
            <div className="w-full sm:w-[150px]">
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
            <div className="w-full sm:w-[150px]">
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
            <div className="w-full sm:w-[150px]">
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
                        ? 'Pilih Kecamatan'
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

            {/* Filter 4: Periode Data */}
            <div className="w-full sm:w-[150px]">
              <Select
                value={selectedPeriode}
                onValueChange={(val) => {
                  setSelectedPeriode(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Periode Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  <SelectItem value="baseline">Baseline (2021–2024)</SelectItem>
                  <SelectItem value="2025">Pemutakhiran 2025</SelectItem>
                  <SelectItem value="2026">Pemutakhiran 2026</SelectItem>
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
                <th className="px-4 py-3">Periode & Status</th>
                <th className="px-4 py-3">Legalitas</th>
                <th className="px-4 py-3 text-right">Modal Usaha</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Memuat data UMKM...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                        <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm text-foreground">
                          {selectedPeriode === '2025' || selectedPeriode === '2026'
                            ? `Belum Ada Data Pemutakhiran Tahun ${selectedPeriode}`
                            : 'Tidak Ada Data Pelaku UMKM'}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedPeriode === '2025' || selectedPeriode === '2026'
                            ? `Seluruh 17.671 data UMKM saat ini tersimpan di Data Baseline (2021–2024). Data tahun ${selectedPeriode} akan otomatis terisi begitu Anda mengunggah file pemutakhiran dinas melalui tombol Import.`
                            : 'Tidak ditemukan data yang sesuai dengan kombinasi filter atau pencarian Anda. Silakan coba atur ulang filter.'}
                        </p>
                      </div>
                      {selectedPeriode === '2025' || selectedPeriode === '2026' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setImportYear(selectedPeriode);
                            setIsImportModalOpen(true);
                          }}
                          className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                          Unggah Berkas Pemutakhiran {selectedPeriode}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={handleResetFilter} className="text-xs">
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Reset Filter
                        </Button>
                      )}
                    </div>
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
                    <td className="px-4 py-3 text-xs">
                      {item.isBaseline || item.statusData === 'BASELINE' ? (
                        <div className="space-y-0.5">
                          <Badge variant="outline" className="font-normal bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1 w-fit text-[11px] py-0">
                            <Lock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                            Baseline (2021–2024)
                          </Badge>
                          <div className="text-[10px] text-muted-foreground">Tahun Berdiri: {item.tahunBerdiri || '2021'}</div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <Badge variant="outline" className="font-normal bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 flex items-center gap-1 w-fit text-[11px] py-0">
                            <Sparkles className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                            Update {item.tahunBerdiri || '2025'}
                          </Badge>
                          <div className="text-[10px] text-muted-foreground">Pemutakhiran</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs space-y-1">
                      {item.nib && item.nib !== '-' && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          NIB: {item.nib}
                        </div>
                      )}
                      {item.halal && item.halal !== '-' && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono">
                          Halal
                        </Badge>
                      )}
                      {item.pirt && item.pirt !== '-' && (
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
                          title="Edit Data Pelaku"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setSelectedItem(item);
                            if (item.isBaseline || item.statusData === 'BASELINE') {
                              setIsBaselineLockedAlertOpen(true);
                            } else {
                              setIsDeleteDialogOpen(true);
                            }
                          }}
                          title={
                            item.isBaseline || item.statusData === 'BASELINE'
                              ? 'Data Baseline Terkunci (Dilindungi)'
                              : 'Hapus Data'
                          }
                        >
                          {item.isBaseline || item.statusData === 'BASELINE' ? (
                            <Lock className="w-3.5 h-3.5 text-amber-500/80 hover:text-amber-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
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

      {/* Form Modal (Add / Edit) - Luas & Terstruktur */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {selectedItem ? 'Edit Data Pelaku UMKM' : 'Tambah Data Pelaku UMKM Baru'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Lengkapi data profil usaha, perizinan, dan permodalan terintegrasi Kabupaten Konawe Selatan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Bagian 1: Identitas Pemilik Usaha */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>1. Identitas Pemilik Usaha</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nik" className="text-xs font-medium">
                    NIK (16 Digit) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nik"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="Contoh: 740503xxxxxxxxxx"
                    maxLength={16}
                    required
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kk" className="text-xs font-medium">
                    Nomor Kartu Keluarga (KK)
                  </Label>
                  <Input
                    id="kk"
                    value={formData.kk}
                    onChange={(e) => setFormData({ ...formData, kk: e.target.value })}
                    placeholder="16 digit No. KK"
                    maxLength={16}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="namaPemilik" className="text-xs font-medium">
                    Nama Pemilik Usaha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="namaPemilik"
                    value={formData.namaPemilik}
                    onChange={(e) => setFormData({ ...formData, namaPemilik: e.target.value })}
                    placeholder="Nama lengkap sesuai KTP"
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nohp" className="text-xs font-medium">
                    No. Handphone / WhatsApp
                  </Label>
                  <Input
                    id="nohp"
                    value={formData.nohp}
                    onChange={(e) => setFormData({ ...formData, nohp: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Profil Usaha & Lokasi Wilayah */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Building className="w-4 h-4 text-blue-600" />
                <span>2. Profil Usaha & Wilayah Administratif</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="namaUsaha" className="text-xs font-medium">
                    Nama Usaha / Merek Dagang <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="namaUsaha"
                    value={formData.namaUsaha}
                    onChange={(e) => setFormData({ ...formData, namaUsaha: e.target.value })}
                    placeholder="Contoh: Keripik Pisang Gula Aren Mandiri"
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jenisUsahaId" className="text-xs font-medium">
                    Sektor / Jenis Usaha
                  </Label>
                  <Select
                    value={formData.jenisUsahaId}
                    onValueChange={(val) => setFormData({ ...formData, jenisUsahaId: val })}
                  >
                    <SelectTrigger id="jenisUsahaId" className="h-9 text-xs">
                      <SelectValue placeholder="Pilih Jenis Usaha" />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisUsahaList?.map((ju: any) => (
                        <SelectItem key={ju.id} value={ju.id} className="text-xs">
                          {ju.uraian}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kecamatanId" className="text-xs font-medium">
                    Kecamatan
                  </Label>
                  <Select
                    value={formData.kecamatanId}
                    onValueChange={(val) => setFormData({ ...formData, kecamatanId: val, desaId: '' })}
                  >
                    <SelectTrigger id="kecamatanId" className="h-9 text-xs">
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
                  <Label htmlFor="desaId" className="text-xs font-medium">
                    Desa / Kelurahan
                  </Label>
                  <Select
                    value={formData.desaId}
                    onValueChange={(val) => setFormData({ ...formData, desaId: val })}
                    disabled={!formData.kecamatanId}
                  >
                    <SelectTrigger id="desaId" className="h-9 text-xs">
                      <SelectValue placeholder={formData.kecamatanId ? 'Pilih Desa/Kelurahan' : 'Pilih Kecamatan Terlebih Dahulu'} />
                    </SelectTrigger>
                    <SelectContent>
                      {desaList?.map((des: any) => (
                        <SelectItem key={des.id} value={des.id} className="text-xs">
                          {des.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tahunBerdiri" className="text-xs font-medium">
                    Tahun Berdiri / Mulai Beroperasi
                  </Label>
                  <Input
                    id="tahunBerdiri"
                    value={formData.tahunBerdiri}
                    onChange={(e) => setFormData({ ...formData, tahunBerdiri: e.target.value })}
                    placeholder="Contoh: 2024"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Legalitas & Perizinan */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-teal-600" />
                <span>3. Legalitas & Sertifikasi Usaha</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nib" className="text-xs font-medium">
                    Nomor Induk Berusaha (NIB)
                  </Label>
                  <Input
                    id="nib"
                    value={formData.nib}
                    onChange={(e) => setFormData({ ...formData, nib: e.target.value })}
                    placeholder="Contoh: 9120001234567"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pirt" className="text-xs font-medium">
                    Izin Edar P-IRT
                  </Label>
                  <Input
                    id="pirt"
                    value={formData.pirt}
                    onChange={(e) => setFormData({ ...formData, pirt: e.target.value })}
                    placeholder="Contoh: P-IRT 2067405..."
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="halal" className="text-xs font-medium">
                    Sertifikat Halal
                  </Label>
                  <Input
                    id="halal"
                    value={formData.halal}
                    onChange={(e) => setFormData({ ...formData, halal: e.target.value })}
                    placeholder="Contoh: ID7405000..."
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="haki" className="text-xs font-medium">
                    Hak Merek Dagang (HAKI)
                  </Label>
                  <Input
                    id="haki"
                    value={formData.haki}
                    onChange={(e) => setFormData({ ...formData, haki: e.target.value })}
                    placeholder="No. Pendaftaran Merek"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 4: Permodalan, Omset & Tenaga Kerja */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>4. Permodalan, Omset & Ketenagakerjaan</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modalSendiri" className="text-xs font-medium">
                    Modal Sendiri (Rp)
                  </Label>
                  <Input
                    id="modalSendiri"
                    type="number"
                    value={formData.modalSendiri}
                    onChange={(e) => setFormData({ ...formData, modalSendiri: Number(e.target.value) })}
                    placeholder="0"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modalLuar" className="text-xs font-medium">
                    Modal Luar / Pinjaman (Rp)
                  </Label>
                  <Input
                    id="modalLuar"
                    type="number"
                    value={formData.modalLuar}
                    onChange={(e) => setFormData({ ...formData, modalLuar: Number(e.target.value) })}
                    placeholder="0"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="omsetTahun" className="text-xs font-medium">
                    Estimasi Omset per Tahun (Rp)
                  </Label>
                  <Input
                    id="omsetTahun"
                    type="number"
                    value={formData.omsetTahun}
                    onChange={(e) => setFormData({ ...formData, omsetTahun: Number(e.target.value) })}
                    placeholder="0"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tenagaKerja" className="text-xs font-medium">
                    Tenaga Kerja (Orang)
                  </Label>
                  <Input
                    id="tenagaKerja"
                    type="number"
                    value={formData.tenagaKerja}
                    onChange={(e) => setFormData({ ...formData, tenagaKerja: Number(e.target.value) })}
                    placeholder="1"
                    min={0}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                  <Label htmlFor="keterangan" className="text-xs font-medium">
                    Catatan / Keterangan Operasional
                  </Label>
                  <Input
                    id="keterangan"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Keterangan tambahan mengenai status operasional atau lokasi usaha..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/40 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[140px]"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Data Pelaku UMKM'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation (Hanya untuk non-baseline) */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Data Pelaku UMKM?</DialogTitle>
            <DialogDescription>
              Data usaha <strong>{selectedItem?.namaUsaha}</strong> milik <strong>{selectedItem?.namaPemilik}</strong> akan dihapus permanen dari sistem.
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

      {/* Baseline Locked Alert Modal (Proteksi Data Baseline) */}
      <AlertDialog open={isBaselineLockedAlertOpen} onOpenChange={setIsBaselineLockedAlertOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-1">
              <Lock className="w-5 h-5" />
              <AlertDialogTitle className="text-base">Data Baseline Resmi Terkunci</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>
                Data usaha <strong>{selectedItem?.namaUsaha}</strong> merupakan bagian dari <strong>Basis Data Baseline Resmi (Periode 2021–2024)</strong> yang telah divalidasi oleh Dinas Koperasi & UKM Kab. Konawe Selatan.
              </p>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                Untuk menjaga integritas rekam jejak inovasi daerah dan bukti dukung audit evaluasi Smart City, 17.671 data baseline dilindungi dari penghapusan bebas.
              </div>
              <p>
                Jika data ini memerlukan koreksi informasi, gunakan tombol <strong>Edit</strong> untuk memperbarui data tanpa menghapus rekam jejaknya.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setIsBaselineLockedAlertOpen(false);
                if (selectedItem) handleOpenEdit(selectedItem);
              }}
              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Buka Form Edit
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Dialog Import Data Baru 2025/2026 (Tahap 3 Data Governance) */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <UploadCloud className="w-5 h-5" />
              <DialogTitle>Import Data Pemutakhiran 2025/2026</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Unggah berkas hasil pemutakhiran data lapangan (.xlsx atau .csv) dari Dinas Koperasi & UKM untuk diintegrasikan ke sistem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Pilihan Tahun Pendataan */}
            <div className="space-y-1.5">
              <Label htmlFor="importYear" className="text-xs font-medium">Tahun Pemutakhiran Data</Label>
              <Select value={importYear} onValueChange={setImportYear}>
                <SelectTrigger id="importYear" className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">Tahun 2025 (Monitoring Berjalan)</SelectItem>
                  <SelectItem value="2026">Tahun 2026 (Tahun Terkini)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dropzone Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pilih Berkas Excel / CSV</Label>
              <div className="border-2 border-dashed border-border/80 hover:border-emerald-500/60 transition-colors rounded-xl p-5 text-center flex flex-col items-center justify-center bg-muted/20">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                <input
                  type="file"
                  id="excelUpload"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImportFile(file);
                  }}
                />
                <label
                  htmlFor="excelUpload"
                  className="cursor-pointer text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {importFile ? importFile.name : 'Pilih file dari komputer Anda'}
                </label>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Format yang didukung: .xlsx, .xls, .csv (Maks. 25 MB)
                </p>
                {importFile && (
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    Ukuran: {(importFile.size / 1024).toFixed(1)} KB
                  </Badge>
                )}
              </div>
            </div>

            {/* Format Info & Template */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                  Format Standar 18 Kolom Dinas
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-7 text-xs text-emerald-600 hover:text-emerald-500 px-2"
                >
                  Unduh Template
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sistem akan memvalidasi NIK secara otomatis: jika pelaku usaha lama sudah ada, data omset & legalitasnya akan diperbarui; jika pelaku baru, akan didaftarkan ke tahun {importYear}.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isImporting}
              onClick={() => setIsImportModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={!importFile || isImporting}
              onClick={handleProcessImport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memvalidasi & Memproses...
                </>
              ) : (
                'Mulai Sinkronisasi Data'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Cetak Rekapitulasi Ber-Kop Dinas Resmi */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Printer className="w-5 h-5" />
                <DialogTitle>Pratinjau Lembar Rekapitulasi Dinas</DialogTitle>
              </div>
              <Button size="sm" onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white">
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
                REKAPITULASI DATA PELAKU USAHA MIKRO, KECIL, DAN MENENGAH (UMKM)
              </h3>
              <p className="text-[11px] text-gray-700 mt-0.5">
                Sistem Informasi APLI DAKOP v2.0 — Dimensi Smart Economy Kabupaten Konawe Selatan
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-[10px] text-gray-600 mt-1">
                <span>Filter: {selectedPeriode === 'all' ? 'Semua Periode' : selectedPeriode === 'baseline' ? 'Baseline (2021-2024)' : `Tahun ${selectedPeriode}`}</span>
                <span>•</span>
                <span>Total Data Tampil: {items.length} Baris</span>
                <span>•</span>
                <span>Waktu Unduh: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Tabel Data Rekapitulasi */}
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-[10px] border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 font-semibold">
                    <th className="border border-gray-400 p-1.5 text-center w-7">No</th>
                    <th className="border border-gray-400 p-1.5 text-left">NIK & Nama Pemilik</th>
                    <th className="border border-gray-400 p-1.5 text-left">Nama Usaha</th>
                    <th className="border border-gray-400 p-1.5 text-left">Sektor Usaha</th>
                    <th className="border border-gray-400 p-1.5 text-left">Kecamatan / Desa</th>
                    <th className="border border-gray-400 p-1.5 text-center">NIB</th>
                    <th className="border border-gray-400 p-1.5 text-right">Modal Sendiri</th>
                    <th className="border border-gray-400 p-1.5 text-right">Omset/Thn</th>
                    <th className="border border-gray-400 p-1.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-400 p-1 text-center">{idx + 1}</td>
                      <td className="border border-gray-400 p-1">
                        <div className="font-semibold">{item.namaPemilik}</div>
                        <div className="text-[9px] text-gray-600 font-mono">{item.nik}</div>
                      </td>
                      <td className="border border-gray-400 p-1 font-medium">{item.namaUsaha}</td>
                      <td className="border border-gray-400 p-1">{item.jenisUsaha?.uraian || '-'}</td>
                      <td className="border border-gray-400 p-1">
                        <div>{item.kecamatan?.nama || '-'}</div>
                        <div className="text-[9px] text-gray-600">{item.desa?.nama || '-'}</div>
                      </td>
                      <td className="border border-gray-400 p-1 text-center font-mono text-[9px]">
                        {item.nib && item.nib !== '-' ? item.nib : 'Belum Ada'}
                      </td>
                      <td className="border border-gray-400 p-1 text-right font-mono">
                        Rp {Number(item.modalSendiri || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="border border-gray-400 p-1 text-right font-mono">
                        Rp {Number(item.omsetTahun || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="border border-gray-400 p-1 text-center">
                        <span className="text-[9px] px-1 py-0.5 rounded font-semibold bg-gray-200 text-gray-800">
                          {item.statusData || 'BASELINE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lembar Tanda Tangan Resmi Pengesahan */}
            <div className="flex justify-between items-end mt-8 pt-4 text-xs text-gray-900">
              <div className="text-center">
                <p>Operator Verifikasi Sistem,</p>
                <div className="h-14"></div>
                <p className="font-semibold underline">Staf Bidang Pemberdayaan UMKM</p>
                <p className="text-[10px] text-gray-600">Dinas Koperasi & UKM Kab. Konawe Selatan</p>
              </div>

              <div className="text-center">
                <p>Andoolo, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
            <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white">
              <Printer className="w-4 h-4 mr-2" />
              Cetak Dokumen Sekarang (Print / PDF)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
