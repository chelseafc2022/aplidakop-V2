'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import {
  HandCoins,
  Gift,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  Check,
  CheckCircle2,
  Building2,
  UserCheck,
  RotateCcw,
  Calendar,
  MapPin,
  Loader2,
  X,
  CreditCard,
  Package,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  History,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PembiayaanItem {
  id: string;
  pelakuId: string;
  namaPemilik: string;
  nik: string;
  kk?: string;
  nohp?: string;
  namaUsaha: string;
  alamat: string;
  kecamatan: string;
  desa: string;
  jenisUsaha: string;
  tahun: number;
  bantuTunai: string;
  bantuSarana: string;
  keterangan: string;
  createAt?: string;
}

interface PelakuUmkmSearchItem {
  id: string;
  namaPemilik: string;
  nik: string;
  namaUsaha: string;
  alamat?: string;
  kecamatan?: { id?: string; nama?: string } | string;
  desa?: { id?: string; nama?: string } | string;
  jenisUsaha?: { id?: string; nama?: string } | string;
}

export default function PembiayaanUmkmPage() {
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [selectedTahun, setSelectedTahun] = useState<string>('all');
  const [selectedJenisBantuan, setSelectedJenisBantuan] = useState<string>('all');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Dialog States
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PembiayaanItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    tahun: number;
    pelakuId: string;
    jenisBantuan: 'tunai' | 'sarana' | 'both';
    bantuTunai: string;
    bantuSarana: string;
    keterangan: string;
    selectedPelaku: PelakuUmkmSearchItem | null;
  }>({
    tahun: new Date().getFullYear(),
    pelakuId: '',
    jenisBantuan: 'sarana',
    bantuTunai: '',
    bantuSarana: '',
    keterangan: '',
    selectedPelaku: null,
  });

  // Pelaku UMKM Searchable Combobox State inside Form
  const [umkmSearchQuery, setUmkmSearchQuery] = useState('');
  const debouncedUmkmQuery = useDebounce(umkmSearchQuery, 300);
  const [isUmkmSelectorOpen, setIsUmkmSelectorOpen] = useState(false);

  // Fetch Kecamatan List for Filter
  const { data: kecamatanList } = useQuery({
    queryKey: ['wilayah-kecamatan-list'],
    queryFn: async () => {
      const res = await api.get('/wilayah/kecamatan');
      return res.data?.data || res.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch Main Pembiayaan/Bansos List
  const { data: pembiayaanData, isLoading } = useQuery({
    queryKey: ['pembiayaan-umkm-list', page, limit, debouncedSearch, selectedTahun, selectedJenisBantuan, selectedKecamatan],
    queryFn: async () => {
      const res = await api.get('/pembiayaan/umkm', {
        params: {
          page,
          limit,
          search: debouncedSearch,
          tahun: selectedTahun,
          jenisBantuan: selectedJenisBantuan,
          kecamatanId: selectedKecamatan,
        },
      });
      return res.data;
    },
  });

  const list: PembiayaanItem[] = useMemo(() => {
    if (Array.isArray(pembiayaanData?.data)) return pembiayaanData.data;
    if (Array.isArray(pembiayaanData)) return pembiayaanData;
    return [];
  }, [pembiayaanData]);

  const meta = pembiayaanData?.meta || {
    page: 1,
    limit: 10,
    total: list.length,
    totalPages: 1,
  };

  // Async query for Pelaku UMKM Search inside Dialog
  const { data: umkmSearchResults, isFetching: isSearchingUmkm } = useQuery({
    queryKey: ['search-pelaku-umkm-combobox', debouncedUmkmQuery],
    queryFn: async () => {
      const res = await api.get('/pelaku-umkm', {
        params: {
          search: debouncedUmkmQuery,
          limit: 15,
        },
      });
      return res.data?.data || [];
    },
    enabled: isFormDialogOpen && (isUmkmSelectorOpen || !formData.pelakuId),
    staleTime: 60 * 1000,
  });

  // Query Riwayat Seluruh Penerima Bantuan (untuk penandaan & validasi tahun)
  const { data: riwayatData } = useQuery({
    queryKey: ['riwayat-penerima-bantuan-list'],
    queryFn: async () => {
      const res = await api.get('/pembiayaan/umkm/riwayat');
      return res.data?.data || [];
    },
    staleTime: 60 * 1000,
  });

  // Map riwayat berdasarkan pelakuId
  const riwayatPenerimaMap = useMemo(() => {
    const map: Record<string, Array<{ id: string; tahun: number; bantuTunai: string; bantuSarana: string; keterangan: string }>> = {};
    if (Array.isArray(riwayatData)) {
      riwayatData.forEach((item: any) => {
        const pId = String(item.pelakuId);
        if (!map[pId]) {
          map[pId] = [];
        }
        map[pId].push(item);
      });
    }
    return map;
  }, [riwayatData]);

  // Evaluasi riwayat untuk pelaku terpilih
  const selectedPelakuRiwayat = useMemo(() => {
    if (!formData.pelakuId) return [];
    return riwayatPenerimaMap[formData.pelakuId] || [];
  }, [formData.pelakuId, riwayatPenerimaMap]);

  // Cek apakah pelaku terpilih sudah pernah menerima bantuan di tahun formData.tahun yang sama
  const isDuplicateSameYear = useMemo(() => {
    if (!formData.pelakuId) return false;
    return selectedPelakuRiwayat.some(
      (r) => r.tahun === Number(formData.tahun) && (formMode === 'create' || r.id !== formData.id)
    );
  }, [formData.pelakuId, formData.tahun, selectedPelakuRiwayat, formMode, formData.id]);

  // Quick stats calculation
  const totalPenerima = meta.total || list.length;
  const totalBantuanSarana = list.filter((i) => i.bantuSarana && i.bantuSarana !== '-').length;
  const totalBantuanTunai = list.filter((i) => i.bantuTunai && i.bantuTunai !== '-').length;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/pembiayaan/umkm', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembiayaan-umkm-list'] });
      queryClient.invalidateQueries({ queryKey: ['riwayat-penerima-bantuan-list'] });
      toast.success('Data bantuan UMKM berhasil ditambahkan');
      setIsFormDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan data bantuan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.put(`/pembiayaan/umkm/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembiayaan-umkm-list'] });
      queryClient.invalidateQueries({ queryKey: ['riwayat-penerima-bantuan-list'] });
      toast.success('Data bantuan UMKM berhasil diperbarui');
      setIsFormDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui data bantuan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pembiayaan/umkm/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembiayaan-umkm-list'] });
      queryClient.invalidateQueries({ queryKey: ['riwayat-penerima-bantuan-list'] });
      toast.success('Data bantuan berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus data');
    },
  });

  const resetForm = () => {
    setFormData({
      tahun: new Date().getFullYear(),
      pelakuId: '',
      jenisBantuan: 'sarana',
      bantuTunai: '',
      bantuSarana: '',
      keterangan: '',
      selectedPelaku: null,
    });
    setUmkmSearchQuery('');
    setIsUmkmSelectorOpen(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setFormMode('create');
    setIsFormDialogOpen(true);
  };

  const handleOpenEdit = (item: PembiayaanItem) => {
    const hasTunai = Boolean(item.bantuTunai && item.bantuTunai !== '-' && item.bantuTunai !== '0');
    const hasSarana = Boolean(item.bantuSarana && item.bantuSarana !== '-');

    let jb: 'tunai' | 'sarana' | 'both' = 'sarana';
    if (hasTunai && hasSarana) jb = 'both';
    else if (hasTunai) jb = 'tunai';

    setFormData({
      id: item.id,
      tahun: item.tahun || new Date().getFullYear(),
      pelakuId: item.pelakuId,
      jenisBantuan: jb,
      bantuTunai: item.bantuTunai || '',
      bantuSarana: item.bantuSarana || '',
      keterangan: item.keterangan === '-' ? '' : item.keterangan,
      selectedPelaku: {
        id: item.pelakuId,
        namaPemilik: item.namaPemilik,
        nik: item.nik,
        namaUsaha: item.namaUsaha,
        alamat: item.alamat,
        kecamatan: item.kecamatan,
        desa: item.desa,
        jenisUsaha: item.jenisUsaha,
      },
    });
    setUmkmSearchQuery('');
    setIsUmkmSelectorOpen(false);
    setFormMode('edit');
    setIsFormDialogOpen(true);
  };

  const handleOpenDetail = (item: PembiayaanItem) => {
    setSelectedItem(item);
    setIsDetailDialogOpen(true);
  };

  const handleOpenDelete = (item: PembiayaanItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSelectPelaku = (umkm: any) => {
    setFormData((prev) => ({
      ...prev,
      pelakuId: umkm.id,
      selectedPelaku: {
        id: umkm.id,
        namaPemilik: umkm.namaPemilik,
        nik: umkm.nik,
        namaUsaha: umkm.namaUsaha,
        alamat: umkm.alamat,
        kecamatan: typeof umkm.kecamatan === 'object' ? umkm.kecamatan?.nama : umkm.kecamatan,
        desa: typeof umkm.desa === 'object' ? umkm.desa?.nama : umkm.desa,
        jenisUsaha: typeof umkm.jenisUsaha === 'object' ? umkm.jenisUsaha?.nama : umkm.jenisUsaha,
      },
    }));
    setIsUmkmSelectorOpen(false);
    setUmkmSearchQuery('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pelakuId) {
      toast.error('Pilih pelaku UMKM terlebih dahulu!');
      return;
    }

    if (isDuplicateSameYear) {
      toast.error(
        `Pelaku usaha ini sudah terdaftar menerima bantuan pada tahun ${formData.tahun}. Penambahan bantuan hanya diizinkan pada tahun anggaran yang berbeda!`
      );
      return;
    }

    if (formData.jenisBantuan === 'tunai' && !formData.bantuTunai.trim()) {
      toast.error('Isi nominal bantuan tunai!');
      return;
    }

    if (formData.jenisBantuan === 'sarana' && !formData.bantuSarana.trim()) {
      toast.error('Isi nama bantuan sarana/peralatan!');
      return;
    }

    if (formData.jenisBantuan === 'both' && !formData.bantuTunai.trim() && !formData.bantuSarana.trim()) {
      toast.error('Isi minimal salah satu bantuan tunai atau sarana!');
      return;
    }

    const payload = {
      pelakuId: formData.pelakuId,
      tahun: Number(formData.tahun),
      bantuTunai: formData.jenisBantuan === 'sarana' ? '' : formData.bantuTunai,
      bantuSarana: formData.jenisBantuan === 'tunai' ? '' : formData.bantuSarana,
      keterangan: formData.keterangan || '-',
    };

    if (formMode === 'create') {
      createMutation.mutate(payload);
    } else if (formMode === 'edit' && formData.id) {
      updateMutation.mutate({ id: formData.id, payload });
    }
  };

  const formatRupiah = (val: string | number) => {
    if (!val || val === '-') return '-';
    const cleanNum = Number(String(val).replace(/[^0-9]/g, ''));
    if (isNaN(cleanNum) || cleanNum === 0) return String(val);
    return `Rp ${cleanNum.toLocaleString('id-ID')}`;
  };

  const resetFilters = () => {
    setSearchInput('');
    setSelectedTahun('all');
    setSelectedJenisBantuan('all');
    setSelectedKecamatan('all');
    setPage(1);
  };

  return (
    <div className="px-4 lg:px-8 space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Bansos & Bantuan UMKM</h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium">
              Fasilitasi & Stimulan
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pencatatan dan monitoring bantuan stimulan modal tunai serta bantuan sarana usaha bagi pelaku UMKM Kabupaten Konawe Selatan
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Penerima Bantuan
          </Button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Penerima Bantuan</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalPenerima.toLocaleString('id-ID')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Pelaku UMKM terdaftar</p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bantuan Sarana / Alat</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalBantuanSarana}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Etalase, gerobak, box, dll.</p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bantuan Tunai (Permodalan)</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalBantuanTunai}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Stimulan modal tunai</p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border/60 shadow-none">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari pemilik, nama usaha, NIK, jenis sarana..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tahun */}
            <div>
              <Select
                value={selectedTahun}
                onValueChange={(val) => {
                  setSelectedTahun(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  <SelectItem value="2026">Tahun 2026</SelectItem>
                  <SelectItem value="2025">Tahun 2025</SelectItem>
                  <SelectItem value="2024">Tahun 2024</SelectItem>
                  <SelectItem value="2023">Tahun 2023</SelectItem>
                  <SelectItem value="2022">Tahun 2022</SelectItem>
                  <SelectItem value="2021">Tahun 2021</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Jenis Bantuan */}
            <div>
              <Select
                value={selectedJenisBantuan}
                onValueChange={(val) => {
                  setSelectedJenisBantuan(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Bantuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bantuan</SelectItem>
                  <SelectItem value="sarana">Bantuan Sarana</SelectItem>
                  <SelectItem value="tunai">Bantuan Tunai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Kecamatan */}
            <div className="flex gap-2">
              <Select
                value={selectedKecamatan}
                onValueChange={(val) => {
                  setSelectedKecamatan(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kecamatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kecamatan</SelectItem>
                  {kecamatanList?.map((k: any) => (
                    <SelectItem key={k.id || k.kecamatan_id} value={String(k.id || k.kecamatan_id)}>
                      {k.nama || k.nama_kecamatan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchInput || selectedTahun !== 'all' || selectedJenisBantuan !== 'all' || selectedKecamatan !== 'all') && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetFilters}
                  title="Reset Filter"
                  className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Data */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-muted/60 text-xs uppercase text-muted-foreground border-b border-border/50">
                <th className="px-4 py-3.5 w-12 text-center font-semibold">No</th>
                <th className="px-4 py-3.5 font-semibold min-w-[200px]">Penerima UMKM</th>
                <th className="px-4 py-3.5 font-semibold min-w-[180px]">Nama Usaha & Bidang</th>
                <th className="px-4 py-3.5 font-semibold min-w-[160px]">Wilayah</th>
                <th className="px-4 py-3.5 text-center font-semibold w-24">Tahun</th>
                <th className="px-4 py-3.5 font-semibold min-w-[140px]">Bantuan Tunai</th>
                <th className="px-4 py-3.5 font-semibold min-w-[150px]">Bantuan Sarana</th>
                <th className="px-4 py-3.5 font-semibold min-w-[160px]">Keterangan</th>
                <th className="px-4 py-3.5 text-center font-semibold w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Memuat data bantuan UMKM...</span>
                    </div>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Gift className="w-8 h-8 text-muted-foreground/60" />
                      <p className="font-medium text-foreground">Tidak ada data penerima bantuan</p>
                      <p className="text-xs text-muted-foreground">
                        Belum ada data yang sesuai dengan pencarian atau filter yang dipilih. Silakan klik Tambah Penerima Bantuan untuk mencatat baru.
                      </p>
                      <Button onClick={handleOpenAdd} size="sm" variant="outline" className="mt-2">
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Tambah Sekarang
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                list.map((item, idx) => {
                  const hasTunai = Boolean(item.bantuTunai && item.bantuTunai !== '-' && item.bantuTunai !== '0');
                  const hasSarana = Boolean(item.bantuSarana && item.bantuSarana !== '-');

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* No */}
                      <td className="px-4 py-3 text-center text-xs font-mono text-muted-foreground">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      {/* Penerima UMKM (Nama Pemilik & NIK) */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{item.namaPemilik}</div>
                        <div className="text-xs font-mono text-muted-foreground tracking-tight">
                          NIK: {item.nik || '-'}
                        </div>
                      </td>

                      {/* Nama Usaha & Jenis Usaha */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{item.namaUsaha || '-'}</div>
                        <div className="text-xs text-muted-foreground">{item.jenisUsaha || 'Usaha Mikro'}</div>
                      </td>

                      {/* Wilayah */}
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-foreground">{item.desa ? `Desa ${item.desa}` : '-'}</div>
                        <div className="text-muted-foreground">Kec. {item.kecamatan || '-'}</div>
                      </td>

                      {/* Tahun */}
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="font-mono text-xs font-semibold bg-background">
                          {item.tahun}
                        </Badge>
                      </td>

                      {/* Bantuan Tunai */}
                      <td className="px-4 py-3 text-xs">
                        {hasTunai ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatRupiah(item.bantuTunai)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Bantuan Sarana */}
                      <td className="px-4 py-3 text-xs">
                        {hasSarana ? (
                          <Badge className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 font-medium max-w-[180px] truncate block text-left">
                            {item.bantuSarana}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Keterangan */}
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate" title={item.keterangan}>
                        {item.keterangan || '-'}
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Lihat Detail"
                            onClick={() => handleOpenDetail(item)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                            title="Ubah Data"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                            title="Hapus Data"
                            onClick={() => handleOpenDelete(item)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Menampilkan <span className="font-semibold text-foreground">{list.length}</span> dari{' '}
            <span className="font-semibold text-foreground">{meta.total || 0}</span> penerima bantuan
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Sebelumnya
            </Button>
            <div className="px-3 font-medium text-foreground">
              Halaman {page} dari {meta.totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (meta.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 px-2.5 text-xs"
            >
              Berikutnya
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ============================================================== */}
      {/* DIALOG TAMBAH & EDIT BANTUAN UMKM */}
      {/* ============================================================== */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="w-[96vw] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl">
          <DialogHeader className="px-6 py-4 sm:px-8 sm:py-5 border-b border-border/40 bg-muted/20 shrink-0">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span>{formMode === 'create' ? 'Tambah Penerima Bantuan UMKM' : 'Ubah Data Bantuan UMKM'}</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  {formMode === 'create'
                    ? 'Pilih penerima dari database master UMKM lalu tentukan rincian bantuan stimulan yang disalurkan.'
                    : 'Perbarui rincian jenis bantuan, nominal/sarana, atau tahun penyaluran penerima bantuan.'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* KOLOM KIRI: DATA PENERIMA UMKM */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Data Penerima UMKM</h3>
                    </div>
                    {formData.selectedPelaku && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                        Terpilih
                      </Badge>
                    )}
                  </div>

                  {/* KONDISI 1: SUDAH ADA PELAKU TERPILIH & COMBOBOX DITUTUP */}
                  {formData.selectedPelaku && !isUmkmSelectorOpen ? (
                    <div className="p-5 rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/25 space-y-4 shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase font-semibold text-emerald-700 dark:text-emerald-300 tracking-wider">
                            Pelaku UMKM Terdaftar
                          </div>
                          <h4 className="text-lg font-bold text-foreground mt-0.5">
                            {formData.selectedPelaku.namaPemilik}
                          </h4>
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white mt-1 text-xs">
                            {formData.selectedPelaku.namaUsaha || 'Usaha Mikro'}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsUmkmSelectorOpen(true);
                            setUmkmSearchQuery('');
                          }}
                          className="h-8 text-xs border-emerald-500/30 hover:bg-emerald-500/10"
                        >
                          Ganti Pelaku
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-500/20 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">NIK</span>
                          <span className="font-mono font-semibold text-foreground tracking-tight">
                            {formData.selectedPelaku.nik}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Bidang Usaha</span>
                          <span className="font-medium text-foreground">
                            {typeof formData.selectedPelaku.jenisUsaha === 'object'
                              ? (formData.selectedPelaku.jenisUsaha as any)?.nama || '-'
                              : formData.selectedPelaku.jenisUsaha || 'Usaha Mikro'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground block text-[11px]">Lokasi Wilayah</span>
                          <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {typeof formData.selectedPelaku.desa === 'string' && formData.selectedPelaku.desa
                                ? `Desa ${formData.selectedPelaku.desa}, `
                                : ''}
                              Kec.{' '}
                              {typeof formData.selectedPelaku.kecamatan === 'string'
                                ? formData.selectedPelaku.kecamatan
                                : (formData.selectedPelaku.kecamatan as any)?.nama || '-'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* RIWAYAT BANTUAN PELAKU TERPILIH & VALIDASI TAHUN */}
                      {selectedPelakuRiwayat.length > 0 ? (
                        <div className="space-y-2.5 pt-3 border-t border-emerald-500/20">
                          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                            <span className="flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              Riwayat Bantuan Sebelumnya:
                            </span>
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[11px]">
                              {selectedPelakuRiwayat.length}x Pernah Menerima
                            </Badge>
                          </div>

                          <div className="space-y-1.5">
                            {selectedPelakuRiwayat.map((r) => (
                              <div
                                key={r.id}
                                className="text-[11px] p-2.5 rounded-lg bg-background/90 border border-border/60 flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs font-bold py-0">
                                    Thn {r.tahun}
                                  </Badge>
                                  <span className="font-medium text-foreground">
                                    {r.bantuSarana ? `Sarana: ${r.bantuSarana}` : (r.bantuTunai ? `Tunai: Rp ${r.bantuTunai}` : 'Bantuan')}
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">
                                  {r.keterangan || '-'}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* STATUS VALIDASI TAHUN SAMA VS TAHUN BERBEDA */}
                          {isDuplicateSameYear ? (
                            <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                              <div className="font-bold flex items-center gap-1.5 text-xs">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Sudah Tercatat Menerima Bantuan pada Tahun {formData.tahun}!</span>
                              </div>
                              <p className="leading-relaxed">
                                Pelaku usaha ini sudah pernah menerima bantuan di tahun <strong>{formData.tahun}</strong>. Pendataan baru untuk pelaku yang sama <strong>hanya dapat diinputkan pada tahun anggaran yang berbeda</strong>.
                              </p>
                              <p className="text-[11px] text-muted-foreground pt-0.5">
                                👉 Silakan ubah pilihan <strong>Tahun Penerima</strong> di kolom sebelah kanan.
                              </p>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>
                                Tahun <strong>{formData.tahun}</strong> berbeda dari riwayat sebelumnya ({selectedPelakuRiwayat.map((r) => r.tahun).join(', ')}). <strong>Siap didata untuk tahun baru ini.</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-emerald-500/20">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Penerima Baru (Belum pernah tercatat menerima bantuan sebelumnya)</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* KONDISI 2: SEARCHABLE COMBOBOX DARI MASTER UMKM */
                    <div className="space-y-3 rounded-xl border border-border/70 p-4 bg-muted/20">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-foreground">
                          Cari Nama Pemilik / Nama Usaha / NIK *
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Ketik minimal 2-3 huruf untuk mencari di master 17.000+ data UMKM. Pelaku yang pernah menerima bantuan akan ditandai.
                        </p>
                      </div>

                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Contoh: Martini, Kios Eka, atau 7405..."
                          value={umkmSearchQuery}
                          onChange={(e) => setUmkmSearchQuery(e.target.value)}
                          className="pl-10 h-10 bg-background text-sm"
                          autoFocus
                        />
                        {isSearchingUmkm && (
                          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-600" />
                        )}
                      </div>

                      {/* Dropdown Hasil Pencarian yang Luas */}
                      <div className="max-h-72 overflow-y-auto divide-y divide-border/40 rounded-lg border bg-background shadow-xs">
                        {isSearchingUmkm && (!umkmSearchResults || umkmSearchResults.length === 0) ? (
                          <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600" />
                            <span>Mencari di master data UMKM Konawe Selatan...</span>
                          </div>
                        ) : umkmSearchResults?.length === 0 ? (
                          <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                            <p className="font-semibold text-foreground">Data tidak ditemukan</p>
                            <p>Tidak ada pelaku UMKM dengan kata kunci "{umkmSearchQuery}".</p>
                          </div>
                        ) : (
                          umkmSearchResults?.map((u: any) => {
                            const isChosen = formData.pelakuId === u.id;
                            const kecNama = typeof u.kecamatan === 'object' ? u.kecamatan?.nama : u.kecamatan || '-';
                            const desaNama = typeof u.desa === 'object' ? u.desa?.nama : u.desa || '-';

                            // Cek riwayat bantuan pelaku ini
                            const riwayat = riwayatPenerimaMap[u.id] || [];
                            const pernahDapat = riwayat.length > 0;
                            const tahunList = riwayat.map((r) => r.tahun);
                            const sudahDapatTahunIni = riwayat.some((r) => r.tahun === Number(formData.tahun));

                            return (
                              <div
                                key={u.id}
                                onClick={() => handleSelectPelaku(u)}
                                className={`p-3.5 cursor-pointer hover:bg-emerald-500/10 transition-colors flex items-center justify-between text-left ${
                                  isChosen ? 'bg-emerald-500/15' : ''
                                }`}
                              >
                                <div className="space-y-1.5 flex-1 pr-2">
                                  {/* Baris 1: Nama Pemilik, Nama Usaha & Penanda Pernah Dapat Bantuan */}
                                  <div className="font-bold text-sm text-foreground flex flex-wrap items-center gap-2">
                                    <span>{u.namaPemilik}</span>
                                    <Badge variant="outline" className="text-[11px] font-normal py-0">
                                      {u.namaUsaha || 'Usaha UMKM'}
                                    </Badge>

                                    {/* PENANDA STATUS PENERIMA BANTUAN */}
                                    {pernahDapat ? (
                                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[11px] font-medium py-0">
                                        Pernah Terima ({tahunList.join(', ')})
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-muted-foreground text-[10px] py-0 border-border/60">
                                        Belum Pernah
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Baris 2: NIK dan Lokasi Wilayah */}
                                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="font-mono text-foreground/80 font-medium">NIK: {u.nik}</span>
                                    <span>•</span>
                                    <span>
                                      {desaNama !== '-' ? `Desa ${desaNama}, ` : ''}Kec. {kecNama}
                                    </span>
                                  </div>

                                  {/* Baris 3 (Khusus yang pernah dapat): Rincian Bantuan yang Pernah Diterima */}
                                  {pernahDapat && (
                                    <div className="text-[11px] text-amber-700 dark:text-amber-400 flex flex-wrap items-center gap-1.5 pt-0.5">
                                      <History className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                      <span>
                                        Riwayat: {riwayat.map((r) => `Thn ${r.tahun} (${r.bantuSarana || (r.bantuTunai ? `Rp ${r.bantuTunai}` : 'Bantuan')})`).join(' • ')}
                                      </span>
                                      {sudahDapatTahunIni && (
                                        <span className="text-rose-600 dark:text-rose-400 font-bold ml-1">
                                          (⚠️ Sudah terdata di {formData.tahun})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {isChosen && <Check className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {formData.selectedPelaku && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsUmkmSelectorOpen(false)}
                          className="text-xs w-full text-muted-foreground hover:text-foreground"
                        >
                          Batal Ganti Pelaku
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* KOLOM KANAN: RINCIAN BANTUAN YANG DISALURKAN */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-blue-500/15 text-blue-600 flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Rincian Bantuan</h3>
                    </div>
                  </div>

                  {/* Tahun Penerima */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tahun Penerima / Anggaran *</Label>
                    <Select
                      value={String(formData.tahun)}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, tahun: Number(val) }))}
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Pilih Tahun Anggaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2026">Tahun 2026</SelectItem>
                        <SelectItem value="2025">Tahun 2025</SelectItem>
                        <SelectItem value="2024">Tahun 2024</SelectItem>
                        <SelectItem value="2023">Tahun 2023</SelectItem>
                        <SelectItem value="2022">Tahun 2022</SelectItem>
                        <SelectItem value="2021">Tahun 2021</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pilihan Jenis Bantuan */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Jenis Bantuan yang Diterima *</Label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <Button
                        type="button"
                        variant={formData.jenisBantuan === 'sarana' ? 'default' : 'outline'}
                        onClick={() => setFormData((prev) => ({ ...prev, jenisBantuan: 'sarana' }))}
                        className={`text-xs h-10 font-semibold ${
                          formData.jenisBantuan === 'sarana' ? 'bg-blue-600 hover:bg-blue-500 text-white' : ''
                        }`}
                      >
                        <Package className="w-4 h-4 mr-1.5 shrink-0" />
                        Sarana
                      </Button>
                      <Button
                        type="button"
                        variant={formData.jenisBantuan === 'tunai' ? 'default' : 'outline'}
                        onClick={() => setFormData((prev) => ({ ...prev, jenisBantuan: 'tunai' }))}
                        className={`text-xs h-10 font-semibold ${
                          formData.jenisBantuan === 'tunai' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''
                        }`}
                      >
                        <CreditCard className="w-4 h-4 mr-1.5 shrink-0" />
                        Tunai
                      </Button>
                      <Button
                        type="button"
                        variant={formData.jenisBantuan === 'both' ? 'default' : 'outline'}
                        onClick={() => setFormData((prev) => ({ ...prev, jenisBantuan: 'both' }))}
                        className={`text-xs h-10 font-semibold ${
                          formData.jenisBantuan === 'both' ? 'bg-purple-600 hover:bg-purple-500 text-white' : ''
                        }`}
                      >
                        <HandCoins className="w-4 h-4 mr-1.5 shrink-0" />
                        Keduanya
                      </Button>
                    </div>
                  </div>

                  {/* Field Sarana */}
                  {(formData.jenisBantuan === 'sarana' || formData.jenisBantuan === 'both') && (
                    <div className="space-y-2 p-4 rounded-xl bg-blue-500/5 border border-blue-500/25">
                      <Label className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                        Nama Sarana / Alat Bantuan *
                      </Label>
                      <Input
                        placeholder="Contoh: BOX PENDINGIN, ETALASE KACA, GEROBAK, MESIN JAHIT"
                        value={formData.bantuSarana}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bantuSarana: e.target.value.toUpperCase() }))}
                        required={formData.jenisBantuan === 'sarana'}
                        className="h-10 bg-background uppercase font-medium"
                      />
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] text-muted-foreground block">Pilihan Cepat (Rekomendasi):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['ETALASE', 'BOX PENDINGIN', 'GEROBAK DAGANG', 'MESIN JAHIT', 'TENDA USAHA', 'BLENDER & ALAT JUS', 'PERALATAN BENGKEL'].map(
                            (preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, bantuSarana: preset }))}
                                className="text-[11px] px-2.5 py-1 rounded-md border border-blue-500/30 bg-background text-foreground/80 hover:text-foreground hover:bg-blue-500/15 transition-colors"
                              >
                                + {preset}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Field Tunai */}
                  {(formData.jenisBantuan === 'tunai' || formData.jenisBantuan === 'both') && (
                    <div className="space-y-2 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25">
                      <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Nominal Bantuan Tunai (Rp) *
                      </Label>
                      <Input
                        type="text"
                        placeholder="Contoh: 2.400.000 atau 5.000.000"
                        value={formData.bantuTunai}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bantuTunai: e.target.value }))}
                        required={formData.jenisBantuan === 'tunai'}
                        className="h-10 bg-background font-mono font-medium"
                      />
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] text-muted-foreground block">Nominal Cepat:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['1.000.000', '2.000.000', '2.400.000', '5.000.000', '10.000.000'].map((nominal) => (
                            <button
                              key={nominal}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, bantuTunai: nominal }))}
                              className="text-[11px] px-2.5 py-1 rounded-md border border-emerald-500/30 bg-background text-foreground/80 hover:text-foreground hover:bg-emerald-500/15 transition-colors font-mono"
                            >
                              Rp {nominal}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Keterangan */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Keterangan Program / Peruntukan</Label>
                    <Textarea
                      rows={3}
                      placeholder="Contoh: Bantuan Stimulan Usaha Mikro APBD Dinas Koperasi & UMKM Kab. Konawe Selatan"
                      value={formData.keterangan}
                      onChange={(e) => setFormData((prev) => ({ ...prev, keterangan: e.target.value }))}
                      className="resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-4 sm:px-8 bg-muted/20 border-t border-border/40 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {isDuplicateSameYear ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Sudah menerima di tahun {formData.tahun}. Ubah tahun di sebelah kanan untuk melanjutkan.
                  </span>
                ) : formData.selectedPelaku ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Penerima: <strong className="text-foreground">{formData.selectedPelaku.namaPemilik}</strong> ({formData.selectedPelaku.namaUsaha})
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    * Harap pilih penerima dari data UMKM sebelum menyimpan
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isDuplicateSameYear || createMutation.isPending || updateMutation.isPending || !formData.pelakuId}
                  className={`w-full sm:w-auto font-semibold ${
                    isDuplicateSameYear
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : isDuplicateSameYear ? (
                    `Sudah Terima di Thn ${formData.tahun} (Pilih Tahun Berbeda)`
                  ) : formMode === 'create' ? (
                    'Simpan Penerima Bantuan'
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DIALOG DETAIL PENERIMA BANTUAN */}
      {/* ============================================================== */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="w-[96vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              Detail Penerima Bantuan UMKM
            </DialogTitle>
            <DialogDescription>
              Rincian lengkap penerima serta stimulan bantuan yang disalurkan
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 text-sm pt-2">
              {/* Header Box */}
              <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 flex items-start justify-between">
                <div>
                  <div className="font-bold text-base text-foreground">{selectedItem.namaPemilik}</div>
                  <div className="text-xs text-muted-foreground">{selectedItem.namaUsaha || 'Usaha UMKM'}</div>
                </div>
                <Badge className="font-mono text-xs bg-emerald-600 text-white">Tahun {selectedItem.tahun}</Badge>
              </div>

              {/* Data Pelaku UMKM */}
              <div className="space-y-2 border rounded-lg p-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Data Pelaku & Usaha
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Nomor Induk Kependudukan (NIK)</span>
                    <span className="font-mono font-medium text-foreground">{selectedItem.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Kartu Keluarga (KK)</span>
                    <span className="font-mono font-medium text-foreground">{selectedItem.kk || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Nomor HP / WhatsApp</span>
                    <span className="font-medium text-foreground">{selectedItem.nohp || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Bidang / Jenis Usaha</span>
                    <span className="font-medium text-foreground">{selectedItem.jenisUsaha || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">Wilayah / Alamat</span>
                    <span className="font-medium text-foreground">
                      {selectedItem.desa ? `Desa ${selectedItem.desa}, ` : ''}Kec. {selectedItem.kecamatan || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Bantuan yang Diterima */}
              <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Bantuan yang Diterima
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Bantuan Sarana / Barang</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {selectedItem.bantuSarana || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Bantuan Tunai</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatRupiah(selectedItem.bantuTunai)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">Keterangan Program</span>
                    <span className="text-foreground">{selectedItem.keterangan || '-'}</span>
                  </div>
                  {selectedItem.createAt && (
                    <div className="col-span-2 pt-1 border-t border-border/30 text-[11px] text-muted-foreground">
                      Tercatat pada: {new Date(selectedItem.createAt).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDetailDialogOpen(false);
                if (selectedItem) handleOpenEdit(selectedItem);
              }}
              className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Ubah Data Ini
            </Button>
            <Button size="sm" onClick={() => setIsDetailDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* ALERT DIALOG HAPUS DATA */}
      {/* ============================================================== */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Hapus Catatan Bantuan UMKM
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data penyaluran bantuan untuk{' '}
              <strong className="text-foreground">{selectedItem?.namaPemilik}</strong> ({selectedItem?.namaUsaha})?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
