'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Building2, CheckCircle2, ChevronLeft, ChevronRight, Database, Loader2, RefreshCw, Search, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { isAdministratorRole } from '@/lib/auth-role';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Candidate = { id: string; nama_koperasi: string; nikop: string | null; no_bh: string | null; jenis_koperasi_nama: string | null; nama_kecamatan: string | null; nama_des_kel: string | null };
type Source = Record<string, any>;
type Verification = {
  id: string; issueType: string; reason: string; status: string; koperasiId: string | null;
  source: Source; current: any | null; candidates: Candidate[]; reviewNotes?: string | null;
};
type Response = {
  data: Verification[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: { total: number; pending: number; verified: number; rejected: number };
};
type FormState = {
  namaKoperasi: string; nikop: string; noBadanHukum: string; jenisKoperasiId: string;
  statusKoperasi: string; kecamatanId: string; desaId: string; alamat: string;
  bentukKoperasi: string; polaPengelolaan: string; sektorUsaha: string; kelompokKoperasi: string;
  kabupatenKota: string; kelurahanSumber: string; desaSumber: string; kodePos: string; email: string;
  kuk: string; grade: string; statusAkunOdsMandiri: string; tahunPendataan: string; tanggalDiterima: string;
};

const blankForm: FormState = {
  namaKoperasi: '', nikop: '', noBadanHukum: '', jenisKoperasiId: '', statusKoperasi: 'Aktif',
  kecamatanId: '', desaId: '', alamat: '', bentukKoperasi: '', polaPengelolaan: '', sektorUsaha: '',
  kelompokKoperasi: '', kabupatenKota: '', kelurahanSumber: '', desaSumber: '', kodePos: '', email: '',
  kuk: '', grade: '', statusAkunOdsMandiri: '', tahunPendataan: '', tanggalDiterima: '',
};
const issueLabels: Record<string, string> = { IDENTITY_CONFLICT: 'Konflik identitas', WILAYAH_UNMAPPED: 'Wilayah belum cocok', MANUAL: 'Ditandai administrator' };
const statusLabels: Record<string, string> = { PENDING_REVIEW: 'Menunggu pemeriksaan', VERIFIED: 'Terverifikasi', REJECTED: 'Ditolak' };
const dateOnly = (value: unknown) => value ? String(value).slice(0, 10) : '';

export default function VerifikasiKoperasiPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAdministrator = isAdministratorRole(user?.role?.nama);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [issueType, setIssueType] = useState('ALL');
  const [selected, setSelected] = useState<Verification | null>(null);
  const [targetId, setTargetId] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [form, setForm] = useState<FormState>(blankForm);
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => setPage(1), [deferredSearch, status, issueType]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<Response>({
    queryKey: ['verifikasi-koperasi', page, deferredSearch, status, issueType],
    queryFn: async () => (await api.get('/management/verifikasi-koperasi', { params: { page, limit: 12, search: deferredSearch || undefined, status: status !== 'ALL' ? status : undefined, issueType: issueType !== 'ALL' ? issueType : undefined } })).data,
    enabled: isAdministrator,
    placeholderData: (previous) => previous,
  });
  const { data: types = [] } = useQuery<Array<{ id: string; uraian: string }>>({ queryKey: ['jenis-koperasi-list'], queryFn: async () => (await api.get('/master-jenis/koperasi')).data, enabled: isAdministrator, staleTime: 10 * 60 * 1000 });
  const { data: districts = [] } = useQuery<Array<{ id: string; nama: string }>>({ queryKey: ['kecamatan-list'], queryFn: async () => (await api.get('/wilayah/kecamatan')).data, enabled: isAdministrator, staleTime: 10 * 60 * 1000 });
  const { data: villages = [], isFetching: villagesLoading } = useQuery<Array<{ id: string; nama: string }>>({ queryKey: ['desa-list-verifikasi-koperasi', form.kecamatanId], queryFn: async () => (await api.get(`/wilayah/desa/${form.kecamatanId}`)).data, enabled: Boolean(selected && form.kecamatanId), staleTime: 10 * 60 * 1000 });

  const openEditor = (item: Verification) => {
    const source = item.source || {};
    const current = item.current || {};
    setForm({
      namaKoperasi: source.namaKoperasi || current.namaKoperasi || '', nikop: source.nikop || current.nikop || '',
      noBadanHukum: source.noBadanHukum || current.noBadanHukum || '', jenisKoperasiId: source.jenisKoperasiId || current.jenisKoperasiId || '',
      statusKoperasi: source.statusKoperasi || 'Aktif', kecamatanId: source.kecamatanId || current.kecamatanId || '',
      desaId: source.desaId || current.desaId || '', alamat: source.alamat || current.alamat || '',
      bentukKoperasi: source.bentukKoperasi || '', polaPengelolaan: source.polaPengelolaan || '', sektorUsaha: source.sektorUsaha || '',
      kelompokKoperasi: source.kelompokKoperasi || '', kabupatenKota: source.kabupatenKota || '', kelurahanSumber: source.kelurahanSumber || '',
      desaSumber: source.desaSumber || '', kodePos: source.kodePos || '', email: source.email || '', kuk: source.kuk?.toString() || '',
      grade: source.grade || '', statusAkunOdsMandiri: source.statusAkunOdsMandiri || '', tahunPendataan: source.tahunPendataan?.toString() || '',
      tanggalDiterima: dateOnly(source.tanggalDiterima),
    });
    setTargetId(item.current?.id || ''); setReviewNotes(''); setSelected(item);
  };

  const resolveMutation = useMutation({
    mutationFn: async (action: 'UPDATE_EXISTING' | 'CREATE_NEW' | 'REJECT') => (await api.post('/management/verifikasi-koperasi', {
      id: selected?.id, action, targetKoperasiId: action === 'UPDATE_EXISTING' ? targetId : undefined, form, reviewNotes,
    })).data,
    onSuccess: async (result) => {
      toast.success(result.message || 'Verifikasi koperasi selesai.'); setSelected(null); setForm(blankForm); setTargetId(''); setReviewNotes('');
      await queryClient.invalidateQueries({ queryKey: ['verifikasi-koperasi'] });
      await queryClient.invalidateQueries({ queryKey: ['koperasi'] });
      await queryClient.invalidateQueries({ queryKey: ['jenis-koperasi-list'] });
    },
    onError: (mutationError: any) => toast.error(mutationError.response?.data?.message || 'Verifikasi gagal diproses.'),
  });

  if (!isAdministrator) return <div className="px-4 lg:px-8"><Card className="mx-auto max-w-xl border-destructive/30"><CardHeader className="text-center"><ShieldAlert className="mx-auto h-10 w-10 text-destructive" /><CardTitle>Akses khusus administrator</CardTitle><CardDescription>Akun Anda tidak memiliki hak untuk memverifikasi data koperasi.</CardDescription></CardHeader></Card></div>;
  const valid = Boolean(
    form.namaKoperasi.trim()
      && form.jenisKoperasiId
      && form.kecamatanId
      && targetId
      && (selected?.issueType !== 'WILAYAH_UNMAPPED' || form.desaId),
  );

  return <div className="space-y-6 px-4 lg:px-8">
    <div className="flex flex-col gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-teal-600" /><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Verifikasi Data Koperasi</h1></div><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Periksa data yang berkonflik, wilayah yang belum cocok, atau koperasi yang ditandai keliru sebelum perubahan ditetapkan ke master.</p></div><Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />Muat ulang</Button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary title="Total antrean" value={data?.summary.total} icon={Database} /><Summary title="Menunggu" value={data?.summary.pending} icon={AlertTriangle} /><Summary title="Terverifikasi" value={data?.summary.verified} icon={CheckCircle2} /><Summary title="Ditolak" value={data?.summary.rejected} icon={XCircle} /></div>
    <Card><CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1fr)_220px_220px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, NIKOP, badan hukum..." className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua status</SelectItem><SelectItem value="PENDING_REVIEW">Menunggu pemeriksaan</SelectItem><SelectItem value="VERIFIED">Terverifikasi</SelectItem><SelectItem value="REJECTED">Ditolak</SelectItem></SelectContent></Select><Select value={issueType} onValueChange={setIssueType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua masalah</SelectItem><SelectItem value="IDENTITY_CONFLICT">Konflik identitas</SelectItem><SelectItem value="WILAYAH_UNMAPPED">Wilayah belum cocok</SelectItem><SelectItem value="MANUAL">Ditandai administrator</SelectItem></SelectContent></Select></CardContent></Card>
    {isLoading ? <div className="flex min-h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Memuat antrean...</div> : error ? <Card className="border-destructive/30"><CardContent className="py-10 text-center text-destructive">Antrean verifikasi gagal dimuat.</CardContent></Card> : data?.data.length ? <div className="grid gap-4 xl:grid-cols-2">{data.data.map((item) => <Card key={item.id} className="overflow-hidden"><CardHeader className="bg-muted/30 pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{item.source.namaKoperasi || item.current?.namaKoperasi || 'Koperasi tanpa nama'}</CardTitle><CardDescription className="mt-1">{item.reason}</CardDescription></div><Badge variant={item.status === 'PENDING_REVIEW' ? 'secondary' : 'outline'}>{statusLabels[item.status] || item.status}</Badge></div></CardHeader><CardContent className="space-y-4 p-4"><div className="grid gap-3 text-sm sm:grid-cols-2"><Info title="Data sumber" lines={[`NIKOP: ${item.source.nikop || '—'}`, `BH: ${item.source.noBadanHukum || '—'}`, `Wilayah: ${item.source.desaSumber || item.source.kelurahanSumber || '—'} / ${item.source.kecamatanRaw || '—'}`]} /><Info title="Data master saat ini" lines={item.current ? [`${item.current.namaKoperasi}`, `NIKOP: ${item.current.nikop || '—'}`, `${item.current.desaNama || '—'} / ${item.current.kecamatanNama || '—'}`] : ['Belum ditetapkan ke master']} /></div><div className="flex items-center justify-between"><Badge variant="outline">{issueLabels[item.issueType] || item.issueType}</Badge>{item.status === 'PENDING_REVIEW' && <Button size="sm" onClick={() => openEditor(item)}><ShieldCheck className="mr-1.5 h-4 w-4" />Periksa & tetapkan</Button>}</div></CardContent></Card>)}</div> : <Card><CardContent className="py-12 text-center text-muted-foreground">Tidak ada data sesuai filter.</CardContent></Card>}
    {data?.pagination && <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground"><span>{data.pagination.total} data · Halaman {data.pagination.page} dari {data.pagination.totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" />Sebelumnya</Button><Button size="sm" variant="outline" disabled={page >= data.pagination.totalPages || isFetching} onClick={() => setPage((value) => value + 1)}>Berikutnya<ChevronRight className="h-4 w-4" /></Button></div></div>}

    <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && !resolveMutation.isPending && setSelected(null)}>
      <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-5xl md:max-w-6xl lg:max-w-7xl xl:max-w-[1360px] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                Periksa & Edit Data Verifikasi Koperasi
              </DialogTitle>
              <DialogDescription className="mt-1">
                Bandingkan kandidat dan data sumber ODS, perbaiki nilai final, lalu tetapkan ke basis data master atau tolak pengajuan ini.
              </DialogDescription>
            </div>
            {selected && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
                  {issueLabels[selected.issueType] || selected.issueType}
                </Badge>
                <Badge variant={selected.status === 'PENDING_REVIEW' ? 'secondary' : 'outline'}>
                  {statusLabels[selected.status] || selected.status}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Panel Komparasi Sumber vs Master */}
          {selected && (
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Alasan Penandaan / Catatan Antrean:</span>
                <span className="font-normal text-muted-foreground">{selected.reason}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 text-xs">
                <div className="rounded-lg border bg-background p-3.5 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      📦 Data Sumber (ODS / Berkas Masuk)
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-5">Sumber</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <span className="text-muted-foreground">Nama:</span>
                    <span className="col-span-2 font-medium">{selected.source.namaKoperasi || '—'}</span>
                    <span className="text-muted-foreground">NIKOP:</span>
                    <span className="col-span-2 font-mono">{selected.source.nikop || '—'}</span>
                    <span className="text-muted-foreground">Badan Hukum:</span>
                    <span className="col-span-2 font-mono">{selected.source.noBadanHukum || '—'}</span>
                    <span className="text-muted-foreground">Wilayah Sumber:</span>
                    <span className="col-span-2">{selected.source.desaSumber || selected.source.kelurahanSumber || '—'} / {selected.source.kecamatanRaw || '—'}</span>
                    <span className="text-muted-foreground">Sektor Usaha:</span>
                    <span className="col-span-2">{selected.source.sektorUsaha || '—'}</span>
                  </div>
                </div>

                <div className="rounded-lg border bg-background p-3.5 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      🏛️ Data Master Saat Ini
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-5">Master</Badge>
                  </div>
                  {selected.current ? (
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <span className="text-muted-foreground">Nama Master:</span>
                      <span className="col-span-2 font-medium">{selected.current.namaKoperasi}</span>
                      <span className="text-muted-foreground">NIKOP:</span>
                      <span className="col-span-2 font-mono">{selected.current.nikop || '—'}</span>
                      <span className="text-muted-foreground">Badan Hukum:</span>
                      <span className="col-span-2 font-mono">{selected.current.noBadanHukum || selected.current.no_bh || '—'}</span>
                      <span className="text-muted-foreground">Wilayah Master:</span>
                      <span className="col-span-2">{selected.current.desaNama || '—'} / {selected.current.kecamatanNama || '—'}</span>
                      <span className="text-muted-foreground">Status Master:</span>
                      <span className="col-span-2">{selected.current.statusKoperasi || 'Aktif'}</span>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground italic">
                      Belum terhubung ke data master (entitas baru / wilayah unmapped)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pemilihan Tujuan Penyelesaian */}
          <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
            <Label className="text-sm font-semibold">Tujuan Penetapan Master *</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Pilih data tujuan atau buat baru" />
              </SelectTrigger>
              <SelectContent>
                {selected?.current && (
                  <SelectItem value={selected.current.id}>
                    Perbarui Master Eksisting: {selected.current.namaKoperasi} (ID: {selected.current.id})
                  </SelectItem>
                )}
                {selected?.candidates.filter((candidate) => candidate.id !== selected.current?.id).map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    Kandidat Terkait: {candidate.nama_koperasi} · {candidate.no_bh || 'tanpa BH'} {candidate.nama_kecamatan ? `(${candidate.nama_kecamatan})` : ''}
                  </SelectItem>
                ))}
                <SelectItem value="NEW" className="font-semibold text-emerald-600 dark:text-emerald-400">
                  + Buat / Daftarkan Sebagai Koperasi Baru di Basis Data Master
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Form Bagian 1: Identitas dan Wilayah */}
          <section className="rounded-xl border p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Identitas Badan Hukum & Wilayah Koperasi
              </h3>
              <span className="text-[11px] text-muted-foreground">Wajib terisi sebelum penetapan</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <Field label="Nama koperasi *" value={form.namaKoperasi} onChange={(value) => setForm({ ...form, namaKoperasi: value })} />
              </div>
              <Field label="NIKOP" value={form.nikop} onChange={(value) => setForm({ ...form, nikop: value })} />
              <Field label="Nomor badan hukum" value={form.noBadanHukum} onChange={(value) => setForm({ ...form, noBadanHukum: value })} />
              <SelectField label="Jenis koperasi *" value={form.jenisKoperasiId} onChange={(value) => setForm({ ...form, jenisKoperasiId: value })} options={types.map((item) => ({ value: item.id, label: item.uraian }))} />
              <SelectField label="Status koperasi" value={form.statusKoperasi} onChange={(value) => setForm({ ...form, statusKoperasi: value })} options={[{ value: 'Aktif', label: 'Aktif' }, { value: 'Tidak Aktif', label: 'Tidak Aktif' }]} />
              <SelectField label="Kecamatan *" value={form.kecamatanId} onChange={(value) => setForm({ ...form, kecamatanId: value, desaId: '' })} options={districts.map((item) => ({ value: item.id, label: item.nama }))} />
              <SelectField label="Desa/Kelurahan" value={form.desaId} onChange={(value) => setForm({ ...form, desaId: value })} options={villages.map((item) => ({ value: item.id, label: item.nama }))} disabled={!form.kecamatanId || villagesLoading} />
              <div className="sm:col-span-2 lg:col-span-4">
                <Field label="Alamat lengkap" value={form.alamat} onChange={(value) => setForm({ ...form, alamat: value })} />
              </div>
            </div>
          </section>

          {/* Form Bagian 2: Profil ODS dan Periode */}
          <section className="rounded-xl border p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Profil ODS, Tata Kelola & Periode Pendataan
              </h3>
              <span className="text-[11px] text-muted-foreground">Data atribut pendukung</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {([
                ['bentukKoperasi', 'Bentuk koperasi'],
                ['polaPengelolaan', 'Pola pengelolaan'],
                ['sektorUsaha', 'Sektor usaha'],
                ['kelompokKoperasi', 'Kelompok koperasi'],
                ['kabupatenKota', 'Kabupaten/Kota'],
                ['kelurahanSumber', 'Kelurahan sumber'],
                ['desaSumber', 'Desa sumber'],
                ['kodePos', 'Kode pos'],
                ['email', 'Email'],
                ['kuk', 'KUK'],
                ['grade', 'Grade'],
                ['statusAkunOdsMandiri', 'Status akun ODS'],
                ['tahunPendataan', 'Tahun pendataan'],
                ['tanggalDiterima', 'Tanggal diterima'],
              ] as Array<[keyof FormState, string]>).map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={form[key]}
                  type={key === 'tanggalDiterima' ? 'date' : 'text'}
                  onChange={(value) => setForm({ ...form, [key]: value })}
                />
              ))}
            </div>
          </section>

          {/* Catatan Verifikasi */}
          <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
            <Label htmlFor="review-notes" className="text-sm font-semibold">Catatan Verifikasi & Justifikasi Administrator</Label>
            <Input
              id="review-notes"
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              placeholder="Contoh: Nama dan nomor badan hukum disesuaikan dengan sertifikat legalitas ODS terbaru"
              className="bg-background"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between border-t pt-4 mt-2">
          <Button
            variant="destructive"
            disabled={resolveMutation.isPending}
            onClick={() => resolveMutation.mutate('REJECT')}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Tolak Data
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={resolveMutation.isPending}
              onClick={() => setSelected(null)}
            >
              Batal
            </Button>
            <Button
              disabled={!valid || resolveMutation.isPending}
              onClick={() => resolveMutation.mutate(targetId === 'NEW' ? 'CREATE_NEW' : 'UPDATE_EXISTING')}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              {resolveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Tetapkan Data ke Master
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function Summary({ title, value, icon: Icon }: { title: string; value?: number; icon: typeof Database }) { return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold">{value?.toLocaleString('id-ID') ?? '—'}</p></div><div className="rounded-xl bg-teal-500/10 p-3 text-teal-600"><Icon className="h-5 w-5" /></div></CardContent></Card>; }
function Info({ title, lines }: { title: string; lines: string[] }) { return <div className="rounded-lg border bg-background p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>{lines.map((line, index) => <p key={index} className={index === 0 ? 'font-medium' : 'text-xs text-muted-foreground'}>{line}</p>)}</div>; }
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div className="space-y-1.5"><Label>{label}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function SelectField({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; disabled?: boolean }) { return <div className="space-y-1.5"><Label>{label}</Label><Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>; }
