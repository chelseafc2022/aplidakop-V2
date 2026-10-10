'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRoundSearch,
  UsersRound,
} from 'lucide-react';
import api from '@/lib/api';
import { isAdministratorRole } from '@/lib/auth-role';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type DuplicateRecord = {
  sourceSheet: string;
  sourceRow: number;
  sourceSequence: string;
  nikRaw: string;
  namaPemilik: string;
  jenisUsaha: string;
  kecamatan: string;
  desa: string;
  modalUsaha: number;
  reviewStatus: string;
  createdAt: string;
};

type DuplicateGroup = {
  batchId: string;
  nik: string;
  duplicateCount: number;
  reviewStatuses: string[];
  records: DuplicateRecord[];
};

type DuplicateResponse = {
  data: DuplicateGroup[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: { totalRows: number; totalGroups: number; pendingRows: number; totalBatches: number };
  batches: Array<{
    id: string;
    sourceFilename: string;
    tahunPendataan: number;
    status: string;
    duplicateRows: number;
    appliedAt: string | null;
  }>;
};

type ResolutionForm = {
  namaPemilik: string;
  namaUsaha: string;
  jenisUsahaId: string;
  kecamatanId: string;
  desaId: string;
  modalUsaha: string;
};

const emptyResolutionForm: ResolutionForm = {
  namaPemilik: '',
  namaUsaha: '',
  jenisUsahaId: '',
  kecamatanId: '',
  desaId: '',
  modalUsaha: '',
};

const normalizeLabel = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const cleanDistrictLabel = (value: string) => normalizeLabel(value)
  .replace(/^KEC\.?\s+/, '')
  .replace(/^PAL SEL$/, 'PALANGGA SELATAN')
  .replace(/^PALNGGA SELATAN$/, 'PALANGGA SELATAN');

const cleanVillageLabel = (value: string) => normalizeLabel(value)
  .replace(/^(DESA|KELURAHAN|KEL|DS)\s+/, '')
  .replace(/\s+(DUSUN|RT|RW)\b.*$/, '')
  .trim();

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const statusLabel: Record<string, string> = {
  PENDING_REVIEW: 'Menunggu pemeriksaan',
  VERIFIED: 'Terverifikasi',
  REJECTED: 'Ditolak',
};

export default function NikKembarPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAdministrator = isAdministratorRole(user?.role?.nama);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [batchId, setBatchId] = useState('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<{
    group: DuplicateGroup;
    record: DuplicateRecord;
  } | null>(null);
  const [resolutionForm, setResolutionForm] = useState<ResolutionForm>(emptyResolutionForm);
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status, batchId]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<DuplicateResponse>({
    queryKey: ['nik-kembar-umkm', page, deferredSearch, status, batchId],
    queryFn: async () => {
      const response = await api.get('/management/nik-kembar', {
        params: {
          page,
          limit: 15,
          search: deferredSearch || undefined,
          status: status !== 'ALL' ? status : undefined,
          batchId: batchId !== 'ALL' ? batchId : undefined,
        },
      });
      return response.data;
    },
    enabled: isAdministrator,
    placeholderData: (previousData) => previousData,
  });

  const { data: kecamatanList = [] } = useQuery<Array<{ id: string; nama: string }>>({
    queryKey: ['kecamatan-list'],
    queryFn: async () => (await api.get('/wilayah/kecamatan')).data,
    enabled: isAdministrator,
    staleTime: 10 * 60 * 1000,
  });

  const { data: jenisUsahaList = [] } = useQuery<Array<{ id: string; uraian: string }>>({
    queryKey: ['jenis-usaha-list'],
    queryFn: async () => (await api.get('/master-jenis/usaha')).data,
    enabled: isAdministrator,
    staleTime: 10 * 60 * 1000,
  });

  const { data: desaList = [], isFetching: isDesaFetching } = useQuery<Array<{ id: string; nama: string }>>({
    queryKey: ['desa-list', resolutionForm.kecamatanId],
    queryFn: async () => (await api.get(`/wilayah/desa/${resolutionForm.kecamatanId}`)).data,
    enabled: Boolean(isAdministrator && selectedCandidate && resolutionForm.kecamatanId),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!selectedCandidate || resolutionForm.desaId || !desaList.length) return;
    const sourceDesa = cleanVillageLabel(selectedCandidate.record.desa);
    const matchedDesa = desaList.find((item) => cleanVillageLabel(item.nama) === sourceDesa);
    if (matchedDesa) {
      setResolutionForm((current) => ({ ...current, desaId: matchedDesa.id }));
    }
  }, [desaList, resolutionForm.desaId, selectedCandidate]);

  const openResolutionEditor = (group: DuplicateGroup, record: DuplicateRecord) => {
    const sourceKecamatan = cleanDistrictLabel(record.kecamatan);
    const kecamatan = kecamatanList.find((item) => cleanDistrictLabel(item.nama) === sourceKecamatan);
    const sourceJenis = normalizeLabel(record.jenisUsaha);
    const jenisUsaha = jenisUsahaList.find((item) => normalizeLabel(item.uraian) === sourceJenis);

    setResolutionForm({
      namaPemilik: record.namaPemilik || '',
      namaUsaha: record.jenisUsaha || '',
      jenisUsahaId: jenisUsaha?.id || '',
      kecamatanId: kecamatan?.id || '',
      desaId: '',
      modalUsaha: String(record.modalUsaha || 0),
    });
    setSelectedCandidate({ group, record });
  };

  const resolveMutation = useMutation({
    mutationFn: async ({
      group,
      record,
      form,
    }: {
      group: DuplicateGroup;
      record: DuplicateRecord;
      form: ResolutionForm;
    }) => {
      const response = await api.post('/management/nik-kembar', {
        batchId: group.batchId,
        nik: group.nik,
        sourceSheet: record.sourceSheet,
        sourceRow: record.sourceRow,
        ...form,
        modalUsaha: Number(form.modalUsaha || 0),
      });
      return response.data as { message: string; remainingGroups: number };
    },
    onSuccess: async (result) => {
      toast.success(result.message || 'Data resmi berhasil dipilih.');
      setSelectedCandidate(null);
      setResolutionForm(emptyResolutionForm);
      const lastPage = Math.max(1, Math.ceil(Number(result.remainingGroups || 0) / 15));
      setPage((current) => Math.min(current, lastPage));
      await queryClient.invalidateQueries({ queryKey: ['nik-kembar-umkm'] });
      await queryClient.invalidateQueries({ queryKey: ['pelaku-umkm'] });
    },
    onError: (mutationError: any) => {
      toast.error(mutationError?.response?.data?.message || 'Data pilihan gagal diproses.');
    },
  });

  if (!isAdministrator) {
    return (
      <div className="px-4 lg:px-8">
        <Card className="mx-auto max-w-xl border-destructive/30">
          <CardHeader className="text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
            <CardTitle>Akses khusus administrator</CardTitle>
            <CardDescription>
              Akun Anda tidak memiliki hak untuk melihat data NIK kembar UMKM.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const summary = data?.summary;
  const pagination = data?.pagination;
  const selectedBatchYear = selectedCandidate
    ? data?.batches.find((batch) => batch.id === selectedCandidate.group.batchId)?.tahunPendataan
    : undefined;
  const isResolutionFormValid = Boolean(
    resolutionForm.namaPemilik.trim()
    && resolutionForm.jenisUsahaId
    && resolutionForm.kecamatanId
    && resolutionForm.desaId
    && resolutionForm.modalUsaha !== ''
    && Number.isFinite(Number(resolutionForm.modalUsaha))
    && Number(resolutionForm.modalUsaha) >= 0
  );

  return (
    <div className="space-y-6 px-4 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserRoundSearch className="h-7 w-7 text-amber-600" />
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">NIK Kembar UMKM</h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Ruang karantina khusus administrator. Data di halaman ini belum dimasukkan ke master pelaku UMKM sampai identitasnya diperiksa.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Muat ulang
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Kelompok NIK" value={summary?.totalGroups} icon={UsersRound} />
        <SummaryCard title="Total baris" value={summary?.totalRows} icon={Database} />
        <SummaryCard title="Menunggu pemeriksaan" value={summary?.pendingRows} icon={AlertTriangle} />
        <SummaryCard title="Batch sumber" value={summary?.totalBatches} icon={FileSpreadsheet} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pencarian dan filter</CardTitle>
          <CardDescription>Cari berdasarkan NIK, nama, sheet, jenis usaha, kecamatan, atau desa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_280px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari data NIK kembar..."
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Semua status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua status</SelectItem>
              <SelectItem value="PENDING_REVIEW">Menunggu pemeriksaan</SelectItem>
              <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
              <SelectItem value="REJECTED">Ditolak</SelectItem>
            </SelectContent>
          </Select>
          <Select value={batchId} onValueChange={setBatchId}>
            <SelectTrigger><SelectValue placeholder="Semua batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua batch sumber</SelectItem>
              {(data?.batches || []).map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.tahunPendataan} · {batch.sourceFilename}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat data karantina...
        </div>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="py-8 text-center text-sm text-destructive">
            Data NIK kembar gagal dimuat. Pastikan backend aktif dan akun masih memiliki role administrator.
          </CardContent>
        </Card>
      ) : data?.data.length ? (
        <div className="space-y-4">
          {data.data.map((group) => (
            <Card key={`${group.batchId}-${group.nik}`} className="overflow-hidden">
              <CardHeader className="bg-muted/30 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="font-mono text-base sm:text-lg">NIK {group.nik}</CardTitle>
                    <CardDescription>
                      {group.duplicateCount} baris ditemukan · Batch {group.batchId}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.reviewStatuses.map((item) => (
                      <Badge key={item} variant={item === 'PENDING_REVIEW' ? 'secondary' : 'outline'}>
                        {statusLabel[item] || item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sumber</TableHead>
                        <TableHead>Nama pemilik</TableHead>
                        <TableHead>Isian usaha dari sumber</TableHead>
                        <TableHead>Wilayah</TableHead>
                        <TableHead className="text-right">Modal usaha</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.records.map((record) => (
                        <TableRow key={`${record.sourceSheet}-${record.sourceRow}`}>
                          <TableCell className="min-w-48">
                            <div className="font-medium">{record.sourceSheet}</div>
                            <div className="text-xs text-muted-foreground">Baris {record.sourceRow} · No. {record.sourceSequence}</div>
                          </TableCell>
                          <TableCell className="min-w-48 font-medium">{record.namaPemilik || '-'}</TableCell>
                          <TableCell className="min-w-44">{record.jenisUsaha || '-'}</TableCell>
                          <TableCell className="min-w-48">
                            <div>{record.desa || '-'}</div>
                            <div className="text-xs text-muted-foreground">Kec. {record.kecamatan || '-'}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">{rupiah.format(record.modalUsaha || 0)}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                              disabled={resolveMutation.isPending || !kecamatanList.length || !jenisUsahaList.length}
                              onClick={() => openResolutionEditor(group, record)}
                            >
                              <CheckCircle2 className="mr-1.5 h-4 w-4" />
                              Pilih data ini
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Tidak ada kelompok NIK kembar yang sesuai dengan filter.
          </CardContent>
        </Card>
      )}

      {pagination && (
        <div className="flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">
            {pagination.total} kelompok · Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || isFetching}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((value) => value + 1)} disabled={page >= pagination.totalPages || isFetching}>
              Berikutnya <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={Boolean(selectedCandidate)}
        onOpenChange={(open) => {
          if (!open && !resolveMutation.isPending) {
            setSelectedCandidate(null);
            setResolutionForm(emptyResolutionForm);
          }
        }}
      >
        <AlertDialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Periksa dan edit data resmi</AlertDialogTitle>
            <AlertDialogDescription>
              Edit data pilihan untuk NIK {selectedCandidate?.group.nik}. Data baru disimpan setelah Anda menekan Tetapkan data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-sm sm:col-span-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Isian dari file sumber</div>
              <div className="mt-1 font-medium">{selectedCandidate?.record.jenisUsaha || '-'}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Isian ini menjadi calon nama usaha, bukan kategori baru. Jenis usaha tetap wajib dipilih dari master.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="resolution-nama-pemilik">Nama pemilik *</Label>
              <Input
                id="resolution-nama-pemilik"
                value={resolutionForm.namaPemilik}
                maxLength={255}
                onChange={(event) => setResolutionForm((current) => ({ ...current, namaPemilik: event.target.value }))}
                placeholder="Nama pemilik resmi"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="resolution-nama-usaha">Nama usaha</Label>
              <Input
                id="resolution-nama-usaha"
                value={resolutionForm.namaUsaha}
                maxLength={255}
                onChange={(event) => setResolutionForm((current) => ({ ...current, namaUsaha: event.target.value }))}
                placeholder="Nama usaha"
              />
              <p className="text-xs text-muted-foreground">
                Jika dikosongkan, nama usaha otomatis memakai nama kategori usaha yang dipilih.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Jenis usaha (master) *</Label>
              <Select
                value={resolutionForm.jenisUsahaId}
                onValueChange={(value) => {
                  const selectedType = jenisUsahaList.find((item) => item.id === value);
                  setResolutionForm((current) => ({
                    ...current,
                    jenisUsahaId: value,
                    namaUsaha: current.namaUsaha.trim() || selectedType?.uraian || '',
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Pilih kategori usaha" /></SelectTrigger>
                <SelectContent>
                  {jenisUsahaList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.uraian}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kecamatan *</Label>
              <Select
                value={resolutionForm.kecamatanId}
                onValueChange={(value) => setResolutionForm((current) => ({ ...current, kecamatanId: value, desaId: '' }))}
              >
                <SelectTrigger><SelectValue placeholder="Pilih kecamatan" /></SelectTrigger>
                <SelectContent>
                  {kecamatanList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Desa/Kelurahan *</Label>
              <Select
                value={resolutionForm.desaId}
                onValueChange={(value) => setResolutionForm((current) => ({ ...current, desaId: value }))}
                disabled={!resolutionForm.kecamatanId || isDesaFetching}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isDesaFetching ? 'Memuat desa...' : 'Pilih desa/kelurahan'} />
                </SelectTrigger>
                <SelectContent>
                  {desaList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="resolution-modal-usaha">Modal usaha (Rp) *</Label>
              <Input
                id="resolution-modal-usaha"
                type="text"
                inputMode="numeric"
                value={resolutionForm.modalUsaha}
                onChange={(event) => setResolutionForm((current) => ({
                  ...current,
                  modalUsaha: event.target.value.replace(/\D/g, '').slice(0, 11),
                }))}
                placeholder="Contoh: 5000000"
              />
              <p className="text-xs text-muted-foreground">
                {resolutionForm.modalUsaha !== '' ? rupiah.format(Number(resolutionForm.modalUsaha || 0)) : 'Masukkan nilai modal usaha.'}
              </p>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground sm:col-span-2">
              Setelah ditetapkan, master Pelaku UMKM diperbarui, snapshot periode {selectedBatchYear || 'sesuai batch'} dibuat,
              dan kandidat lain dalam kelompok dipindahkan ke arsip.
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={resolveMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={!selectedCandidate || !isResolutionFormValid || resolveMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (selectedCandidate && isResolutionFormValid) {
                  resolveMutation.mutate({ ...selectedCandidate, form: resolutionForm });
                }
              }}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {resolveMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
              ) : (
                <><CheckCircle2 className="mr-2 h-4 w-4" /> Tetapkan data</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value?: number; icon: typeof Database }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value?.toLocaleString('id-ID') ?? '-'}</p>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600"><Icon className="h-5 w-5" /></div>
      </CardContent>
    </Card>
  );
}
