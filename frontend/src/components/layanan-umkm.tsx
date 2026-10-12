'use client';

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  RefreshCw,
  Search,
  Store,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { isAdministratorRole } from '@/lib/auth-role';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Row = {
  id: string;
  nama_pemilik: string;
  nama_usaha: string;
  nik: string;
  tahun: number;
  status: string;
  created_at: string;
  catatan?: string;
  reviewed_by?: string;
  reviewed_at?: string;
};

type Detail = Row & {
  payload: Record<string, string | number | boolean>;
  pelaku: Record<string, string | number> | null;
  dokumen: string[];
  riwayat: { tahun: number; bantu_tunai: string; bantu_sarana: string; keterangan: string }[];
};

const labels: Record<string, string> = {
  MENUNGGU: 'Menunggu Verifikasi',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
  proposal: 'Proposal Permohonan',
  ktp: 'Kartu Tanda Penduduk (KTP)',
  kk: 'Kartu Keluarga (KK)',
  sku: 'Surat Keterangan Usaha (SKU)',
};

const identityFields: Record<string, string> = {
  nama_pemilik: 'Nama Pemilik',
  nama_usaha: 'Nama Usaha',
  nik: 'Nomor Induk Kependudukan (NIK)',
  kk: 'Nomor Kartu Keluarga (KK)',
  nohp: 'Nomor Telepon / WhatsApp',
  nama_kecamatan: 'Kecamatan',
  nama_des_kel: 'Desa / Kelurahan',
  jenis_usaha: 'Sektor / Bidang Usaha',
  tahun_berdiri: 'Tahun Berdiri Usaha',
  modal_sendiri: 'Modal Sendiri',
  modal_luar: 'Modal Luar (Pinjaman/Investor)',
  nib: 'Nomor Induk Berusaha (NIB)',
  keterangan: 'Keterangan Tambahan',
};

const formatValue = (key: string, val: unknown) => {
  if (val === undefined || val === null || val === '') return '-';
  if ((key === 'modal_sendiri' || key === 'modal_luar') && (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val))))) {
    const num = Number(val);
    return num > 0 ? `Rp ${num.toLocaleString('id-ID')}` : 'Rp 0';
  }
  return String(val);
};

const date = (value?: string) => (value ? new Date(value).toLocaleString('id-ID') : '-');
const endpoint = '/api/management/layanan-umkm';

export function LayananUmkm({ jenis }: { jenis: 'pendaftaran' | 'bantuan' }) {
  const { user, isAuthenticated } = useAuthStore();
  const allowed = isAdministratorRole(user?.role?.nama);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('DISETUJUI');
  const [isEditingDecision, setIsEditingDecision] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const response = await fetch(`${endpoint}${path}`, {
        ...options,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...options.headers },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Permintaan gagal.');
      return data;
    },
    []
  );

  const {
    data,
    isFetching: loading,
    error: loadError,
    refetch: refresh,
  } = useQuery({
    queryKey: ['layanan-umkm', jenis, status, page, query, user?.id],
    enabled: allowed && isAuthenticated,
    queryFn: () =>
      request(`?${new URLSearchParams({ jenis, status, page: String(page), search: query })}`),
  });

  const rows: Row[] = data?.data || [];
  const total: number = data?.total || 0;
  const error = loadError instanceof Error ? loadError.message : '';

  async function open(id: string) {
    if (opening) return;
    setOpening(true);
    setIsEditingDecision(false);
    try {
      const resData = await request(`/${id}`);
      setDetail(resData.data);
      setNotes(resData.data.catatan || '');
      setDecision(resData.data.status === 'DITOLAK' ? 'DITOLAK' : 'DISETUJUI');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat rincian.');
    } finally {
      setOpening(false);
    }
  }

  async function download(key: string) {
    if (!detail) return;
    try {
      const response = await fetch(`${endpoint}/${detail.id}/dokumen/${key}`, {
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('Dokumen tidak dapat diunduh.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${labels[key] || key}.${
        blob.type.includes('pdf') ? 'pdf' : blob.type.includes('png') ? 'png' : 'jpg'
      }`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengunduh dokumen.');
    }
  }

  async function verify() {
    if (!detail || busy) return;
    if (decision === 'DITOLAK' && !notes.trim()) {
      toast.error('Alasan penolakan wajib diisi agar pemohon mengetahui perbaikan yang diperlukan.');
      return;
    }
    setBusy(true);
    try {
      await request(`/${detail.id}/verifikasi`, {
        method: 'POST',
        body: JSON.stringify({ status: decision, catatan: notes }),
      });
      toast.success(
        decision === 'DISETUJUI'
          ? 'Pengajuan berhasil disetujui.'
          : decision === 'DITOLAK'
          ? 'Pengajuan ditolak dan tetap tersimpan dalam riwayat.'
          : 'Status pengajuan dikembalikan ke antrean menunggu verifikasi.'
      );
      setDetail(null);
      setIsEditingDecision(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Verifikasi gagal.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      await request(`/${id}`, { method: 'DELETE' });
      toast.success('Pengajuan berhasil dihapus permanen.');
      setDeletingId(null);
      if (detail?.id === id) setDetail(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus pengajuan.');
    } finally {
      setBusy(false);
    }
  }

  if (!allowed) {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-muted-foreground">
        Menu verifikasi ini hanya dapat diakses oleh administrator sistem.
      </div>
    );
  }

  const title = jenis === 'bantuan' ? 'Verifikasi Bantuan UMKM' : 'Verifikasi Pendaftaran UMKM';
  const subtitle =
    jenis === 'bantuan'
      ? 'Periksa permohonan bantuan, kelengkapan berkas fisik, dan riwayat bantuan pelaku usaha.'
      : 'Tinjau pendaftaran mandiri pelaku usaha baru dari portal website sebelum dimasukkan ke data master daerah.';

  const rawIdentity = (detail?.pelaku || detail?.payload || {}) as Record<string, unknown>;
  const identity: Record<string, unknown> = {
    ...rawIdentity,
    jenis_usaha:
      rawIdentity.jenis_usaha ||
      detail?.pelaku?.jenis_usaha ||
      detail?.payload?.jenis_usaha ||
      rawIdentity.jenisusaha_id ||
      '-',
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'DISETUJUI':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 size-3.5" /> Disetujui
          </Badge>
        );
      case 'DITOLAK':
        return (
          <Badge variant="destructive" className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/20 dark:text-rose-400">
            <XCircle className="mr-1 size-3.5" /> Ditolak
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400">
            <Clock className="mr-1 size-3.5" /> Menunggu
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-primary">
            <ClipboardCheck className="size-4" /> Modul Layanan & Verifikasi
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={loading}
            className="cursor-pointer gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Store className="size-5 text-primary" />
              <div>
                <CardTitle className="text-base font-semibold">Daftar Antrean Pengajuan</CardTitle>
                <CardDescription className="text-xs">
                  Total {total} pengajuan tercatat dalam sistem
                </CardDescription>
              </div>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: '', label: 'Semua Status' },
                { key: 'MENUNGGU', label: 'Menunggu' },
                { key: 'DISETUJUI', label: 'Disetujui' },
                { key: 'DITOLAK', label: 'Ditolak' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => {
                    setStatus(pill.key);
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    status === pill.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Search Form */}
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(search);
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 text-sm"
                aria-label="Cari pemilik, nama usaha, atau NIK"
                placeholder="Cari berdasarkan nama pemilik, nama usaha, atau 16 digit NIK…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="default" size="sm" className="cursor-pointer">
                <Search className="mr-1.5 size-3.5" /> Cari Data
              </Button>
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setQuery('');
                    setPage(1);
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </form>

          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3.5">Pelaku Usaha & Identitas</th>
                    <th className="p-3.5">No. Registrasi / NIK</th>
                    <th className="p-3.5">Waktu Masuk</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-muted-foreground">
                        <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-primary" />
                        Memuat data pengajuan…
                      </td>
                    </tr>
                  ) : rows.length ? (
                    rows.map((row) => (
                      <tr key={row.id} className="transition-colors hover:bg-muted/30">
                        <td className="p-3.5">
                          <div className="font-semibold text-foreground">{row.nama_usaha}</div>
                          <div className="text-xs text-muted-foreground">{row.nama_pemilik}</div>
                        </td>
                        <td className="p-3.5 font-mono text-xs text-muted-foreground">
                          <div className="font-medium text-foreground">#{row.id}</div>
                          <div>NIK: {row.nik}</div>
                        </td>
                        <td className="p-3.5 text-xs text-muted-foreground">{date(row.created_at)}</td>
                        <td className="p-3.5">{getStatusBadge(row.status)}</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={opening}
                              onClick={() => void open(row.id)}
                              className="cursor-pointer text-xs"
                            >
                              Periksa
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={busy}
                              onClick={() => setDeletingId(row.id)}
                              title="Hapus pengajuan"
                              className="size-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-muted-foreground">
                        Tidak ada berkas pengajuan yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
            <span>
              Menampilkan Halaman <strong className="text-foreground">{page}</strong> dari{' '}
              <strong className="text-foreground">{Math.max(1, Math.ceil(total / 20))}</strong> ({total} total berkas)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 20 >= total || loading}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer"
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Detail & Keputusan Verifikasi */}
      <Dialog
        open={!!detail}
        onOpenChange={(value) => {
          if (!value && !busy) setDetail(null);
        }}
      >
        <DialogContent className="flex max-h-[92vh] flex-col p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  {detail?.nama_usaha}
                </DialogTitle>
                <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span>No. Registrasi:</span>
                  <span className="rounded bg-muted px-2 py-0.5 font-mono font-semibold text-foreground">
                    #{detail?.id}
                  </span>
                  <span>·</span>
                  <span>Masuk: {date(detail?.created_at)}</span>
                  <span>·</span>
                  {detail && getStatusBadge(detail.status)}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {detail && (
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {/* Bagian 1: Data Identitas Usaha */}
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Identitas Pelaku & Tempat Usaha
                  </h2>
                  <span className="text-xs text-muted-foreground">Formulir Mandiri</span>
                </div>
                <dl className="grid gap-3 rounded-lg border bg-muted/15 p-4 sm:grid-cols-2">
                  {Object.entries(identityFields)
                    .filter(([key]) => identity[key] !== undefined && identity[key] !== null)
                    .map(([key, label]) => (
                      <div key={key} className="space-y-0.5">
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="break-words text-sm font-medium text-foreground">
                          {formatValue(key, identity[key])}
                        </dd>
                      </div>
                    ))}
                </dl>
                {detail.payload.legacy && (
                  <p className="rounded bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    Pendaftaran website arsip lama: data sudah berada di master. Keputusan verifikasi ini tidak menghapus data master pelaku usaha.
                  </p>
                )}
              </section>

              {/* Bagian 2: Riwayat Bantuan (Khusus modul bantuan) */}
              {jenis === 'bantuan' && (
                <section className="space-y-3">
                  <h2 className="border-b pb-1.5 text-sm font-semibold tracking-tight text-foreground">
                    Riwayat Bantuan Sebelumnya
                  </h2>
                  {detail.riwayat.length ? (
                    <div className="space-y-2">
                      {detail.riwayat.map((h, i) => (
                        <div key={i} className="rounded-lg border bg-muted/20 p-3 text-xs">
                          <div className="font-semibold text-foreground">Tahun Pendataan: {h.tahun}</div>
                          <div className="mt-1 text-muted-foreground">
                            Bantuan Tunai: <strong className="text-foreground">{h.bantu_tunai || '-'}</strong> · Sarana: <strong className="text-foreground">{h.bantu_sarana || '-'}</strong>
                          </div>
                          {h.keterangan && <div className="mt-1 text-muted-foreground">Catatan: {h.keterangan}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      Pelaku usaha ini belum memiliki riwayat penerimaan bantuan daerah sebelumnya.
                    </p>
                  )}
                </section>
              )}

              {/* Bagian 3: Dokumen Persyaratan */}
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Dokumen & Lampiran Persyaratan
                  </h2>
                  <span className="text-xs text-muted-foreground">{detail.dokumen.length} Berkas Tersedia</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {detail.dokumen.map((key) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => void download(key)}
                      className="cursor-pointer gap-2 border bg-background text-xs hover:border-primary"
                    >
                      <Download className="size-3.5 text-primary" />
                      <span>{labels[key] || `Lampiran Berkas ${key}`}</span>
                    </Button>
                  ))}
                  {!detail.dokumen.length && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="size-4 text-muted-foreground/60" />
                      Tidak ada dokumen atau lampiran yang diunggah pada pengajuan ini.
                    </div>
                  )}
                </div>
              </section>

              {/* Bagian 4: Form Keputusan atau Catatan Hasil Verifikasi */}
              <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
                {detail.status === 'MENUNGGU' || isEditingDecision ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-sm font-semibold tracking-tight text-foreground">
                          {isEditingDecision ? 'Perbarui Keputusan Verifikasi' : 'Keputusan Verifikasi'}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {jenis === 'bantuan'
                            ? 'Persetujuan memvalidasi dokumen pemohon. Realisasi dicatat melalui menu Pembiayaan UMKM.'
                            : 'Persetujuan akan memverifikasi berkas dan otomatis mencatat pelaku usaha baru ke database Master.'}
                        </p>
                      </div>
                      {isEditingDecision && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingDecision(false)}
                          className="h-7 text-xs text-muted-foreground"
                        >
                          Batal Ubah
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setDecision('DISETUJUI')}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                          decision === 'DISETUJUI'
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-sm dark:text-emerald-400'
                            : 'bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Setujui Berkas
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision('DITOLAK')}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                          decision === 'DITOLAK'
                            ? 'border-rose-500 bg-rose-500/10 text-rose-700 shadow-sm dark:text-rose-400'
                            : 'bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <XCircle className="size-3.5 text-rose-600" />
                        Tolak Berkas
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision('MENUNGGU')}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                          decision === 'MENUNGGU'
                            ? 'border-amber-500 bg-amber-500/10 text-amber-700 shadow-sm dark:text-amber-400'
                            : 'bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <Clock className="size-3.5 text-amber-600" />
                        Kembalikan Menunggu
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground" htmlFor="notes">
                        Catatan Verifikator {decision === 'DITOLAK' ? <span className="text-destructive">(Wajib diisi sebagai alasan penolakan)</span> : <span className="text-muted-foreground">(Opsional)</span>}
                      </label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        maxLength={1000}
                        disabled={busy}
                        rows={3}
                        placeholder={
                          decision === 'DITOLAK'
                            ? 'Contoh: Foto KTP tidak terbaca jelas dan NIB belum dilampirkan. Harap mendaftar ulang dengan dokumen lengkap.'
                            : 'Catatan hasil verifikasi berkas (opsional)'
                        }
                        className="bg-background text-sm"
                      />
                      <div className="text-right text-[11px] text-muted-foreground">
                        {notes.length}/1000 karakter
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        {detail.status === 'DISETUJUI' ? (
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        ) : (
                          <XCircle className="size-4 text-rose-600" />
                        )}
                        Status Saat Ini: {labels[detail.status]}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDecision(detail.status);
                          setNotes(detail.catatan || '');
                          setIsEditingDecision(true);
                        }}
                        className="h-8 gap-1.5 text-xs font-medium"
                      >
                        <RefreshCw className="size-3" /> Ubah Keputusan / Tinjau Ulang
                      </Button>
                    </div>
                    <div className="rounded-lg border bg-background p-3 text-foreground">
                      <strong>Catatan Petugas:</strong> {detail.catatan || 'Tidak ada catatan khusus.'}
                    </div>
                    <div className="text-muted-foreground">
                      Diverifikasi pada {date(detail.reviewed_at)} oleh verifikator ID: {detail.reviewed_by || '-'}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse justify-between gap-2 border-t bg-muted/10 px-6 py-3.5 sm:flex-row sm:items-center">
            {detail && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => setDeletingId(detail.id)}
                className="cursor-pointer text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="mr-1.5 size-3.5" /> Hapus Pengajuan Ini
              </Button>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDetail(null)}
                disabled={busy}
                className="cursor-pointer text-xs"
              >
                Tutup
              </Button>
              {(detail?.status === 'MENUNGGU' || isEditingDecision) && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void verify()}
                  disabled={busy || (decision === 'DITOLAK' && !notes.trim())}
                  className="cursor-pointer text-xs font-semibold"
                >
                  {busy ? 'Menyimpan…' : 'Simpan Keputusan'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog Hapus Pengajuan */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && !busy && setDeletingId(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50">
              <Trash2 className="size-6" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-bold">
              Hapus Pengajuan #{deletingId}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs leading-relaxed text-muted-foreground">
              Pengajuan ini beserta seluruh dokumen fisik yang terlampir akan dihapus secara permanen dari basis data dan server. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2 sm:justify-center">
            <AlertDialogCancel disabled={busy} className="cursor-pointer text-xs">
              Batal
            </AlertDialogCancel>
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => deletingId && void remove(deletingId)}
              className="cursor-pointer text-xs font-semibold"
            >
              {busy ? 'Menghapus…' : 'Hapus Permanen'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
