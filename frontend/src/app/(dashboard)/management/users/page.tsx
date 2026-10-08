'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Users, UserPlus, KeyRound, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export default function ManagementUsersPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    nama: '',
    email: '',
    roleId: '',
    instansiNama: 'Dinas Koperasi dan UMKM Kab. Konawe Selatan',
    unitKerjaNama: 'Bidang UMKM',
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['management-users'],
    queryFn: async () => (await api.get('/management/users')).data,
  });

  const { data: roles } = useQuery({
    queryKey: ['management-roles'],
    queryFn: async () => (await api.get('/management/roles')).data,
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/register', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-users'] });
      toast.success('Pengguna baru berhasil ditambahkan');
      setIsAddOpen(false);
      setNewUser({
        username: '',
        password: '',
        nama: '',
        email: '',
        roleId: '',
        instansiNama: 'Dinas Koperasi dan UMKM Kab. Konawe Selatan',
        unitKerjaNama: 'Bidang UMKM',
      });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mendaftarkan user'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      api.put(`/management/users/${userId}/role`, { roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-users'] });
      toast.success('Role pengguna berhasil diperbarui');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mengubah role'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.put(`/management/users/${userId}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-users'] });
      toast.success('Status pengguna berhasil diubah');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mengubah status'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.put(`/management/users/${userId}/reset-password`, { password }),
    onSuccess: () => {
      toast.success('Password berhasil direset');
      setIsResetOpen(false);
      setNewPassword('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mereset password'),
  });

  return (
    <div className="px-4 lg:px-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-sm text-muted-foreground">Kelola akun pegawai, operator kecamatan, dan hak akses sistem</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Pengguna
        </Button>
      </div>

      <Card className="border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-4 py-3">Nama Pegawai</th>
                <th className="px-4 py-3">Username & Email</th>
                <th className="px-4 py-3">Kelompok / Role</th>
                <th className="px-4 py-3 text-center">Status Akun</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Memuat pengguna...</td></tr>
              ) : (
                users?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      <div>{u.nama}</div>
                      <div className="text-xs text-muted-foreground">{u.unitKerjaNama || u.instansiNama || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-mono font-medium">@{u.username}</div>
                      <div className="text-muted-foreground">{u.email || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        defaultValue={u.roleId || ''}
                        onValueChange={(newRoleId) => updateRoleMutation.mutate({ userId: u.id, roleId: newRoleId })}
                      >
                        <SelectTrigger className="h-8 text-xs w-[180px]">
                          <SelectValue placeholder="Pilih Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles?.map((r: any) => (
                            <SelectItem key={r.id} value={r.id}>{r.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={u.isActive}
                          onCheckedChange={(checked) => toggleStatusMutation.mutate({ userId: u.id, isActive: checked })}
                        />
                        <span className="text-xs">{u.isActive ? 'Aktif' : 'Non-Aktif'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsResetOpen(true);
                        }}
                      >
                        <KeyRound className="w-3.5 h-3.5 mr-1" />
                        Reset Sandi
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>Registrasi akun baru untuk akses sistem APLI DAKOP.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createUserMutation.mutate(newUser); }} className="space-y-3">
            <div className="space-y-1">
              <Label>Nama Lengkap *</Label>
              <Input value={newUser.nama} onChange={(e) => setNewUser({ ...newUser, nama: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Username *</Label>
              <Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Password *</Label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Role / Kelompok User</Label>
              <Select value={newUser.roleId} onValueChange={(val) => setNewUser({ ...newUser, roleId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">Daftarkan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Masukkan password baru untuk {selectedUser?.nama}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Password baru (min. 6 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetOpen(false)}>Batal</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => resetPasswordMutation.mutate({ userId: selectedUser.id, password: newPassword })}
              >
                Reset Sandi
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
