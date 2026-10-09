'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
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
  const user = useAuthStore((state) => state.user);
  const isAdministrator = isAdministratorRole(user?.role?.nama);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [batchId, setBatchId] = useState('ALL');
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
                        <TableHead>Jenis usaha</TableHead>
                        <TableHead>Wilayah</TableHead>
                        <TableHead className="text-right">Modal usaha</TableHead>
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
