'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Search,
  Filter,
  Building,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function ManagementUsersPage() {
  const queryClient = useQueryClient();

  // State Filters
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInstansi, setSelectedInstansi] = useState<string>('');
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('true'); // Default: sudah memiliki role

  // State Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    nama: '',
    nip: '',
    email: '',
    hp: '',
    roleId: '',
    unitKerjaId: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    username: '',
    nama: '',
    email: '',
    hp: '',
    roleId: '',
    unitKerjaId: '',
  });

  const [newPassword, setNewPassword] = useState('');

  // 1. Ambil daftar Instansi (OPD Induk)
  const { data: instansiList } = useQuery({
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
        setSelectedInstansi(String(instansiList[0].id));
      }
    }
  }, [instansiList, selectedInstansi]);

  // 2. Ambil daftar Sub Unit Kerja berdasarkan instansi terpilih
  const { data: unitKerjaList } = useQuery({
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
  const { data: roles } = useQuery({
    queryKey: ['management-roles'],
    queryFn: async () => (await api.get('/management/roles')).data,
  });

  // 4. Ambil data users dengan query params lengkap
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: [
      'management-users',
      page,
      limit,
      searchTerm,
      selectedInstansi,
      selectedUnitKerja,
      selectedRoleFilter,
    ],
    queryFn: async () => {
      const res = await api.get('/management/users', {
        params: {
          page,
          limit,
          search: searchTerm,
          instansiId: selectedInstansi !== 'all' ? selectedInstansi : undefined,
          unitKerjaId: selectedUnitKerja !== 'all' ? selectedUnitKerja : undefined,
          hasRole: selectedRoleFilter,
        },
      });
      return res.data;
    },
  });

  const users = usersResponse?.data || [];
  const totalUsers = usersResponse?.total || 0;
  const totalPages = usersResponse?.totalPages || 1;

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.post('/management/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-users'] });
      toast.success('Pengguna baru berhasil diregistrasi');
      setIsAddOpen(false);
      setNewUser({
        username: '',
        password: '',
        nama: '',
        nip: '',
        email: '',
        hp: '',
        roleId: '',
        unitKerjaId: '',
      });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mendaftarkan pengguna baru'),
  });

  const editUserMutation = useMutation({
    mutationFn: (data: any) => api.put('/management/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-users'] });
      toast.success('Data pengguna & hak akses berhasil diperbarui');
      setIsEditOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mengubah data pengguna'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.post('/management/users/reset-password', { userId, password }),
    onSuccess: () => {
      toast.success('Password pengguna berhasil diubah');
      setIsResetOpen(false);
      setNewPassword('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mereset password'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete('/management/users', { data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-users'] });
      toast.success('Pengguna berhasil dihapus');
      setIsDeleteOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus pengguna'),
  });

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setEditFormData({
      id: user.id,
      username: user.username,
      nama: user.nama,
      email: user.email,
      hp: user.hp || '',
      roleId: String(user.role?.id || '1'),
      unitKerjaId: String(user.unitKerjaId || ''),
    });
    setIsEditOpen(true);
  };

  const handleOpenReset = (user: any) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsResetOpen(true);
  };

  const handleOpenDelete = (user: any) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  return (
    <div className="px-4 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-teal-600 dark:text-teal-400 border-teal-500/30 text-xs">
              <Users className="w-3.5 h-3.5 mr-1" />
              Autentikasi & Akun Pegawai
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
            Registrasi & Manajemen Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kelola akun operator dinas dan kewilayahan berbasis unit kerja, sub-unit kerja, dan penugasan role RBAC
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs shrink-0">
          <UserPlus className="w-4 h-4 mr-1.5" />
          Tambah Pengguna Baru
        </Button>
      </div>

      {/* Filter Bar Terpadu (Unit Kerja, Sub-Unit Kerja, Status Role, & Search) */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter 1: Unit Kerja (Instansi OPD) */}
            <div className="w-full sm:w-[220px] shrink-0">
              <Label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Unit Kerja / Instansi
              </Label>
              <Select
                value={selectedInstansi}
                onValueChange={(val) => {
                  setSelectedInstansi(val);
                  setSelectedUnitKerja('all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <Building className="w-3.5 h-3.5 mr-1 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Pilih Instansi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Semua Instansi Pemerintah</SelectItem>
                  {instansiList?.map((inst: any) => (
                    <SelectItem key={inst.id} value={String(inst.id)} className="text-xs">
                      {inst.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter 2: Sub-Unit Kerja (Bidang) */}
            <div className="w-full sm:w-[230px] shrink-0">
              <Label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Sub-Unit Kerja / Bidang
              </Label>
              <Select
                value={selectedUnitKerja}
                onValueChange={(val) => {
                  setSelectedUnitKerja(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <Briefcase className="w-3.5 h-3.5 mr-1 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Semua Sub-Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Semua Sub-Unit Kerja</SelectItem>
                  {unitKerjaList?.map((uk: any) => (
                    <SelectItem key={uk.id} value={String(uk.id)} className="text-xs">
                      {uk.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter 3: Status Penugasan Role (Default: Sudah Memiliki Role) */}
            <div className="w-full sm:w-[210px] shrink-0">
              <Label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Status Role (Otorisasi)
              </Label>
              <Select
                value={selectedRoleFilter}
                onValueChange={(val) => {
                  setSelectedRoleFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                  <SelectValue placeholder="Status Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true" className="text-xs">
                    Sudah Punya Role (Dinkop)
                  </SelectItem>
                  <SelectItem value="all" className="text-xs">
                    Semua Akun (Seluruh Master)
                  </SelectItem>
                  <SelectItem value="false" className="text-xs">
                    Belum Memiliki Role
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter 4: Pencarian Nama / Username */}
            <div className="flex-1 min-w-[200px]">
              <Label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Pencarian Pengguna
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Cari nama pegawai, NIP, username..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Pengguna */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 uppercase text-[11px] font-semibold text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="px-4 py-3 text-center w-12">No</th>
                  <th className="px-4 py-3">Nama Pegawai & NIP</th>
                  <th className="px-4 py-3">Username & Kontak</th>
                  <th className="px-4 py-3">Unit & Sub-Unit Kerja</th>
                  <th className="px-4 py-3 text-center">Kelompok Role (RBAC)</th>
                  <th className="px-4 py-3 text-center w-36">#Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-muted-foreground">
                      Memuat data pengguna dari database...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-muted-foreground">
                      Tidak ada akun pengguna yang sesuai dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  users.map((u: any, idx: number) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                        {(page - 1) * limit + idx + 1}.
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground text-xs">{u.nama}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          NIP: {u.nip || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded inline-block">
                          @{u.username}
                        </span>
                        <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                          <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate text-[11px]">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-xs">
                          {u.unitKerjaNama && u.unitKerjaNama !== '-'
                            ? u.unitKerjaNama
                            : 'Sub-Unit Belum Diatur'}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {u.instansiNama}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.hasRole ? (
                          <Badge
                            variant="secondary"
                            className="font-medium text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          >
                            <Shield className="w-3 h-3 mr-1 text-emerald-600" />
                            {u.role?.nama}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Belum Ada Role
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Tombol Ganti Password */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Ubah Password"
                            onClick={() => handleOpenReset(u)}
                            className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>

                          {/* Tombol Edit Profil & Role */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Ubah Data & Role"
                            onClick={() => handleOpenEdit(u)}
                            className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-500/10"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>

                          {/* Tombol Hapus User */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Hapus Pengguna"
                            onClick={() => handleOpenDelete(u)}
                            className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-500/10"
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

          {/* Pagination Controls */}
          <div className="p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              Menampilkan{' '}
              <strong className="text-foreground">
                {users.length > 0 ? (page - 1) * limit + 1 : 0}
              </strong>{' '}
              sampai{' '}
              <strong className="text-foreground">
                {Math.min(page * limit, totalUsers)}
              </strong>{' '}
              dari <strong className="text-foreground">{totalUsers}</strong> akun pengguna
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="h-8 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Sebelumnya
              </Button>
              <span className="text-xs px-2 font-mono">
                Halaman {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 text-xs"
              >
                Selanjutnya
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Registrasi Pengguna Baru */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600">
              <UserPlus className="w-5 h-5" />
              <DialogTitle>Registrasi Pengguna Baru</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Daftarkan akun pegawai baru dan tetapkan sub-unit kerja serta kelompok role RBAC-nya.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Username *</Label>
                <Input
                  placeholder="operator_konsel"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                    })
                  }
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Password *</Label>
                <Input
                  type="password"
                  placeholder="Min. 6 karakter"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Nama Lengkap Pegawai *</Label>
              <Input
                placeholder="Contoh: Muhammad Riswan, S.Kom"
                value={newUser.nama}
                onChange={(e) => setNewUser({ ...newUser, nama: e.target.value })}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">NIP / Identitas</Label>
                <Input
                  placeholder="19850101..."
                  value={newUser.nip}
                  onChange={(e) => setNewUser({ ...newUser, nip: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">No. Handphone / WA</Label>
                <Input
                  placeholder="08123456789"
                  value={newUser.hp}
                  onChange={(e) => setNewUser({ ...newUser, hp: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email Pegawai</Label>
              <Input
                type="email"
                placeholder="nama@konaweselatankab.go.id"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Sub-Unit Kerja / Bidang *</Label>
              <Select
                value={newUser.unitKerjaId}
                onValueChange={(val) => setNewUser({ ...newUser, unitKerjaId: val })}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Pilih Sub-Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  {unitKerjaList?.map((uk: any) => (
                    <SelectItem key={uk.id} value={String(uk.id)} className="text-xs">
                      {uk.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kelompok Role (RBAC) *</Label>
              <Select
                value={newUser.roleId}
                onValueChange={(val) => setNewUser({ ...newUser, roleId: val })}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Pilih Kelompok Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)} className="text-xs">
                      {r.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              disabled={
                !newUser.username ||
                !newUser.password ||
                !newUser.nama ||
                createUserMutation.isPending
              }
              onClick={() => createUserMutation.mutate(newUser)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              {createUserMutation.isPending ? 'Menyimpan...' : 'Daftarkan Pengguna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Profil & Role */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <Pencil className="w-5 h-5" />
              <DialogTitle>Ubah Data & Otorisasi Pengguna</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Perbarui username, email, dan kelompok hak akses role untuk <strong>{selectedUser?.nama}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Username</Label>
              <Input
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">No. Handphone / WA</Label>
              <Input
                value={editFormData.hp}
                onChange={(e) => setEditFormData({ ...editFormData, hp: e.target.value })}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Penugasan Kelompok Role (RBAC)</Label>
              <Select
                value={editFormData.roleId}
                onValueChange={(val) => setEditFormData({ ...editFormData, roleId: val })}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Pilih Kelompok Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)} className="text-xs">
                      {r.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              disabled={editUserMutation.isPending}
              onClick={() => editUserMutation.mutate(editFormData)}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs"
            >
              {editUserMutation.isPending ? 'Menyimpan...' : 'Perbarui Pengguna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Reset Password */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600">
              <KeyRound className="w-5 h-5" />
              <DialogTitle>Ubah Password Pengguna</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Masukkan kata sandi baru untuk akun <strong>@{selectedUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Password Baru *</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsResetOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              disabled={!newPassword || newPassword.length < 6 || resetPasswordMutation.isPending}
              onClick={() =>
                resetPasswordMutation.mutate({
                  userId: selectedUser.id,
                  password: newPassword,
                })
              }
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              {resetPasswordMutation.isPending ? 'Menyimpan...' : 'Simpan Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus Pengguna */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <DialogTitle>Hapus Akun Pengguna?</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus akun <strong>{selectedUser?.nama}</strong> (@{selectedUser?.username})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              disabled={deleteUserMutation.isPending}
              onClick={() => deleteUserMutation.mutate(selectedUser.id)}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs"
            >
              {deleteUserMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
