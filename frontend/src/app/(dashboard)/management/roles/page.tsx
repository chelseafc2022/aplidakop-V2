'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ShieldCheck, Plus, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export default function ManagementRolesPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Local state for editing permissions matrix
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, { canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }>>({});

  const { data: roles } = useQuery({
    queryKey: ['management-roles'],
    queryFn: async () => {
      const res = await api.get('/management/roles');
      if (res.data?.length > 0 && !selectedRoleId) {
        setSelectedRoleId(res.data[0].id);
        initPermissions(res.data[0]);
      }
      return res.data;
    },
  });

  const { data: menus } = useQuery({
    queryKey: ['management-menus'],
    queryFn: async () => (await api.get('/management/menus')).data,
  });

  const initPermissions = (role: any) => {
    const initial: any = {};
    role.permissions?.forEach((p: any) => {
      initial[p.menuId] = {
        canRead: p.canRead,
        canCreate: p.canCreate,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
      };
    });
    setPermissionsMatrix(initial);
  };

  const handleSelectRole = (role: any) => {
    setSelectedRoleId(role.id);
    initPermissions(role);
  };

  const handleToggle = (menuId: string, field: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete', val: boolean) => {
    setPermissionsMatrix((prev) => ({
      ...prev,
      [menuId]: {
        canRead: prev[menuId]?.canRead ?? false,
        canCreate: prev[menuId]?.canCreate ?? false,
        canUpdate: prev[menuId]?.canUpdate ?? false,
        canDelete: prev[menuId]?.canDelete ?? false,
        [field]: val,
      },
    }));
  };

  const savePermissionsMutation = useMutation({
    mutationFn: () => {
      const formatted = Object.entries(permissionsMatrix).map(([menuId, perms]) => ({
        menuId,
        canRead: perms.canRead,
        canCreate: perms.canCreate,
        canUpdate: perms.canUpdate,
        canDelete: perms.canDelete,
      }));
      return api.post('/management/permissions', {
        roleId: selectedRoleId,
        permissions: formatted,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-roles'] });
      toast.success('Matriks hak akses RBAC berhasil disimpan!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menyimpan hak akses'),
  });

  const createRoleMutation = useMutation({
    mutationFn: () => api.post('/management/roles', { nama: newRoleName, keterangan: newRoleDesc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-roles'] });
      toast.success('Role baru berhasil dibuat');
      setIsAddOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal membuat role'),
  });

  return (
    <div className="px-4 lg:px-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Role & RBAC (Hak Akses)</h1>
          <p className="text-sm text-muted-foreground">Konfigurasi dinamis hak baca, tambah, ubah, dan hapus per menu</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Role Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role list sidebar */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Daftar Kelompok Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles?.map((r: any) => (
              <button
                key={r.id}
                onClick={() => handleSelectRole(r)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                  selectedRoleId === r.id
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'border-border/40 hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{r.nama}</span>
                  <ShieldCheck className="w-4 h-4 opacity-70" />
                </div>
                <div className="text-xs font-normal text-muted-foreground mt-1 line-clamp-1">
                  {r.keterangan || 'Tidak ada keterangan'}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Permissions Matrix */}
        <Card className="lg:col-span-3 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Matriks Hak Akses Menu: <span className="text-emerald-500">{roles?.find((r: any) => r.id === selectedRoleId)?.nama}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Atur kewenangan setiap menu (Read, Create, Update, Delete)
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => savePermissionsMutation.mutate()}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Simpan Matriks
            </Button>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="px-4 py-3">Nama Menu</th>
                    <th className="px-4 py-3">URL Rute</th>
                    <th className="px-4 py-3 text-center">Buka (Read)</th>
                    <th className="px-4 py-3 text-center">Tambah (Create)</th>
                    <th className="px-4 py-3 text-center">Ubah (Update)</th>
                    <th className="px-4 py-3 text-center">Hapus (Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {menus?.map((m: any) => {
                    const current = permissionsMatrix[m.id] || { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
                    return (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{m.title}</td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{m.url}</td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={current.canRead}
                            onCheckedChange={(val) => handleToggle(m.id, 'canRead', !!val)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={current.canCreate}
                            onCheckedChange={(val) => handleToggle(m.id, 'canCreate', !!val)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={current.canUpdate}
                            onCheckedChange={(val) => handleToggle(m.id, 'canUpdate', !!val)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={current.canDelete}
                            onCheckedChange={(val) => handleToggle(m.id, 'canDelete', !!val)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Kelompok Role Baru</DialogTitle>
            <DialogDescription>Tambahkan role atau grup otorisasi pengguna baru.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nama Role *</Label>
              <Input
                placeholder="Contoh: OPERATOR_DINAS"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1">
              <Label>Keterangan</Label>
              <Input
                placeholder="Deskripsi tugas dan tanggung jawab..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => createRoleMutation.mutate()}>
                Buat Role
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
