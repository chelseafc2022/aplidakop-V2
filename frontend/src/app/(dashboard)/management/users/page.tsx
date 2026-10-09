'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users as UsersIcon,
  Search,
  FilterX,
  RefreshCw,
  Edit3,
  UserX,
  UserPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldCheck,
  Building2,
  Layers,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { SearchableCombobox } from '@/components/searchable-combobox';
import { StatCards } from './components/stat-cards';
import { SetRoleDialog, TargetPegawai } from './components/set-role-dialog';
import { RevokeRoleDialog } from './components/revoke-role-dialog';

export default function ManagementUsersPage() {
  // Tabs: "active_users" (Pengguna Memiliki Role) vs "egov_directory" (Direktori Seluruh Akun E-Gov)
  const [activeTab, setActiveTab] = useState<string>('active_users');

  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [selectedInstansi, setSelectedInstansi] = useState<string>('');
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Pagination states
  const [pageUsers, setPageUsers] = useState<number>(1);
  const [pageDirectory, setPageDirectory] = useState<number>(1);

  // Dialog states
  const [setRoleOpen, setSetRoleOpen] = useState(false);
  const [revokeRoleOpen, setRevokeRoleOpen] = useState(false);
  const [targetPegawai, setTargetPegawai] = useState<TargetPegawai | null>(null);

  // 1. Ambil daftar Instansi (OPD Induk)
  const { data: instansiList = [] } = useQuery({
    queryKey: ['instansi-list'],
    queryFn: async () => (await api.get('/management/users/instansi')).data,
  });

  // Tentukan default Instansi: cari yang mengandung kata "koperasi" atau id pertama
  useEffect(() => {
    if (instansiList && instansiList.length > 0 && !selectedInstansi) {
      const dinkop = instansiList.find((i: any) =>
        i.nama?.toLowerCase().includes('koperasi')
      );
      if (dinkop) {
        setSelectedInstansi(String(dinkop.id));
      } else {
        setSelectedInstansi('all');
      }
    }
  }, [instansiList, selectedInstansi]);

  // 2. Ambil daftar Sub Unit Kerja berdasarkan instansi terpilih
  const { data: unitKerjaList = [], isLoading: isLoadingUnitKerja } = useQuery({
    queryKey: ['unit-kerja-list', selectedInstansi],
    queryFn: async () => {
      const res = await api.get('/management/users/unit-kerja', {
        params: { instansiId: selectedInstansi !== 'all' ? selectedInstansi : undefined },
      });
      return res.data;
    },
    enabled: !!selectedInstansi,
  });

  // 3. Ambil daftar kelompok role (dari db_dinkop.menu_klp)
  const { data: roles = [] } = useQuery({
    queryKey: ['management-roles'],
    queryFn: async () => (await api.get('/management/roles')).data,
  });

  // 4. Tab 1: Fetch Pengguna Memiliki Role APLI DAKOP (hasRole = 'true')
  const {
    data: activeUsersResponse,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: [
      'management-users-active',
      pageUsers,
      search,
      selectedInstansi,
      selectedUnitKerja,
      roleFilter,
    ],
    queryFn: async () => {
      const res = await api.get('/management/users', {
        params: {
          page: pageUsers,
          limit: 10,
          search: search || undefined,
          instansiId: selectedInstansi !== 'all' ? selectedInstansi : undefined,
          unitKerjaId: selectedUnitKerja !== 'all' ? selectedUnitKerja : undefined,
          hasRole: 'true',
        },
      });
      return res.data;
    },
  });

  // 5. Tab 2: Fetch Seluruh Direktori Akun E-Gov & SIMPEG (hasRole = 'all')
  const {
    data: directoryResponse,
    isLoading: isLoadingDirectory,
    isFetching: isFetchingDirectory,
    refetch: refetchDirectory,
  } = useQuery({
    queryKey: [
      'management-users-directory',
      pageDirectory,
      search,
      selectedInstansi,
      selectedUnitKerja,
    ],
    queryFn: async () => {
      const res = await api.get('/management/users', {
        params: {
          page: pageDirectory,
          limit: 10,
          search: search || undefined,
          instansiId: selectedInstansi !== 'all' ? selectedInstansi : undefined,
          unitKerjaId: selectedUnitKerja !== 'all' ? selectedUnitKerja : undefined,
          hasRole: 'all',
        },
      });
      return res.data;
    },
  });

  // 6. Query ringkasan statistik (Akun Tanpa Role Dinkop)
  const { data: unassignedDinkopResponse } = useQuery({
    queryKey: ['management-users-unassigned-dinkop', selectedInstansi],
    queryFn: async () => {
      const res = await api.get('/management/users', {
        params: {
          page: 1,
          limit: 1,
          instansiId: selectedInstansi !== 'all' ? selectedInstansi : undefined,
          hasRole: 'false',
        },
      });
      return res.data;
    },
    enabled: !!selectedInstansi,
  });

  const activeUsers = activeUsersResponse?.data || [];
  const totalActiveUsers = activeUsersResponse?.total || 0;
  const totalPagesUsers = activeUsersResponse?.totalPages || 1;

  const directoryUsers = directoryResponse?.data || [];
  const totalDirectory = directoryResponse?.total || 0;
  const totalPagesDirectory = directoryResponse?.totalPages || 1;

  const totalUnassignedDinkop = unassignedDinkopResponse?.total || 0;

  // Options Combobox
  const instansiOptions = useMemo(() => {
    return (instansiList || []).map((ins: any) => ({
      id: String(ins.id),
      label: ins.nama,
    }));
  }, [instansiList]);

  const unitKerjaOptions = useMemo(() => {
    return (unitKerjaList || []).map((uk: any) => ({
      id: String(uk.id),
      label: uk.nama,
    }));
  }, [unitKerjaList]);

  const handleOpenSetRole = (item: any) => {
    setTargetPegawai({
      id: item.id,
      nip: item.nip,
      nama: item.nama,
      username: item.username,
      email: item.email,
      hp: item.hp,
      unitKerjaNama: item.unitKerjaNama,
      instansiNama: item.instansiNama,
      currentRole: item.role,
      hasRole: item.hasRole,
    });
    setSetRoleOpen(true);
  };

  const handleOpenRevokeRole = (item: any) => {
    setTargetPegawai({
      id: item.id,
      nip: item.nip,
      nama: item.nama,
      username: item.username,
      currentRole: item.role,
      hasRole: item.hasRole,
    });
    setRevokeRoleOpen(true);
  };

  return (
    <div className="px-4 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Manajemen Akun & Hak Akses
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Pengelolaan pengguna dan registrasi penetapan hak akses role RBAC APLI DAKOP terintegrasi direktori server E-Gov & SIMPEG Konawe Selatan
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <StatCards
        totalPegawai={totalDirectory}
        totalDinkopUsers={totalActiveUsers}
        totalUnassignedDinkop={totalUnassignedDinkop}
        totalOpd={instansiList.length || 38}
        isLoading={isLoadingUsers && isLoadingDirectory}
      />

      {/* Main Tabs Container */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val);
          setSearch('');
        }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3">
          {/* TabsList */}
          <div className="overflow-x-auto pb-0.5 -mx-1 px-1">
            <TabsList className="bg-muted/60 p-1 flex w-max min-w-full sm:w-auto sm:min-w-0">
              <TabsTrigger value="active_users" className="gap-1.5 text-xs whitespace-nowrap">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">Pengguna Aktif APLI DAKOP</span>
                <span className="sm:hidden">Pengguna Aktif</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                  {totalActiveUsers}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="egov_directory" className="gap-1.5 text-xs whitespace-nowrap">
                <Database className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="hidden sm:inline">Direktori Akun E-Gov & SIMPEG</span>
                <span className="sm:hidden">Direktori E-Gov</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                  {totalDirectory}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === 'active_users') refetchUsers();
              else refetchDirectory();
            }}
            disabled={isFetchingUsers || isFetchingDirectory}
            className="text-xs h-8 gap-1.5 self-end sm:self-auto shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isFetchingUsers || isFetchingDirectory ? 'animate-spin' : ''
              }`}
            />
            <span className="hidden sm:inline">Segarkan Data</span>
          </Button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: PENGGUNA AKTIF APLI DAKOP                         */}
        {/* ========================================================= */}
        <TabsContent value="active_users" className="space-y-4 m-0">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Daftar Akun Pengguna APLI DAKOP
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Akun yang telah memiliki penetapan hak akses role di Dinas Koperasi dan UKM Kab. Konawe Selatan
                  </CardDescription>
                </div>

                {(selectedInstansi !== 'all' || selectedUnitKerja !== 'all' || search) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedInstansi('all');
                      setSelectedUnitKerja('all');
                      setSearch('');
                      setPageUsers(1);
                    }}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 self-start sm:self-auto"
                    title="Reset Semua Filter"
                  >
                    <FilterX className="h-3.5 w-3.5" />
                    Reset Filter
                  </Button>
                )}
              </div>

              {/* Toolbar Filter Tab 1 */}
              <div className="space-y-3 pt-1">
                {/* Baris 1: Pencarian */}
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari NIP, nama pegawai, atau username..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPageUsers(1);
                    }}
                    className="pl-8 text-xs h-9 bg-background w-full"
                  />
                </div>

                {/* Baris 2: Sejajar 2 Kolom Unit Kerja & Sub Unit Kerja */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="w-full">
                    <SearchableCombobox
                      value={selectedInstansi}
                      onValueChange={(val) => {
                        setSelectedInstansi(val);
                        setSelectedUnitKerja('all');
                        setPageUsers(1);
                      }}
                      items={instansiOptions}
                      placeholder="Pilih Unit Kerja (OPD)..."
                      searchPlaceholder="Ketik nama Unit Kerja / OPD..."
                      emptyText="Unit Kerja tidak ditemukan."
                      allLabel="-- Semua Unit Kerja (OPD) --"
                      icon={<Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                    />
                  </div>

                  <div className="w-full">
                    <SearchableCombobox
                      value={selectedUnitKerja}
                      onValueChange={(val) => {
                        setSelectedUnitKerja(val);
                        setPageUsers(1);
                      }}
                      items={unitKerjaOptions}
                      placeholder={isLoadingUnitKerja ? 'Memuat Sub Unit...' : 'Pilih Sub-Unit Kerja...'}
                      searchPlaceholder="Ketik nama Sub Unit Kerja..."
                      emptyText="Sub Unit Kerja tidak ditemukan."
                      allLabel="-- Semua Sub-Unit Kerja --"
                      icon={<Layers className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                      disabled={isLoadingUnitKerja}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full border-collapse">
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-b border-border/40">
                      <TableHead className="text-xs font-semibold w-12 text-center">No</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[180px]">Pegawai & NIP</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[170px]">Username & Kontak</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[210px]">Unit / Sub-Unit Kerja</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[150px]">Hak Akses (Role)</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-28">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-right min-w-[150px] pr-4">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                            <span className="text-xs">Memuat data pengguna aktif...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : activeUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <UsersIcon className="h-8 w-8 stroke-1 text-muted-foreground" />
                            <span className="text-sm font-medium">Tidak ada pengguna aktif</span>
                            <span className="text-xs text-muted-foreground">
                              {search
                                ? `Tidak ditemukan data dengan kata kunci "${search}"`
                                : 'Buka tab "Direktori Akun E-Gov" untuk menetapkan role bagi pegawai.'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeUsers.map((u: any, idx: number) => (
                        <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {(pageUsers - 1) * 10 + idx + 1}.
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <div className="font-semibold text-xs text-foreground leading-snug">
                              {u.nama}
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                              NIP. {u.nip || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <span className="font-mono text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block">
                              @{u.username}
                            </span>
                            <div className="flex items-center gap-1.5 text-muted-foreground mt-1 text-[11px]">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <div className="text-xs font-medium text-foreground">
                              {u.unitKerjaNama || '-'}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {u.instansiNama}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <Badge
                              variant="secondary"
                              className="font-medium text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            >
                              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                              {u.role?.nama}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 align-top text-center">
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1 py-0 px-2 font-medium">
                              <CheckCircle2 className="h-3 w-3" /> Aktif
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right align-top pr-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenSetRole(u)}
                                className="h-7 px-2.5 text-xs gap-1 whitespace-nowrap"
                              >
                                <Edit3 className="h-3 w-3" />
                                Ubah Role
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenRevokeRole(u)}
                                className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                                title="Cabut Akses Role"
                              >
                                <UserX className="h-3 w-3" />
                                Cabut
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Tab 1 */}
              <div className="p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                <div>
                  Menampilkan{' '}
                  <strong className="text-foreground">
                    {activeUsers.length > 0 ? (pageUsers - 1) * 10 + 1 : 0}
                  </strong>{' '}
                  sampai{' '}
                  <strong className="text-foreground">
                    {Math.min(pageUsers * 10, totalActiveUsers)}
                  </strong>{' '}
                  dari <strong className="text-foreground">{totalActiveUsers}</strong> pengguna aktif
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageUsers <= 1}
                    onClick={() => setPageUsers((p) => Math.max(p - 1, 1))}
                    className="h-8 text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Sebelumnya
                  </Button>
                  <span className="text-xs px-2 font-mono">
                    Halaman {pageUsers} / {totalPagesUsers}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageUsers >= totalPagesUsers}
                    onClick={() => setPageUsers((p) => p + 1)}
                    className="h-8 text-xs"
                  >
                    Selanjutnya
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: DIREKTORI SELURUH AKUN E-GOV & SIMPEG             */}
        {/* ========================================================= */}
        <TabsContent value="egov_directory" className="space-y-4 m-0">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Direktori Akun Pegawai ASN E-Gov
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Daftar seluruh akun ASN Pemerintah Kabupaten Konawe Selatan untuk penugasan & registrasi hak akses role APLI DAKOP
                  </CardDescription>
                </div>

                {(selectedInstansi !== 'all' || selectedUnitKerja !== 'all' || search) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedInstansi('all');
                      setSelectedUnitKerja('all');
                      setSearch('');
                      setPageDirectory(1);
                    }}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 self-start sm:self-auto"
                    title="Reset Semua Filter"
                  >
                    <FilterX className="h-3.5 w-3.5" />
                    Reset Filter
                  </Button>
                )}
              </div>

              {/* Toolbar Filter Tab 2 */}
              <div className="space-y-3 pt-1">
                {/* Baris 1: Pencarian */}
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari NIP, nama pegawai, atau username di seluruh E-Gov..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPageDirectory(1);
                    }}
                    className="pl-8 text-xs h-9 bg-background w-full"
                  />
                </div>

                {/* Baris 2: Sejajar 2 Kolom Unit Kerja & Sub Unit Kerja */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="w-full">
                    <SearchableCombobox
                      value={selectedInstansi}
                      onValueChange={(val) => {
                        setSelectedInstansi(val);
                        setSelectedUnitKerja('all');
                        setPageDirectory(1);
                      }}
                      items={instansiOptions}
                      placeholder="Pilih Unit Kerja (OPD)..."
                      searchPlaceholder="Ketik nama Unit Kerja / OPD..."
                      emptyText="Unit Kerja tidak ditemukan."
                      allLabel="-- Semua Unit Kerja (OPD) --"
                      icon={<Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                    />
                  </div>

                  <div className="w-full">
                    <SearchableCombobox
                      value={selectedUnitKerja}
                      onValueChange={(val) => {
                        setSelectedUnitKerja(val);
                        setPageDirectory(1);
                      }}
                      items={unitKerjaOptions}
                      placeholder={isLoadingUnitKerja ? 'Memuat Sub Unit...' : 'Pilih Sub-Unit Kerja...'}
                      searchPlaceholder="Ketik nama Sub Unit Kerja..."
                      emptyText="Sub Unit Kerja tidak ditemukan."
                      allLabel="-- Semua Sub-Unit Kerja --"
                      icon={<Layers className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                      disabled={isLoadingUnitKerja}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full border-collapse">
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-b border-border/40">
                      <TableHead className="text-xs font-semibold w-12 text-center">No</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[180px]">Pegawai & NIP</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[170px]">Username & Kontak</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[210px]">Unit / Sub-Unit Kerja</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[150px]">Hak Akses APLI DAKOP</TableHead>
                      <TableHead className="text-xs font-semibold text-right min-w-[140px] pr-4">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingDirectory ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            <span className="text-xs">Menghubungkan ke server master E-Gov & SIMPEG...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : directoryUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Database className="h-8 w-8 stroke-1 text-muted-foreground" />
                            <span className="text-sm font-medium">Tidak ada data pegawai ASN</span>
                            <span className="text-xs text-muted-foreground">
                              {search
                                ? `Tidak ditemukan data dengan kata kunci "${search}"`
                                : 'Server E-Gov tidak mengembalikan data.'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      directoryUsers.map((item: any, idx: number) => (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {(pageDirectory - 1) * 10 + idx + 1}.
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <div className="font-semibold text-xs text-foreground leading-snug">
                              {item.nama}
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                              NIP. {item.nip || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded inline-block">
                              @{item.username}
                            </span>
                            <div className="flex items-center gap-1.5 text-muted-foreground mt-1 text-[11px]">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{item.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <div className="text-xs font-medium text-foreground">
                              {item.unitKerjaNama || '-'}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {item.instansiNama}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            {item.hasRole ? (
                              <Badge
                                variant="secondary"
                                className="font-medium text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                              >
                                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                                {item.role?.nama}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px] font-normal">
                                Belum Diberi Akses
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-right align-top pr-4">
                            <Button
                              size="sm"
                              onClick={() => handleOpenSetRole(item)}
                              className="h-7 px-2.5 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shrink-0 whitespace-nowrap"
                            >
                              <UserPlus className="h-3 w-3 shrink-0" />
                              <span>{item.hasRole ? 'Ubah Role' : 'Tetapkan Role'}</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Tab 2 */}
              <div className="p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                <div>
                  Menampilkan{' '}
                  <strong className="text-foreground">
                    {directoryUsers.length > 0 ? (pageDirectory - 1) * 10 + 1 : 0}
                  </strong>{' '}
                  sampai{' '}
                  <strong className="text-foreground">
                    {Math.min(pageDirectory * 10, totalDirectory)}
                  </strong>{' '}
                  dari <strong className="text-foreground">{totalDirectory}</strong> akun E-Gov
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageDirectory <= 1}
                    onClick={() => setPageDirectory((p) => Math.max(p - 1, 1))}
                    className="h-8 text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Sebelumnya
                  </Button>
                  <span className="text-xs px-2 font-mono">
                    Halaman {pageDirectory} / {totalPagesDirectory}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageDirectory >= totalPagesDirectory}
                    onClick={() => setPageDirectory((p) => p + 1)}
                    className="h-8 text-xs"
                  >
                    Selanjutnya
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Set Role Modal */}
      <SetRoleDialog
        open={setRoleOpen}
        onOpenChange={setSetRoleOpen}
        target={targetPegawai}
        roles={roles}
      />

      {/* Revoke Role Modal */}
      <RevokeRoleDialog
        open={revokeRoleOpen}
        onOpenChange={setRevokeRoleOpen}
        target={targetPegawai}
      />
    </div>
  );
}
